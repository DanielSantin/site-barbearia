import React from 'react';
import DatePicker from "@/components/ui/datePicker";
import { Calendar } from "lucide-react";

const DateSelectionSection = ({ onChange, selectedDate }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center mb-2">
        <Calendar className="w-5 h-5 text-blue-400 mr-2" />
        <span className="text-gray-300 font-medium">Escolha uma data</span>
      </div>
      <DatePicker label="" onChange={onChange} value={selectedDate} />
    </div>
  );
};

export default DateSelectionSection;