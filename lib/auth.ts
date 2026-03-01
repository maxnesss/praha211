import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { DEFAULT_USER_AVATAR, USER_AVATAR_VALUES } from "@/lib/profile-avatars";
import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/validation/auth";

const USER_AVATAR_VALUE_SET = new Set<string>(USER_AVATAR_VALUES);

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

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar ?? DEFAULT_USER_AVATAR,
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
      }

      if (
        trigger === "update" &&
        typeof session?.avatar === "string" &&
        USER_AVATAR_VALUE_SET.has(session.avatar)
      ) {
        token.avatar = session.avatar;
      }

      const shouldHydrateFromDb = !token.id || !token.role || !token.avatar;

      if (shouldHydrateFromDb && typeof token.email === "string") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase() },
          select: { id: true, role: true, avatar: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.avatar = dbUser.avatar ?? DEFAULT_USER_AVATAR;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "USER";
        session.user.avatar =
          typeof token.avatar === "string" ? token.avatar : DEFAULT_USER_AVATAR;
      }

      return session;
    },
  },
};
