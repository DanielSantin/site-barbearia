import NextAuth, { DefaultSession } from "next-auth";
import { User } from "@/models/types"

declare module "next-auth" {
  interface Session {
    user: User & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    isValid?: boolean;
    isBanned?: boolean;
    isAdmin?: boolean;
    whatsappVerified?: boolean;
    whatsappPhone?: string | null;
  }
}