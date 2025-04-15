import React from 'react';
import TimeSlot from './TimeSlot';

const TimeSlotsGrid = ({ 
  slots, 
  selectedOption, 
  isUserReservation,
  isPartOfConsecutiveGroup,
  handleReservation,
  handleCancelReservation,
  isLoading
}) => {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {slots.map((slot, index) => {
        const isPast = slot.isPast;
        const isAvailableForSelectedService = isPartOfConsecutiveGroup(slot.index);
        const showReservationButton = selectedOption !== "Cabelo e Barba" || isAvailableForSelectedService;
        const isConsecutiveStart = selectedOption === "Cabelo e Barba";
        
        return (
          <TimeSlot
            key={index}
            slot={slot}
            isPast={isPast}
            isUserSlot={isUserReservation(slot)}
            isConsecutiveStart={isConsecutiveStart}
            showReservationButton={showReservationButton}
            selectedOption={selectedOption}
            onReserve={handleReservation}
            onCancel={handleCancelReservation}
            isLoading={isLoading}
          />
        );
      })}
    </div>
  );
};

export default TimeSlotsGrid;