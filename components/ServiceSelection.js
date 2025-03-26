import React from 'react';
import { Scissors, Clock } from "lucide-react";
import { razorBlade } from '@lucide/lab';
import { Icon } from 'lucide-react';

const ServiceSelection = ({ selectedOption, onOptionChange }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center mb-3">
        <Scissors className="w-5 h-5 text-blue-400 mr-2" />
        <span className="text-gray-200 font-medium">Selecione o serviço</span>
      </div>
      {/* Container externo com bordas */}
      <div className="p-0.5 bg-gray-900 rounded-lg border border-blue-800/50">
        {/* Container dos botões sem gap e sem padding */}
        <div className="grid grid-cols-3 bg-gray-900 rounded-md">
          <button
            onClick={() => onOptionChange("Cabelo")}
            className={`py-3 rounded-md text-sm font-medium flex items-center justify-center transition-all duration-200 ${
              selectedOption === "Cabelo" 
                ? "bg-blue-800 text-white shadow-md" 
                : "bg-transparent text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Scissors className={`w-4 h-4 mr-1.5 ${selectedOption === "Cabelo" ? "text-white" : "text-blue-400"}`} />
            Cabelo
          </button>
          <button
            onClick={() => onOptionChange("Barba")}
            className={`py-3 rounded-md text-sm font-medium flex items-center justify-center transition-all duration-200 ${
              selectedOption === "Barba" 
                ? "bg-blue-800 text-white shadow-md" 
                : "bg-transparent text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Icon iconNode={razorBlade} className={`w-4 h-4 mr-1.5 ${selectedOption === "Barba" ? "text-white" : "text-blue-400"}`} />
            Barba
          </button>
          <button
            onClick={() => onOptionChange("Cabelo e Barba")}
            className={`py-3 rounded-md text-sm font-medium flex items-center justify-center transition-all duration-200 ${
              selectedOption === "Cabelo e Barba" 
                ? "bg-blue-800 text-white shadow-md" 
                : "bg-transparent text-gray-300 hover:bg-gray-800"
            }`}
          >
            <div className="flex items-center mr-1">
              <Scissors className={`w-3 h-3 mr-1 ${selectedOption === "Cabelo e Barba" ? "text-white" : "text-blue-400"}`} />
              <Icon iconNode={razorBlade} className={`w-3 h-3 ${selectedOption === "Cabelo e Barba" ? "text-white" : "text-blue-400"}`} />
            </div>
            Combo
          </button>
        </div>
      </div>
      
      {/* Service Info - Estilo atualizado */}
      {selectedOption === "Cabelo e Barba" && (
        <div className="mt-3 p-3 bg-gray-900 border border-blue-800/50 rounded-lg flex items-center">
          <div className="bg-blue-900 rounded-full p-2 mr-3">
            <Clock className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-sm text-gray-300">
            Para Cabelo e Barba, serão reservados dois horários consecutivos
          </p>
        </div>
      )}
    </div>
  );
};

export default ServiceSelection;