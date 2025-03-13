"use client";

import React from 'react';

const StrikesInfoModal = ({ onClose, strikes }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Informação de Strikes</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800 mb-1">
                Você recebeu um strike!
              </p>
              <p className="text-sm text-gray-600">
                Cancelamentos com menos de 1 hora de antecedência prejudicam nosso trabalho e outros clientes que poderiam utilizar o horário.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-800">Seu status atual:</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${
              strikes >= 3 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {strikes} / 3 strikes
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                strikes >= 3 ? 'bg-red-600' : 'bg-yellow-500'
              }`} 
              style={{ width: `${Math.min(strikes / 3 * 100, 100)}%` }}
            ></div>
          </div>
          
          {strikes >= 3 && (
            <p className="mt-2 text-sm text-red-600">
              Você atingiu o limite de strikes! Sua conta está temporariamente bloqueada para novas reservas.
            </p>
          )}
        </div>
        
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-800 mb-2">Sobre o sistema de strikes:</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
            <li>Cada cancelamento tardio (menos de 1 hora) gera um strike</li>
            <li>Strikes são acumulativos por um período de 30 dias</li>
            <li>Ao atingir 3 strikes, você fica impossibilitado de fazer novas reservas por 7 dias</li>
            <li>Você pode evitar strikes pagando a taxa de cancelamento</li>
          </ul>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrikesInfoModal;