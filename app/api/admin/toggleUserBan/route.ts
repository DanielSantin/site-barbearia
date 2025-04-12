import clientPromise from "@/lib/utils/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
const { ObjectId } = require("mongodb");

// API para bloquear ou desbloquear um usuário
export async function POST(req: Request) {
  try {
    // Verificar se o usuário está autenticado e é admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const client = await clientPromise;
    const dbAuth = client.db("auth");

    // Verificar se é admin
    const adminId = session.user._id;
    const userCollection = dbAuth.collection("users");
    const adminUser = await userCollection.findOne({ _id: new ObjectId(adminId) });
    
    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { userId, isBanned } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não fornecido" }, { status: 400 });
    }

    // Verificar se o usuário existe
    const targetUser = await userCollection.findOne({ _id: new ObjectId(userId) });
    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Não permitir que um admin seja banido (proteção adicional)
    if (targetUser.isAdmin && isBanned) {
      return NextResponse.json({ error: "Não é possível bloquear um administrador" }, { status: 400 });
    }

    // Atualizar o status de banimento do usuário
    await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { 
        isBanned: isBanned,
        strikes: 0
       } }
      
    );
    
    return NextResponse.json({ 
      success: true,
      message: isBanned ? "Usuário bloqueado com sucesso" : "Usuário desbloqueado com sucesso" 
    });
  } catch (error) {
    console.error("Erro na API POST toggleUserBan:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}