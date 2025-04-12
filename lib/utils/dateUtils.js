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
  
  export const isLastMinuteCancel = (slot, selectedDate) => {
    const now = new Date();
  
    // Cada index representa 30 minutos desde 00:00
    const appointmentTime = new Date(`${selectedDate}T12:00:00`);
    appointmentTime.setHours(0, 0, 0, 0); // Zerar horas, minutos, segundos, milissegundos
    appointmentTime.setMinutes(slot * 30);
    
    // Calcular diferença em minutos
    const diffMs = appointmentTime.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    // Se for menos de 60 minutos (1 hora) de antecedência
    return diffMinutes < 60 && diffMinutes > 0;
  };

  // Função para criar horários padrão entre 13:00 e 18:00
  export const createDefaultTimeSlots = (isWeekend = false) => {
    const timeSlots = [];
    let index = 0;

    
    // Criar slots para todas as horas do dia (das 0h às 23:30)
    for (let hour = 0; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute === 0 ? "00" : "30"}`;
        
        // Definir quais horários estão desabilitados por padrão
        const isLunchTime = (hour >= 12 && hour < 13);
        const isEarlyMorning = (hour < 10);
        const isLateNight = (hour >= 20);
        
        // Por padrão, desabilitar horários de almoço, madrugada e noite
        const disabled = isLunchTime || isEarlyMorning || isLateNight || isWeekend;
        
        timeSlots.push({
          index,
          time,
          userId: null,
          booked: false,
          enabled: !disabled
        });
        index++;

      }
    }
    
    return timeSlots;
  };