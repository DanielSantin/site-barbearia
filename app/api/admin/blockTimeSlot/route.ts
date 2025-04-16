import clientPromise from "@/lib/utils/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
const { ObjectId } = require("mongodb");

// API para bloquear um horário específico (apenas para admins)
export async function POST(req: Request) {
  try {
    // Verificar se o usuário está autenticado e é admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const dbAuth = client.db("auth");

    // Verificar se é admin
    const userId = session.user._id;
    const userCollection = dbAuth.collection("users");
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { date, timeSlotIndex, service } = await req.json();

    if (!date || timeSlotIndex === undefined) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const schedulesCollection = db.collection("schedules");
    
    // Buscar agendamento
    const schedule = await schedulesCollection.findOne({ date });
    
    if (!schedule) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }
    
    // Verificar se o horário já está reservado
    if (schedule.timeSlots[timeSlotIndex]?.booked) {
      return NextResponse.json({ error: "Horário já está reservado" }, { status: 400 });
    }
    
    // Bloquear o horário
    await schedulesCollection.updateOne(
      { date },
      { 
        $set: { 
          [`timeSlots.${timeSlotIndex}.booked`]: true,
          [`timeSlots.${timeSlotIndex}.userId`]: null, // Indica que foi bloqueado pelo admin
          [`timeSlots.${timeSlotIndex}.service`]: service || "Bloqueado",
          [`timeSlots.${timeSlotIndex}.blockedByAdmin`]: true
        } 
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro na API POST blockTimeSlot:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}