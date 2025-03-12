import clientPromise from "@/lib/utils/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
const { ObjectId } = require("mongodb");

// API para bloquear um dia inteiro (apenas para admins)
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
    const userId = session.user.id;
    const userCollection = dbAuth.collection("users");
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { date, service } = await req.json();

    if (!date) {
      return NextResponse.json({ error: "Data não fornecida" }, { status: 400 });
    }

    const schedulesCollection = db.collection("schedules");
    
    // Buscar agendamento
    let schedule = await schedulesCollection.findOne({ date });
    
    if (!schedule) {
      // Criar um agendamento se não existir
      const createDefaultTimeSlots = () => {
        const timeSlots = [];
        for (let hour = 13; hour <= 18; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            timeSlots.push({ time: `${hour}:${minute === 0 ? "00" : "30"}`, userId: null });
          }
        }
        return timeSlots;
      };
      
      await schedulesCollection.insertOne({
        date,
        timeSlots: createDefaultTimeSlots()
      });
      
      schedule = await schedulesCollection.findOne({ date });
    }
    
    // Bloquear todos os horários que ainda não estão reservados por clientes
    const updatedTimeSlots = schedule.timeSlots.map((slot: any, index: number) => {
      // Se já está reservado por um cliente (tem userId), manter como está
      if (slot.userId) return slot;
      
      // Se o horário já passou, não modificar
      const now = new Date();
      const [hours, minutes] = slot.time.split(':').map(Number);
      const [year, month, day] = date.split('-').map(Number);
      const slotDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      
      if (now > slotDate) return slot;
      
      // Bloquear o horário
      return {
        ...slot,
        booked: true,
        userId: null,
        userName: "Admin",
        service: service || "Bloqueado",
        bookedAt: new Date().toISOString(),
        blockedByAdmin: true
      };
    });
    
    // Atualizar no banco de dados
    await schedulesCollection.updateOne(
      { date },
      { $set: { timeSlots: updatedTimeSlots } }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro na API POST blockEntireDay:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}