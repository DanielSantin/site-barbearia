import React from 'react';

const TimeSlotLegend = ({ showCombo = false }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h4 className="text-sm font-medium text-gray-300 mb-3">Legenda:</h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center">
          <span className="w-4 h-4 inline-block mr-2 bg-gray-900 border border-gray-700 rounded"></span>
          <span className="text-xs text-gray-400">Disponível</span>
        </div>
        {showCombo && (
          <div className="flex items-center">
            <span className="w-4 h-4 inline-block mr-2 bg-indigo-900 border border-indigo-700 rounded"></span>
            <span className="text-xs text-gray-400">Disponível para combo</span>
          </div>
        )}
        <div className="flex items-center">
          <span className="w-4 h-4 inline-block mr-2 bg-green-900 border border-green-700 rounded"></span>
          <span className="text-xs text-gray-400">Sua reserva</span>
        </div>
        <div className="flex items-center">
          <span className="w-4 h-4 inline-block mr-2 bg-red-900 border border-red-800 rounded"></span>
          <span className="text-xs text-gray-400">Ocupado</span>
        </div>
        <div className="flex items-center">
          <span className="w-4 h-4 inline-block mr-2 bg-gray-800 border border-gray-700 rounded"></span>
          <span className="text-xs text-gray-400">Horário passado</span>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotLegend;