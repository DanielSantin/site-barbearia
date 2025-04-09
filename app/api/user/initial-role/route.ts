// app/api/set-initial-role/route.ts

import clientPromise from "@/lib/utils/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
const { ObjectId } = require("mongodb");

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?._id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user._id;
    const { isCalouro } = await req.json(); 

    if (typeof isCalouro !== "boolean") {
      return NextResponse.json({ error: "Parâmetro inválido" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("auth");
    const userCollection = db.collection("users");

    const user = await userCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (user.accountRole) {
      return NextResponse.json({ error: "Role já definida" }, { status: 403 });
    }

    const newRole = isCalouro ? "Calouro" : "Cliente";

    await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { accountRole: newRole } }
    );

    return NextResponse.json({ success: true, role: newRole });
  } catch (error) {
    console.error("Erro na API POST set-initial-role:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
