// utils/slotUtils.js
export const findConsecutiveSlots = (slots) => {
    const groups = [];
    
    for (let i = 0; i < slots.length - 1; i++) {
      if (
        !slots[i].booked && 
        !slots[i].isPast &&  
        !slots[i+1].booked && 
        !slots[i+1].isPast
      ) {
        const currentTime = slots[i].time.split(':').map(Number);
        const nextTime = slots[i+1].time.split(':').map(Number);
        
        const currentMinutes = currentTime[0] * 60 + currentTime[1];
        const nextMinutes = nextTime[0] * 60 + nextTime[1];
        
        if (nextMinutes - currentMinutes <= 30) {
          groups.push([i, i+1]);
        }
      }
    }
    
    return groups;
  };
  
  export const isPartOfConsecutiveGroup = (index, selectedOption, availableSlots) => {
    if (selectedOption !== "Cabelo e Barba") return true;
    return availableSlots.some(slot => slot.index === index + 1 && !slot.booked && slot.enabled);
  };
  
  
  export const isUserReservation = (slot, userId) => {
    return slot.booked && slot.userId === userId;
  };