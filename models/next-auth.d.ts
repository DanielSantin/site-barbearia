import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phone?: string | null;
      whatsappVerified?: boolean;
      whatsappPhone?: string | null;
      isBanned?: boolean
      isAdmin?: boolean
    } & DefaultSession["user"];
    isValid?: boolean;
    phone?: string | null;
    whatsappVerified?: boolean;
    whatsappPhone?: string | null;
    isAdmin?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    isValid?: boolean;
    isBanned?: boolean;
    whatsappVerified?: boolean;
    whatsappPhone?: string | null;
  }
}