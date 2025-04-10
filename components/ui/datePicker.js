import { useState, useEffect, useRef } from "react";
import { Calendar } from "lucide-react";

export default function DatePicker({ label, onChange, value, obfuscateOldDates = true }) {
  const [date, setDate] = useState(value || "");
  const [minDate, setMinDate] = useState("");
  const dateInputRef = useRef(null);
  
  // Definir a data mínima ao carregar o componente
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA');
    
    // Apenas inicialize com hoje se não houver valor passado
    if (!value) {
      setDate(today);
      if (onChange) {
        onChange(today);
      }
    }
    
    if (obfuscateOldDates) {
      setMinDate(today); // Definir a data mínima para hoje
    } else {
      setMinDate(""); // Sem data mínima
    }
  }, [obfuscateOldDates, onChange, value]);
  
  // Atualizar o estado interno quando a prop value mudar
  useEffect(() => {
    if (value) {
      setDate(value);
    }
  }, [value]);

  const handleChange = (event) => {
    setDate(event.target.value);
    if (onChange) {
      onChange(event.target.value);
    }
  };

  const openCalendar = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {label && <label className="text-lg font-semibold text-gray-300">{label}</label>}
      
      <div className="relative w-72">
        {/* Input de data real */}
        <input
          ref={dateInputRef}
          type="date"
          value={date}
          onChange={handleChange}
          min={minDate}
          className="p-4 pr-12 border border-gray-700 rounded-lg text-xl w-full text-center focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-200 shadow-md cursor-pointer hover:border-blue-400 transition-all duration-200"
        />
        
        {/* Ícone personalizado sobreposto */}
        <div 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
          onClick={openCalendar}
        >
          <Calendar className="w-6 h-6 text-blue-300" />
        </div>
        
        {/* Estilo para esconder o ícone padrão do navegador */}
        <style jsx>{`
          /* Tentativa de ocultar o ícone padrão em navegadores comuns */
            input[type="date"]{
              color-scheme: dark
            }
            
          ::-webkit-calendar-picker-indicator {
            opacity: 0;
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            color: transparent;
            background: transparent;
            z-index: 1;
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  );
}