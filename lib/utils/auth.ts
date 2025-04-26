import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./db";

const { ObjectId } = require("mongodb");

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    collections: {
      Accounts: "accounts",
      Sessions: "sessions",
      Users: "users",
      VerificationTokens: "verificationTokens",
    },
    databaseName: process.env.DB_NAME,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Se o usuário está se autenticando, adiciona os dados extras ao token
      if (user) {
        token.userId = user.id;
        try {
          const client = await clientPromise;
          const db = client.db(process.env.DB_NAME);
    
          const userData = await db.collection("users").findOne({ _id: new ObjectId(user.id) });
          
          if (userData) {
            token.isAdmin = userData.isAdmin ?? false;
            token.isBanned = userData.isBanned ?? false;
            token.whatsappVerified = true;
            //token.whatsappVerified = userData.whatsappVerified ?? true;
            token.whatsappPhone = userData.whatsappPhone || null;
          } else {
            token.isBanned = false;
            token.whatsappVerified = false;
            token.whatsappPhone = null;
          }
        } catch (error) {
          console.error("Erro ao atualizar dados do token:", error);
          token.isBanned = false;
          token.whatsappVerified = false;
          token.whatsappPhone = null;
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (session?.user && token) {
        session.user._id = token.userId as string;
        session.user.whatsappVerified = token.whatsappVerified || false;
        session.user.isBanned = token.isBanned || false;
        session.user.isAdmin = token.isAdmin || false;
      }
      return session;
    }
  },
  events: {
    async signIn({ user }) {
      try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME);
        const userData = await db.collection("users").findOne({ _id: new ObjectId(user.id) });

        if (userData?.isBanned) {
          throw new Error("Usuário banido.");
        }
      } catch (error) {
        console.error("Erro ao verificar banimento:", error);
        throw new Error("Erro interno ao verificar banimento.");
      }
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};