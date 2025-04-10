import clientPromise from "../../../lib/utils/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
const { ObjectId } = require("mongodb");

import { TimeSlot } from "@/models/types";
import { logUserAction } from '@/lib/services/logService';

// Variável de ambiente para controlar restrição de admin
// Precisa ser definida como "true" no ambiente de desenvolvimento
const DEV_MODE = process.env.DEV_MODE === "true";

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
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Domingo, 6 = Sábado
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

// Função para verificar se a data está mais de 3 meses à frente
function isDateMoreThanThreeMonthsAhead(dateStr: string): boolean {
  const today = new Date();
  const selectedDate = new Date(dateStr);
  
  // Adiciona 3 meses à data atual
  const threeMonthsLater = new Date(today);
  threeMonthsLater.setMonth(today.getMonth() + 3);
  
  // Compara se a data selecionada é posterior a 3 meses a partir de hoje
  return selectedDate > threeMonthsLater;
}


async function incrementStrikeForUser(client: any, userId: string, incrementValue: number = 1) {
  const dbAuth = client.db("auth");
  const userCollection = dbAuth.collection("users");

  try {
    // Converte userId para ObjectId caso não seja
    const objectId = new ObjectId(userId);

    // Encontrar o usuário no banco de dados
    const user = await userCollection.findOne({ _id: objectId });

    // Verifica se o usuário existe
    if (!user) {
      throw new Error(`Usuário com ID ${userId} não encontrado`);
    }

    // Incrementa o valor do striker
    const updateResult = await userCollection.updateOne(
      { _id: objectId },
      { $inc: { strikes: incrementValue }, $setOnInsert: { isBanned: false } } // Incrementa 'strikes' e garante que 'isBanned' seja criado
    );

    // Verifica se o número de strikes é 5 ou mais e atualiza isBanned
    if (user.strikes + incrementValue >= 5) {
      const banResult = await userCollection.updateOne(
        { _id: objectId },
        { $set: { isBanned: true } } // Atualiza isBanned para true
      );
    }

    const updatedUser = await userCollection.findOne({ _id: new ObjectId(userId) });
    return updatedUser.strikes;  

  } catch (error: any) {
    console.error("Erro ao atualizar striker para o usuário:", error?.message || String(error));
  }
}

// Função para verificar se um horário está próximo (menos de 30 minutos)
function isTimeSlotSoon(date: string, timeSlot: any): boolean {
  if (!timeSlot || !timeSlot.time) {
    return false;
  }
  
  const now = new Date();
  const [hours, minutes] = timeSlot.time.split(':').map(Number);
  const [year, month, day] = date.split('-').map(Number);

  const slotDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const thirtyMinutesFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  return slotDate <= thirtyMinutesFromNow && slotDate > now;
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

    if (session) {
      const userId = session.user?.id;
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
        schedule.timeSlots.some((slot: TimeSlot) => !slot.time)
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
    
    // Calcula a data/hora de 30 minutos no futuro
    const now = (new Date()).getTime()
    const thirtyMinutesFromNow = new Date(now + 30 * 60 * 1000).getTime();
    // Marcar horários passados e com menos de 30 minutos de antecedência como indisponíveis
    schedules = schedules.map(schedule => {
      const updatedTimeSlots = schedule.timeSlots.map((slot: TimeSlot) => {
        // Criar um objeto Date para o horário do slot
        const slotDateTime = new Date(`${selectedDate}T${slot.time}`).getTime();
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

// Reserva um horário
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const client = await clientPromise;
    const dbAuth = client.db("auth");

    // Verificar se é admin apenas no modo desenvolvimento
    if (DEV_MODE) {
      const userId = session.user._id;
      const userCollection = dbAuth.collection("users");
      const user = await userCollection.findOne({ _id: new ObjectId(userId) });

      if (!user?.isAdmin) {
        return NextResponse.json({ error: "A reserva está desabilitada temporariamente no ambiente de desenvolvimento. Entre em contato via whatsapp." }, { status: 403 });
      }
    }

    const { date, timeSlotIndex, service } = await req.json();
    
    if (!date || timeSlotIndex === undefined) {
      return NextResponse.json({ error: "Dados de reserva incompletos" }, { status: 400 });
    }

    // Verificar se a data está a mais de 3 meses de distância
    if (isDateMoreThanThreeMonthsAhead(date)) {
      return NextResponse.json({ 
        error: "Não é possível fazer reservas com mais de 3 meses de antecedência" 
      }, { status: 400 });
    }
    
    const db = client.db();
    const schedulesCollection = db.collection("schedules");
        
    // Buscar agendamento para verificar disponibilidade
    const schedule = await schedulesCollection.findOne({ date });
        
    if (!schedule) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }
        
    // Verificar se o horário está disponível
    if (!schedule.timeSlots[timeSlotIndex] || schedule.timeSlots[timeSlotIndex].booked) {
      return NextResponse.json({ error: "Horário já reservado, por favor selecione outro horário." }, { status: 400 });
    }
    
    // Nova verificação: Horário deve ser com pelo menos 1 hora de antecedência
    const selectedTimeSlot = schedule.timeSlots[timeSlotIndex];
    const selectedDateTime = new Date(`${date}T${selectedTimeSlot.time}`);
    const now = new Date();
    const halfHourFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    
    if (selectedDateTime < halfHourFromNow) {
      return NextResponse.json(
        { error: "As reservas devem ser feitas com pelo menos 1 hora de antecedência" },
        { status: 400 }
      );
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
            slot.userId === session.user._id &&
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
      userId: session.user._id,
      userName: session.user.name || "Usuário",
      service: service || "Não especificado",
      bookedAt: new Date().toISOString()
    };
        
    // Atualizar no banco de dados
    await schedulesCollection.updateOne(
      { date },
      { $set: { timeSlots: updatedTimeSlots } }
    );
    
    await logUserAction({
      userId: session.user._id,
      userName: session.user.name || "Usuário",
      actionType: 'reservation',
      date: date,
      time: selectedTimeSlot.time,
      service: service || "Não especificado",
      importance: 'normal',
      additionalInfo: `Reserva realizada com sucesso para o dia ${date} às ${selectedTimeSlot.time}`
    });
        
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
    
    const userId = session.user._id;
    
    // Extrair dados da URL
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const timeSlotIndex = searchParams.get("timeSlotIndex");
    const acceptCancelationTax = searchParams.get("accCancelTax");

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
    
    // Verificar se o cancelamento está sendo feito com menos de 30 minutos de antecedência
    const isSoonCancellation = isTimeSlotSoon(date, targetTimeSlot);
    const logImportance = isSoonCancellation ? 'important' : 'normal';

    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString("pt-BR"); 

    let strikes;
    let additionalInfo = ""
    if (isSoonCancellation == true){
      if (acceptCancelationTax == "true"){
        additionalInfo = `Cancelamento realizado com menos de 1 hora de antecedência para o dia ${formattedDate} às ${targetTimeSlot.time} aceitando pagar a taxa`
      } else {
        strikes = await incrementStrikeForUser(client, userId)
        additionalInfo = `Cancelamento realizado com menos de 1 hora de antecedência para o dia ${formattedDate} às ${targetTimeSlot.time} recebendo um strike`
      }
    } else {
      additionalInfo = `Cancelamento realizado com sucesso para o dia ${formattedDate} às ${targetTimeSlot.time}`
    }

    // Tudo verificado, cancelar a reserva
    await schedulesCollection.updateOne(
      { date },
      { 
        $set: { 
          [`timeSlots.${timeSlotIndexNumber}.booked`]: false,
          [`timeSlots.${timeSlotIndexNumber}.userId`]: null,
          [`timeSlots.${timeSlotIndexNumber}.userName`]: null,
          [`timeSlots.${timeSlotIndexNumber}.service`]: null,
          [`timeSlots.${timeSlotIndexNumber}.bookedAt`]: null,
          [`timeSlots.${timeSlotIndexNumber}.canceledAt`]: new Date()
        } 
      }
    );

    await logUserAction({
      userId: session.user._id,
      userName: session.user.name || "Usuário",
      actionType: 'cancellation',
      date: date,
      time: targetTimeSlot.time,
      service: targetTimeSlot.service || "Não especificado",
      importance: logImportance,
      additionalInfo: additionalInfo
    });
    
    // Buscar dados atualizados
    const updatedSchedule = await schedulesCollection.findOne({ date });
    return NextResponse.json({
      success: true,
      message: "Reserva cancelada com sucesso",
      schedule: updatedSchedule,
      strikes: strikes !== undefined ? strikes : undefined,  // Retorna 'strikes' se definido, caso contrário retorna 'undefined'
    });
    
  } catch (error) {
    console.error("Erro na API DELETE schedules:", error);
    return NextResponse.json({ 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
}