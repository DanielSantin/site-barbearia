import clientPromise from "@/lib/utils/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
import { isWeekend, createDefaultTimeSlots } from "@/lib/utils/dateUtils"
const { ObjectId } = require("mongodb");

interface TimeSlot {
  time: string;
  userId: string | null;
  booked?: boolean;
  service?: string | null;
  isPast?: boolean;
  tooSoon?: boolean;
}


// Busca os horários disponíveis para os próximos 5 dias
export async function GET(req: Request) { 
  try { 
    const client = await clientPromise; 
    const db = client.db(); 
    const dbAuth = client.db("auth");

    const schedulesCollection = db.collection("schedules");

    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url); 
    const selectedDate = searchParams.get("date"); 

    // Verificar se é admin
    const userId = session?.user._id;
    const userCollection = dbAuth.collection("users");
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });

    if (!user?.isAdmin) {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (session) {
      const userId = session.user?._id;
      const userCollection = dbAuth.collection("users");
      const user = await userCollection.findOne({ _id: new ObjectId(userId) });
      if (user?.isBanned == true){
        return NextResponse.json({ error: "Usuário temporariamente banido" }, { status: 400 }); 
      }
    } else {
      return NextResponse.json({ error: "Você precisa estar logado para ver as reservas" }, { status: 400 }); 
    }

    if (!selectedDate) { 
      return NextResponse.json({ error: "Data não fornecida" }, { status: 400 }); 
    } 

    let schedules = await schedulesCollection.find({ date: selectedDate }).toArray(); 
    if (schedules.length === 0 && !isWeekend(selectedDate)) { 
      // Não existe agendamento para esta data, criar um novo
      await schedulesCollection.updateOne( 
        { date: selectedDate }, 
        { $set: { date: selectedDate, timeSlots: createDefaultTimeSlots() } }, 
        { upsert: true } 
      ); 
      schedules = await schedulesCollection.find({ date: selectedDate }).toArray(); 
    }
    
    // Calcula a data/hora de 30 minutos no futuro
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    
    // Marcar horários passados e com menos de 30 minutos de antecedência como indisponíveis
    schedules = schedules.map(schedule => {
      const updatedTimeSlots = schedule.timeSlots.map((slot: TimeSlot) => {
        // Criar um objeto Date para o horário do slot
        const slotDateTime = new Date(`${selectedDate}T${slot.time}`);
        if (slotDateTime < thirtyMinutesFromNow) {
          return {
            ...slot,
            isPast: slotDateTime < now, // true se já passou, false se está dentro dos próximos 30 min
            tooSoon: slotDateTime >= now && slotDateTime < thirtyMinutesFromNow // flag para identificar que é muito próximo
          };
        }
        
        return slot;
      });
      
      return {
        ...schedule,
        timeSlots: updatedTimeSlots
      };
    });
    
    // Retorna os schedules com os horários indisponíveis (passados ou muito próximos)
    return NextResponse.json(schedules); 
  } catch (error) { 
    console.error("Erro na API GET schedules:", error); 
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }); 
  } 
}

export async function DELETE(req: Request) {
  try {
    // Obter a sessão do usuário autenticado
    const session = await getServerSession(authOptions);
    
    // Verificar se o usuário está autenticado
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: "Não autorizado. Faça login para continuar." 
      }, { status: 401 });
    }
    
    const userId = session.user._id;
    const data = await req.json();
    const {date, timeSlotIndex} = data

    const client = await clientPromise;
    const dbAuth = client.db("auth");
    const userCollection = dbAuth.collection("users");
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  } 
    // Validações básicas
    if (date == null || timeSlotIndex == null) {
      return NextResponse.json({ 
        error: "Dados incompletos. Forneça date e timeSlotIndex como parâmetros de consulta" 
      }, { status: 400 });
    }

    const timeSlotIndexNumber = parseInt(timeSlotIndex, 10);
    if (isNaN(timeSlotIndexNumber)) {
      return NextResponse.json({ 
        error: "timeSlotIndex deve ser um número" 
      }, { status: 400 });
    }

    const db = client.db();
    const schedulesCollection = db.collection("schedules");

    // Buscar o agendamento
    const schedule = await schedulesCollection.findOne({ date });
    
    if (!schedule) {
      return NextResponse.json({ 
        error: "Data não encontrada" 
      }, { status: 404 });
    }

    // Verificar se o índice do timeSlot é válido
    if (timeSlotIndexNumber < 0 || timeSlotIndexNumber >= schedule.timeSlots.length) {
      return NextResponse.json({ 
        error: "Índice de horário inválido" 
      }, { status: 400 });
    }

    // Verificar se o horário está reservado
    const targetTimeSlot = schedule.timeSlots[timeSlotIndexNumber];
    if (!targetTimeSlot.booked) {
      return NextResponse.json({ 
        error: "Este horário não está reservado" 
      }, { status: 400 });
    }

    // Tudo verificado, cancelar a reserva
    await schedulesCollection.updateOne(
      { date },
      { 
        $set: { 
          [`timeSlots.${timeSlotIndexNumber}.booked`]: false,
          [`timeSlots.${timeSlotIndexNumber}.userId`]: null,
          [`timeSlots.${timeSlotIndexNumber}.service`]: null,
        } 
      }
    );
    
    // Buscar dados atualizados
    const updatedSchedule = await schedulesCollection.findOne({ date });
    return NextResponse.json({
      success: true,
      message: "Reserva cancelada com sucesso",
      schedule: updatedSchedule,
    });
    
  } catch (error) {
    console.error("Erro na API DELETE schedules:", error);
    return NextResponse.json({ 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
}