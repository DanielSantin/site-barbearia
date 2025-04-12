export const formatDate = (dateString) => {
    // Adiciona a hora para garantir que seja interpretado no fuso local
    const date = new Date(`${dateString}T12:00:00`);
    
    // Array com os nomes dos dias da semana em português
    const weekDays = [
      "Domingo", "Segunda-feira", "Terça-feira", 
      "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"
    ];
    
    // Obter o dia da semana
    const weekDay = weekDays[date.getDay()];
    
    // Formatar o dia e mês como DD/MM
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    return `Horários de ${weekDay} - ${day}/${month}`;
  };
  
  export const getDayOfWeek = (dateString) => {
    const date = new Date(`${dateString}T12:00:00`);
    return date.getDay(); // 0 = domingo, 6 = sábado
  };
  
  export const isWeekend = (dateString) => {
    const dayOfWeek = getDayOfWeek(dateString);
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = domingo, 6 = sábado
  };
  
  export const isLastMinuteCancel = (slot) => {
    const now = new Date();
    const [hours, minutes] = slot.time.split(':').map(Number);
    const appointmentTime = new Date();
    appointmentTime.setHours(hours, minutes, 0, 0);
    
    // Calcular diferença em minutos
    const diffMs = appointmentTime.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    // Se for menos de 60 minutos (1 hora) de antecedência
    return diffMinutes < 60 && diffMinutes > 0;
  };

  // Função para criar horários padrão entre 13:00 e 18:00
export const createDefaultTimeSlots = () => {
  const timeSlots = [];
  
  for (let hour = 10; hour <= 11; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeSlots.push  ({ time: `${hour}:${minute === 0 ? "00" : "30"}`, userId: null });
    }
  }
  for (let hour = 13; hour <= 19; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeSlots.push({ time: `${hour}:${minute === 0 ? "00" : "30"}`, userId: null });
    }
  }
  return timeSlots;
};