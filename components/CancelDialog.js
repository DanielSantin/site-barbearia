"use client";

import React from 'react';

const CancelDialog = ({ onClose, onConfirm, fee }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Cancelamento com menos de 1 hora</h2>
        
        <p className="text-gray-600 mb-4">
          Você está cancelando um horário com menos de 1 hora de antecedência.
          Você tem duas opções:
        </p>
        
        <div className="space-y-4 mb-6">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Opção 1: Pagar taxa de cancelamento</h3>
            <p className="text-gray-600 text-sm">
              Pague R$ {fee.toFixed(2).replace('.', ',')} de taxa de cancelamento via PIX.
              Seu histórico permanece limpo.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Opção 2: Receber um strike</h3>
            <p className="text-gray-600 text-sm">
              Você receberá um strike em seu histórico. Ao acumular 3 strikes,
              você será temporariamente bloqueado de fazer novas reservas.
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Pagar Taxa
          </button>
          <button
            onClick={() => onConfirm(true)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          >
            Aceitar Strike
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelDialog;