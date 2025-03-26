import clientPromise from "@/lib/utils/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
const { ObjectId } = require("mongodb");
export const dynamic = 'force-dynamic';

// API para verificar se o usuário é admin
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    const client = await clientPromise;
    const dbAuth = client.db("auth");
    
    const userId = session.user.id;
    const userCollection = dbAuth.collection("users");
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    
    return NextResponse.json({ isAdmin: user?.isAdmin === true });
  } catch (error) {
    console.error("Erro na API GET isAdmin:", error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}