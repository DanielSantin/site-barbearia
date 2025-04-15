import clientPromise from "@/lib/utils/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
const { ObjectId } = require("mongodb");

// API para desbloquear um horário específico (apenas para admins)
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

    const { date, timeSlotIndex } = await req.json();

    if (!date || timeSlotIndex === undefined) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const schedulesCollection = db.collection("schedules");
    
    // Buscar agendamento
    const schedule = await schedulesCollection.findOne({ date });
    
    if (!schedule) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }
    
    // Verificar se o horário está bloqueado pelo admin
    const slot = schedule.timeSlots[timeSlotIndex];
    if (!slot?.booked || slot?.userId) {
      return NextResponse.json({ 
        error: "Este horário não está bloqueado pelo admin ou está reservado por um cliente" 
      }, { status: 400 });
    }
    
    // Desbloquear o horário
    await schedulesCollection.updateOne(
      { date },
      { 
        $set: { 
          [`timeSlots.${timeSlotIndex}.booked`]: false,
          [`timeSlots.${timeSlotIndex}.userId`]: null,
          [`timeSlots.${timeSlotIndex}.userName`]: null,
          [`timeSlots.${timeSlotIndex}.service`]: null,
          [`timeSlots.${timeSlotIndex}.blockedByAdmin`]: false
        } 
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro na API POST unblockTimeSlot:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}