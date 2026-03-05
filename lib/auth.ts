import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { DEFAULT_USER_AVATAR, USER_AVATAR_VALUES } from "@/lib/profile-avatars";
import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/validation/auth";

const USER_AVATAR_VALUE_SET = new Set<string>(USER_AVATAR_VALUES);

function clearAuthToken(token: JWT) {
  delete token.id;
  delete token.role;
  delete token.avatar;
  delete token.sessionVersion;
  delete token.email;
  delete token.name;
  delete token.picture;
  token.isFrozen = false;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "E-mail a heslo",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Heslo", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const passwordMatches = await compare(password, user.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        if (user.isFrozen) {
          throw new Error("ACCOUNT_FROZEN");
        }

        if (!user.emailVerifiedAt) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar ?? DEFAULT_USER_AVATAR,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (account?.provider === "credentials" && user) {
        token.id = user.id;
        token.role = user.role;
        token.avatar =
          typeof user.avatar === "string" ? user.avatar : DEFAULT_USER_AVATAR;
        token.sessionVersion =
          typeof user.sessionVersion === "number" ? user.sessionVersion : 0;
        token.isFrozen = false;
      }

      if (
        trigger === "update" &&
        typeof session?.avatar === "string" &&
        USER_AVATAR_VALUE_SET.has(session.avatar)
      ) {
        token.avatar = session.avatar;
      }

      const tokenUserId =
        typeof token.id === "string" && token.id.length > 0 ? token.id : null;
      const tokenEmail =
        typeof token.email === "string" && token.email.length > 0
          ? token.email.toLowerCase()
          : null;

      if (!tokenUserId && !tokenEmail) {
        return token;
      }

      const dbUser = tokenUserId
        ? await prisma.user.findUnique({
            where: { id: tokenUserId },
            select: { id: true, role: true, avatar: true, isFrozen: true, sessionVersion: true },
          })
        : await prisma.user.findUnique({
            where: { email: tokenEmail! },
            select: { id: true, role: true, avatar: true, isFrozen: true, sessionVersion: true },
          });

      if (!dbUser) {
        clearAuthToken(token);
        return token;
      }

      if (dbUser.isFrozen) {
        clearAuthToken(token);
        token.isFrozen = true;
        return token;
      }

      if (
        typeof token.sessionVersion === "number"
        && token.sessionVersion !== dbUser.sessionVersion
      ) {
        clearAuthToken(token);
        return token;
      }

      token.id = dbUser.id;
      token.role = dbUser.role;
      token.avatar = dbUser.avatar ?? DEFAULT_USER_AVATAR;
      token.sessionVersion = dbUser.sessionVersion;
      token.isFrozen = false;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const tokenUserId = typeof token.id === "string" ? token.id : "";
        const isTokenValid =
          !token.isFrozen
          && tokenUserId.length > 0;

        session.user.id = isTokenValid ? tokenUserId : "";
        session.user.role = isTokenValid && token.role === "ADMIN" ? "ADMIN" : "USER";
        session.user.avatar =
          isTokenValid && typeof token.avatar === "string"
            ? token.avatar
            : DEFAULT_USER_AVATAR;
      }

      return session;
    },
  },
};
