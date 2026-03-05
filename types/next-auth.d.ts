import { UserRole } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      avatar: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    avatar?: string | null;
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    avatar?: string;
    isFrozen?: boolean;
    sessionVersion?: number;
  }
}
