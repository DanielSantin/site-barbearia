import React from 'react';
import { Scissors, Clock } from "lucide-react";
import { razorBlade } from '@lucide/lab';
import { Icon } from 'lucide-react';

const ServiceSelection = ({ selectedOption, onOptionChange }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center mb-3">
        <Scissors className="w-5 h-5 text-gray-500 mr-2" />
        <span className="text-gray-700 font-medium">Selecione o serviço</span>
      </div>
      <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => onOptionChange("Cabelo")}
          className={`py-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-200 ${
            selectedOption === "Cabelo" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-transparent text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Scissors className={`w-4 h-4 mr-1 ${selectedOption === "Cabelo" ? "text-white" : "text-gray-500"}`} />
          Cabelo
        </button>
        <button
          onClick={() => onOptionChange("Barba")}
          className={`py-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-200 ${
            selectedOption === "Barba" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-transparent text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Icon iconNode={razorBlade} className={`w-4 h-4 mr-1 ${selectedOption === "Barba" ? "text-white" : "text-gray-500"}`} />
          Barba
        </button>
        <button
          onClick={() => onOptionChange("Cabelo e Barba")}
          className={`py-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-200 ${
            selectedOption === "Cabelo e Barba" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-transparent text-gray-600 hover:bg-gray-200"
          }`}
        >
          <div className="flex items-center mr-1">
            <Scissors className={`w-3 h-3 mr-1 ${selectedOption === "Cabelo e Barba" ? "text-white" : "text-gray-500"}`} />
            <Icon iconNode={razorBlade} className={`w-3 h-3 ${selectedOption === "Cabelo e Barba" ? "text-white" : "text-gray-500"}`} />
          </div>
          Combo
        </button>
      </div>
      
      {/* Service Info */}
      {selectedOption === "Cabelo e Barba" && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-blue-700">
            Para Cabelo e Barba, serão reservados dois horários consecutivos
          </p>
        </div>
      )}
    </div>
  );
};

export default ServiceSelection;