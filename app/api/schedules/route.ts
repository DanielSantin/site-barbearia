import clientPromise from "../../../lib/utils/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
const { ObjectId } = require("mongodb");

// Função para criar horários padrão entre 13:00 e 18:00
const createDefaultTimeSlots = () => {
  const timeSlots = [];
  for (let hour = 10; hour <= 11; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeSlots.push({ time: `${hour}:${minute === 0 ? "00" : "30"}`, userId: null });
    }
  }
  for (let hour = 13; hour <= 19; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeSlots.push({ time: `${hour}:${minute === 0 ? "00" : "30"}`, userId: null });
    }
  }
  return timeSlots;
};

const isWeekend = (date: string | number | Date) => {
  const dayOfWeek = new Date(date).getDay();
  return dayOfWeek === 6 || dayOfWeek === 5; // 0 = Domingo, 6 = Sábado
};


function isTimeSlotPassed(date: string, timeSlot: any): boolean {
  // Verificar se o slot e o horário existem
  if (!timeSlot || !timeSlot.time) {
    return false;
  }
  
  const now = new Date();
  const [hours, minutes] = timeSlot.time.split(':').map(Number);
  const [year, month, day] = date.split('-').map(Number);

  const slotDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

  return now > slotDate;
}

// Busca os horários disponíveis para os próximos 5 dias
export async function GET(req: Request) { 
  try { 

    const client = await clientPromise; 
    const db = client.db(); 
    const dbAuth = client.db("auth")

    const schedulesCollection = db.collection("schedules");

    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url); 
    const selectedDate = searchParams.get("date"); 

    if (session){
      const userId = session.user?.id;
      const userCollection = dbAuth.collection("users");
      const user = await userCollection.findOne({ _id: new ObjectId(userId) });
      let isAdmin = false;
      if (user?.isAdmin == true){
        isAdmin = true;
      }
    }

    if (!selectedDate) { 
      return NextResponse.json({ error: "Data não fornecida" }, { status: 400 }); 
    } 

    if (isWeekend(selectedDate)) {
      return NextResponse.json([]); 
    }

    let schedules = await schedulesCollection.find({ date: selectedDate }).toArray(); 
 
    if (schedules.length === 0) { 
      // Não existe agendamento para esta data, criar um novo
      await schedulesCollection.updateOne( 
        { date: selectedDate }, 
        { $set: { date: selectedDate, timeSlots: createDefaultTimeSlots() } }, 
        { upsert: true } 
      ); 
      schedules = await schedulesCollection.find({ date: selectedDate }).toArray(); 
    } else {
      // Verificar se os slots existentes têm a propriedade "time"
      const hasInvalidTimeSlots = schedules.some(schedule => 
        schedule.timeSlots.some(slot => !slot.time)
      );
      

      // Se encontrou slots sem propriedade "time", recria os slots
      if (hasInvalidTimeSlots) {
        await Promise.all(schedules.map(schedule => 
          schedulesCollection.updateOne(
            { date: schedule.date },
            { $set: { timeSlots: createDefaultTimeSlots() } }
          )
        ));
        
        // Busca os dados atualizados
        schedules = await schedulesCollection.find({ date: selectedDate }).toArray();
      }
    }
    
    // Marcar horários passados como indisponíveis
    schedules = schedules.map(schedule => {
      const updatedTimeSlots = schedule.timeSlots.map(slot => {
        // Usar a função existente para verificar se o horário já passou
        if (isTimeSlotPassed(selectedDate, slot)) {
          return {
            ...slot,
            booked: true,
            isPast: true // Adicionando flag para identificar que é um horário passado
          };
        }
        
        return slot;
      });
      
      return {
        ...schedule,
        timeSlots: updatedTimeSlots
      };
    });
    
    // Retorna os schedules com os horários passados marcados como indisponíveis
    return NextResponse.json(schedules); 
  } catch (error) { 
    console.error("Erro na API GET schedules:", error); 
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }); 
  } 
}

// Reserva um horário
export async function POST(req: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const { date, timeSlotIndex, service } = await req.json();

    if (!date || timeSlotIndex === undefined) {
      return NextResponse.json({ error: "Dados de reserva incompletos" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const schedulesCollection = db.collection("schedules");
    
    // Buscar agendamento para verificar disponibilidade
    const schedule = await schedulesCollection.findOne({ date });
    
    if (!schedule) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }
    
    // Verificar se o horário está disponível
    if (!schedule.timeSlots[timeSlotIndex] || schedule.timeSlots[timeSlotIndex].booked) {
      return NextResponse.json({ error: "Horário não disponível" }, { status: 400 });
    }

    // Verificar o número de reservas futuras do usuário
    const allSchedules = await schedulesCollection.find().toArray();
    
    let futureBookingsCount = 0;
    
    for (const sched of allSchedules) {
      if (sched.timeSlots) {
        for (const slot of sched.timeSlots) {
          // Conta apenas slots reservados pelo usuário atual e que não passaram
          if (
            slot.booked && 
            slot.userId === session.user.id && 
            !isTimeSlotPassed(sched.date, slot)
          ) {
            futureBookingsCount++;
          }
        }
      }
    }
    
    // Verificar se o usuário já atingiu o limite (2 reservas futuras)
    if (futureBookingsCount >= 2) {
      return NextResponse.json(
        { error: "Você já possui 2 horários reservados. Não é possível fazer mais reservas." }, 
        { status: 400 }
      );
    }
    
    // Atualizar o horário como reservado
    const updatedTimeSlots = [...schedule.timeSlots];
    updatedTimeSlots[timeSlotIndex] = {
      ...updatedTimeSlots[timeSlotIndex],
      booked: true,
      userId: session.user.id,
      userName: session.user.name || "Usuário",
      service: service || "Não especificado",
      bookedAt: new Date().toISOString()
    };
    
    // Atualizar no banco de dados
    await schedulesCollection.updateOne(
      { date },
      { $set: { timeSlots: updatedTimeSlots } }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro na API POST schedules:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}


// Cancela uma reserva
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
    
    const userId = session.user.id;
    
    // Extrair dados da URL
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const timeSlotIndex = searchParams.get("timeSlotIndex");

    // Validações básicas
    if (!date || !timeSlotIndex) {
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

    const client = await clientPromise;
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

    // Verificar se o usuário é o proprietário da reserva
    if (targetTimeSlot.userId !== userId) {
      return NextResponse.json({ 
        error: "Você só pode cancelar suas próprias reservas" 
      }, { status: 403 });  // Forbidden
    }

    // Tudo verificado, cancelar a reserva
    await schedulesCollection.updateOne(
      { date },
      { 
        $set: { 
          [`timeSlots.${timeSlotIndexNumber}.booked`]: false,
          [`timeSlots.${timeSlotIndexNumber}.userId`]: null,
          [`timeSlots.${timeSlotIndexNumber}.userName`]: null,
          [`timeSlots.${timeSlotIndexNumber}.bookedAt`]: null,
          [`timeSlots.${timeSlotIndexNumber}.canceledAt`]: new Date()
        } 
      }
    );

    // Buscar dados atualizados
    const updatedSchedule = await schedulesCollection.findOne({ date });
    
    return NextResponse.json({
      success: true,
      message: "Reserva cancelada com sucesso",
      schedule: updatedSchedule
    });
    
  } catch (error) {
    console.error("Erro na API DELETE schedules:", error);
    return NextResponse.json({ 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
}