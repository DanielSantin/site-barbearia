import React from 'react';

const TimeSlotLegend = ({ showCombo = false }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Legenda:</h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center">
          <span className="w-4 h-4 inline-block mr-2 bg-white border border-gray-200 rounded"></span>
          <span className="text-xs text-gray-600">Disponível</span>
        </div>
        {showCombo && (
          <div className="flex items-center">
            <span className="w-4 h-4 inline-block mr-2 bg-blue-50 border border-blue-200 rounded"></span>
            <span className="text-xs text-gray-600">Disponível para combo</span>
          </div>
        )}
        <div className="flex items-center">
          <span className="w-4 h-4 inline-block mr-2 bg-green-50 border border-green-200 rounded"></span>
          <span className="text-xs text-gray-600">Sua reserva</span>
        </div>
        <div className="flex items-center">
          <span className="w-4 h-4 inline-block mr-2 bg-red-50 border border-red-100 rounded"></span>
          <span className="text-xs text-gray-600">Ocupado</span>
        </div>
        <div className="flex items-center">
          <span className="w-4 h-4 inline-block mr-2 bg-gray-100 border border-gray-200 rounded"></span>
          <span className="text-xs text-gray-600">Horário passado</span>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotLegend;