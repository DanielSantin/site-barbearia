import React from 'react';
import { Clock } from "lucide-react";
import { Scissors } from "lucide-react";
import { razorBlade } from '@lucide/lab';
import { Icon } from 'lucide-react';

const TimeSlot = ({ 
  slot, 
  index, 
  isPast,
  isUserSlot,
  isConsecutiveStart,
  showReservationButton,
  selectedOption,
  onReserve,
  onCancel,
  isLoading
}) => {
  // Service icons mapping
  const getServiceIcon = (service) => {
    switch(service) {
      case "Cabelo":
        return <Scissors className="w-4 h-4 mr-1" />;
      case "Barba":
        return <Icon iconNode={razorBlade} className="w-4 h-4 mr-1" />;
      case "Cabelo e Barba":
        return (
          <div className="flex items-center">
            <Scissors className="w-3 h-3 mr-1" />
            <Icon iconNode={razorBlade} className="w-3 h-3" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={`p-3 rounded-lg shadow-sm transition-all duration-200 ${
        isPast 
          ? "bg-gray-100 border border-gray-200" 
          : slot.booked 
            ? isUserSlot
              ? "bg-green-50 border border-green-200" 
              : "bg-red-50 border border-red-100" 
            : isConsecutiveStart
              ? "bg-blue-50 border border-blue-200" 
              : "bg-white border border-gray-200 hover:border-blue-300 hover:shadow"
      }`}
    >
      <p className="text-center font-medium mb-2">
        {slot.time}
      </p>
      <div className="flex justify-center">
        {isPast ? (
          <span className="text-xs text-gray-500 bg-gray-100 py-1 px-2 rounded-full flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Horário passado
          </span>
        ) : slot.tooSoon && !slot.booked ? (
          <span className="text-xs text-gray-500 bg-gray-100 py-1 px-2 rounded-full flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Fora do prazo
          </span>
        ) : !slot.booked ? (
          showReservationButton ? (
            <button
              onClick={() => onReserve(index)}
              className={`px-3 py-1 text-sm rounded-full w-full flex items-center justify-center ${
                isConsecutiveStart 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "bg-blue-500 text-white hover:bg-blue-600"
              } transition-colors duration-200`}
              disabled={isLoading}
            >
              {getServiceIcon(selectedOption || "")}
              Reservar
            </button>
          ) : (
            <span className="text-xs text-gray-500 bg-gray-100 py-1 px-2 rounded-full">
              Indisponível
            </span>
          )
        ) : isUserSlot ? (
          <button
            onClick={() => onCancel(index)}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded-full w-full hover:bg-red-600 flex items-center justify-center transition-colors duration-200"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancelar
          </button>
        ) : (
          <span className="text-xs text-red-500 bg-red-50 py-1 px-2 rounded-full flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ocupado
          </span>
        )}
      </div>
    </div>
  );
};

export default TimeSlot;