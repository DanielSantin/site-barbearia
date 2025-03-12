import clientPromise from "@/lib/utils/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
const { ObjectId } = require("mongodb");

// API para buscar os agendamentos de um usuário específico
export async function GET(req: Request) {
  try {
    // Verificar autenticação e permissões admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const dbAuth = client.db("auth");

    // Verificar se o usuário autenticado é admin
    const adminId = session.user.id;
    const userCollection = dbAuth.collection("users");
    const adminUser = await userCollection.findOne({ _id: new ObjectId(adminId) });
    
    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Obter o ID do usuário dos parâmetros de consulta
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não fornecido" }, { status: 400 });
    }

    // Verificar se o usuário existe
    const targetUser = await userCollection.findOne({ _id: new ObjectId(userId) });
    
    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Buscar todos os agendamentos do usuário
    const schedulesCollection = db.collection("schedules");
    
    // Buscar agendamentos onde algum dos timeSlots contém o userId do usuário alvo
    const userSchedules = await schedulesCollection.find({
      "timeSlots.userId": userId
    }).toArray();

    // Processar para retornar apenas os slots que pertencem ao usuário
    const processedSchedules = userSchedules.map(schedule => {
      return {
        _id: schedule._id,
        date: schedule.date,
        timeSlots: schedule.timeSlots.filter(slot => slot.userId === userId).map(slot => {
          // Verificar se o horário já passou
          const isPast = isTimeSlotPassed(schedule.date, slot);
          return {
            ...slot,
            isPast: isPast
          };
        })
      };
    });

    console.log(processedSchedules)
    return NextResponse.json(processedSchedules);
    
  } catch (error) {
    console.error("Erro na API GET user schedules:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// Função para verificar se o horário já passou (reutilizando a função existente)
function isTimeSlotPassed(date, slot) {
  const now = new Date();
  const slotDateTime = new Date(date);
  const [hours, minutes] = slot.time.split(':').map(Number);
  
  slotDateTime.setHours(hours, minutes, 0, 0);
  
  return now > slotDateTime;
}