import { useState, useEffect } from "react";

export default function DatePicker({ label, onChange, obfuscateOldDates = true }) {
  const [date, setDate] = useState("");
  const [minDate, setMinDate] = useState("");

  // Definir a data atual ao carregar o componente
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA');
    setDate(today);
    if (obfuscateOldDates) {
      setMinDate(today); // Definir a data mínima para hoje
    } else {
      setMinDate(); // Definir a data mínima para hoje
    }

    if (onChange) {
      onChange(today);
    }
  }, []);

  const handleChange = (event) => {
    setDate(event.target.value);
    if (onChange) {
      onChange(event.target.value);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {label && <label className="text-lg font-semibold text-gray-700">{label}</label>}
      <input
        type="date"
        value={date}
        onChange={handleChange}
        min={minDate} // Definir a data mínima
        className="p-4 border border-gray-300 rounded-lg text-xl w-72 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-md cursor-pointer hover:border-blue-400 transition-all duration-200"
      />
    </div>
  );
}
