import clientPromise from "../../../lib/utils/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";

// Função para criar horários padrão entre 13:00 e 18:00
const createDefaultTimeSlots = () => {
  const timeSlots = [];
  for (let hour = 13; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeSlots.push({ time: `${hour}:${minute === 0 ? "00" : "30"}`, booked: false, userId: null });
    }
  }
  return timeSlots;
};

// Função para verificar se um horário já passou
const isTimeSlotPassed = (date, timeSlot) => {
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  
  if (date < currentDate) return true;
  if (date > currentDate) return false;
  
  // Se for o dia atual, verifica se o horário já passou
  const [hour, minute] = timeSlot.time.split(':').map(Number);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  return (currentHour > hour || (currentHour === hour && currentMinute >= minute));
};

// Busca os horários disponíveis para os próximos 5 dias
export async function GET(req: Request) {
  try {
    // Verificar se é uma solicitação para reservas do usuário
    const { searchParams } = new URL(req.url);
    const userReservations = searchParams.get("userReservations");

    const client = await clientPromise;
    const db = client.db();
    const schedulesCollection = db.collection("schedules");
    
    // Obter a data atual no formato YYYY-MM-DD
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    
    // Se estiver buscando as reservas do usuário
    if (userReservations === "true") {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
      }
      
      const userId = session.user.id;
      
      // Busca apenas as reservas do usuário a partir da data atual
      const allUserReservations = await schedulesCollection.find({
        "timeSlots.userId": userId,
        date: { $gte: currentDate } // Apenas datas a partir de hoje
      }).toArray();
      
      // Filtra para incluir apenas reservas futuras
      const filteredReservations = allUserReservations.map(schedule => {
        const filteredTimeSlots = schedule.timeSlots.filter(slot => 
          slot.userId === userId && !isTimeSlotPassed(schedule.date, slot)
        );
        
        if (filteredTimeSlots.length === 0) {
          return null; // Ignora este agendamento se não tiver slots válidos
        }
        
        return {
          ...schedule,
          timeSlots: filteredTimeSlots // Importante: retorna apenas os slots filtrados
        };
      }).filter(Boolean); // Remove os valores null
      
      return NextResponse.json(filteredReservations);
    }
    
    // Caso contrário, retorna todos os horários disponíveis para os próximos dias
    
    // Gera os próximos 5 dias a partir de hoje, garantindo que começamos do dia atual
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      // Formata a data como YYYY-MM-DD
      const formattedDate = date.toISOString().split("T")[0];
      dates.push(formattedDate);
    }
    
    // Busca os horários para as datas especificadas
    const schedules = await schedulesCollection.find({ date: { $in: dates } }).toArray();
    
    // Se não encontrar algum dia, cria com horários padrão
    for (const date of dates) {
      if (!schedules.some((schedule) => schedule.date === date)) {
        await schedulesCollection.updateOne(
          { date },
          { $set: { date, timeSlots: createDefaultTimeSlots() } },
          { upsert: true }
        );
      }
    }
    
    // Busca os agendamentos atualizados
    const updatedSchedules = await schedulesCollection.find({ date: { $in: dates } }).toArray();
    
    // Marca horários passados como reservados para não aparecerem como disponíveis
    const processedSchedules = updatedSchedules.map(schedule => {
      const processedTimeSlots = schedule.timeSlots.map(slot => {
        // Se o horário já passou, marca como reservado
        if (isTimeSlotPassed(schedule.date, slot)) {
          return { ...slot, booked: true, userId: "EXPIRED" };
        }
        return slot;
      });
      
      return { ...schedule, timeSlots: processedTimeSlots };
    });
    
    // Atualiza no banco para manter consistência (opcional)
    for (const schedule of processedSchedules) {
      await schedulesCollection.updateOne(
        { date: schedule.date },
        { $set: { timeSlots: schedule.timeSlots } }
      );
    }
    
    return NextResponse.json(processedSchedules);
  } catch (error) {
    console.error("Erro na API GET schedules:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// Reserva um horário
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { date, time } = await req.json();
    const userId = session.user.id;
    
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não encontrado na sessão" }, { status: 400 });
    }
    
    // Verifica se o horário já passou
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    
    // Verifica se a data é anterior à data atual
    if (date < currentDate) {
      return NextResponse.json({ error: "Não é possível reservar datas passadas" }, { status: 400 });
    }
    
    // Se for a data atual, verifica se o horário já passou
    if (date === currentDate) {
      const [timeHour, timeMinute] = time.split(':').map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (timeHour < currentHour || (timeHour === currentHour && timeMinute <= currentMinute)) {
        return NextResponse.json({ error: "Não é possível reservar horários passados" }, { status: 400 });
      }
    }
    
    const client = await clientPromise;
    const db = client.db();
    const schedulesCollection = db.collection("schedules");

    // Verifica se o horário já está reservado
    const existingSchedule = await schedulesCollection.findOne({
      date,
      timeSlots: {
        $elemMatch: {
          time: time,
          booked: true
        }
      }
    });
    
    if (existingSchedule) {
      return NextResponse.json({ error: "Este horário já está reservado" }, { status: 400 });
    }

    // Verifica quantas reservas ativas o usuário já tem
    const userReservations = await schedulesCollection.find({ 
      "timeSlots.userId": userId,
      date: { $gte: currentDate }  // Apenas datas a partir de hoje
    }).toArray();
    
    const activeReservations = userReservations.flatMap(sch => 
      sch.timeSlots.filter(slot => 
        slot.userId === userId && !isTimeSlotPassed(sch.date, slot)
      )
    );
    
    if (activeReservations.length >= 2) {
      return NextResponse.json({ error: "Máximo de 2 reservas ativas permitido" }, { status: 400 });
    }

    const result = await schedulesCollection.updateOne(
      { date, "timeSlots.time": time, "timeSlots.booked": false },
      { $set: { "timeSlots.$.booked": true, "timeSlots.$.userId": userId } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Horário não disponível" }, { status: 400 });
    }

    console.log("Horário reservado com sucesso:", { date, time, userId });
    return NextResponse.json({ message: "Horário reservado com sucesso" }, { status: 200 });
  } catch (error) {
    console.error("Erro na API POST schedules:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// Cancela uma reserva
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    
    const { date, time } = await req.json();
    const userId = session.user.id;
    
    // Obter a data atual no formato YYYY-MM-DD
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    
    // Verifica se a data é anterior à data atual
    if (date < currentDate) {
      return NextResponse.json({ error: "Não é possível cancelar reservas de datas passadas" }, { status: 400 });
    }
    
    // Se for a data atual, verifica se o horário já passou
    if (date === currentDate) {
      const [hour, minute] = time.split(':').map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (currentHour > hour || (currentHour === hour && currentMinute >= minute)) {
        return NextResponse.json({ error: "Não é possível cancelar reservas de horários passados" }, { status: 400 });
      }
    }
    
    const client = await clientPromise;
    const db = client.db();
    const schedulesCollection = db.collection("schedules");

    const result = await schedulesCollection.updateOne(
      { date, "timeSlots.time": time, "timeSlots.userId": userId },
      { $set: { "timeSlots.$.booked": false, "timeSlots.$.userId": null } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });
    }

    console.log("Reserva cancelada com sucesso:", { date, time, userId });
    return NextResponse.json({ message: "Reserva cancelada com sucesso" }, { status: 200 });
  } catch (error) {
    console.error("Erro na API DELETE schedules:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}