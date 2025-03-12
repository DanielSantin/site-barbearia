import clientPromise from "@/lib/utils/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
const { ObjectId } = require("mongodb");

// API para listar todos os usuários (apenas para admins)
export async function GET(req: Request) {
  try {
    // Verificar se o usuário está autenticado e é admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const client = await clientPromise; 
    const dbAuth = client.db("auth")

    // Verificar se é admin
    const userId = session.user.id;
    const userCollection = dbAuth.collection("users");
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Buscar todos os usuários
    const users = await userCollection.find({}).project({
      password: 0, // Excluir senhas da resposta
    }).toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error("Erro na API GET admin/users:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}