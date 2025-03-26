import React from 'react';
import { AlertCircle } from "lucide-react";

const NoAvailabilityMessage = ({ isWeekend }) => {
  return (
    <div className="py-8 flex flex-col items-center justify-center bg-gray-800 border border-gray-700 rounded-lg mb-6">
      <div className="bg-gray-700 rounded-full p-3 mb-4">
        <AlertCircle className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-2">
        {isWeekend 
          ? "Não atendemos nos finais de semana" 
          : "Não há horários disponíveis para este dia"}
      </h3>
      <p className="text-gray-400 text-center max-w-xs">
        {isWeekend
          ? "Nosso estabelecimento está fechado aos sábados e domingos. Por favor, selecione um dia útil para agendar seu horário."
          : "Todos os horários deste dia já foram reservados ou não há atendimento nesta data. Por favor, escolha outra data."}
      </p>
    </div>
  );
};

export default NoAvailabilityMessage;