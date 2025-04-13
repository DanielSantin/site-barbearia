"use client";

import React from 'react';

const CancelDialog = ({ onClose, onConfirm, fee }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-gray-700">
        <h2 className="text-xl font-bold text-gray-200 mb-4">Cancelamento com menos de 1 hora</h2>
        
        <p className="text-gray-400 mb-4">
          Você está cancelando um horário com menos de 1 hora de antecedência.
          Você tem duas opções:
        </p>
        
        <div className="space-y-4 mb-6">
          <div className="p-4 border border-gray-700 rounded-lg bg-gray-900">
            <h3 className="font-medium text-gray-300 mb-2">Opção 1: Pagar taxa de cancelamento</h3>
            <p className="text-gray-400 text-sm">
              Pague R$ {Number(fee).toFixed(2).replace('.', ',')} de taxa de cancelamento via PIX.
              Seu histórico permanece limpo.
            </p>
          </div>
          
          <div className="p-4 border border-gray-700 rounded-lg bg-gray-900">
            <h3 className="font-medium text-gray-300 mb-2">Opção 2: Receber um strike</h3>
            <p className="text-gray-400 text-sm">
              Você receberá um strike em seu histórico. Ao acumular 3 strikes,
              você será temporariamente bloqueado de fazer novas reservas.
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Pagar Taxa
          </button>
          <button
            onClick={() => onConfirm(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
          >
            Aceitar Strike
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelDialog;