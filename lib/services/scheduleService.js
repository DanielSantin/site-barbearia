// services/scheduleService.js
export const fetchAvailableSlots = async (date) => {
    const response = await fetch(`/api/schedules?date=${date}`);
    const responsejson = await response.json()
    if (!response.ok) {
      throw new Error(responsejson.error || 'Erro ao buscar horários');
    }
    
    const data = await response.json();
    return data[0]?.timeSlots || [];
  };
  
  export const reserveSlot = async (date, timeSlotIndex, service) => {
    const response = await fetch("/api/schedules", {
      method: "POST",
      body: JSON.stringify({ date, timeSlotIndex, service }),
      headers: { "Content-Type": "application/json" },
    });
  
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Erro ao reservar horário");
    }
  
    return await response.json();
  };
  
  export const cancelReservation = async (date, timeSlotIndex, accCancelTax = false) => {
    const response = await fetch(`/api/schedules?date=${date}&timeSlotIndex=${timeSlotIndex}&accCancelTax=${accCancelTax}`, {
      method: "DELETE",
    });
  
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Erro ao cancelar reserva");
    }
  
    return data;
  };