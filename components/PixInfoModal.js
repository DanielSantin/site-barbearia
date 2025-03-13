"use client";

import React from 'react';

const PixInfoModal = ({ onClose, pixKey, fee, onCopy }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Pagamento de Taxa</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
          <div className="flex items-center text-blue-700 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Informações para pagamento</span>
          </div>
          <p className="text-gray-600 text-sm">
            Realize um PIX de R$ {fee.toFixed(2).replace('.', ',')} para a chave abaixo.
            Após o pagamento, seu cancelamento será processado sem penalidades.
          </p>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chave PIX (CPF)
          </label>
          <div className="flex">
            <input
              type="text"
              readOnly
              value={pixKey}
              className="flex-grow px-4 py-2 border rounded-l-md bg-gray-50 text-gray-800"
            />
            <button
              onClick={onCopy}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
            >
              Copiar
            </button>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-gray-600">
              Por favor, envie o comprovante de pagamento para o nosso WhatsApp para confirmar sua transação.
            </p>
          </div>
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

export default PixInfoModal;