import React from 'react';
import DatePicker from "@/components/ui/datePicker";
import { Calendar } from "lucide-react";

const DateSelectionSection = ({ onChange }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center mb-2">
        <Calendar className="w-5 h-5 text-gray-500 mr-2" />
        <span className="text-gray-700 font-medium">Escolha uma data</span>
      </div>
      <DatePicker label="" onChange={onChange} />
    </div>
  );
};

export default DateSelectionSection;