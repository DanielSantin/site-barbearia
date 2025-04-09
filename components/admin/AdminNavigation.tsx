import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from 'lucide-react';

type AdminNavigationProps = {
  view: "schedules" | "users" | "logs";
  setView: (view: "schedules" | "users" | "logs") => void;
  fetchLogs: () => void;
};

const AdminNavigation: React.FC<AdminNavigationProps> = ({ view, setView, fetchLogs }) => {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const views = [
    { key: "schedules", label: "Gerenciar Agendamentos" },
    { key: "users", label: "Gerenciar Usuários" },
    { key: "logs", label: "Logs do Sistema" }
  ];

  const handleViewChange = (newView: "schedules" | "users" | "logs") => {
    setView(newView);
    if (newView === "logs") {
      fetchLogs();
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4">
      {/* Desktop Buttons */}
      <div className="hidden sm:flex flex-wrap gap-4">
        {views.map((item) => (
          <button
            key={item.key}
            onClick={() => handleViewChange(item.key as "schedules" | "users" | "logs")}
            className={`px-4 py-2 rounded-lg font-medium ${
              view === item.key 
                ? "bg-blue-600 text-white" 
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
          >
            {item.label}
          </button>
        ))}
        <button
          onClick={() => router.push("/")}
          className="ml-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Voltar ao Site
        </button>
      </div>

      {/* Mobile Dropdown */}
      <div className="sm:hidden relative w-full">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-2 bg-gray-700 text-gray-200 rounded-lg"
        >
          {views.find(v => v.key === view)?.label}
          {isDropdownOpen ? <ChevronUp /> : <ChevronDown />}
        </button>
        
        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-2 bg-gray-600 rounded-lg shadow-lg">
            {views.map((item) => (
              <button
                key={item.key}
                onClick={() => handleViewChange(item.key as "schedules" | "users" | "logs")}
                className={`w-full text-left px-4 py-2 ${
                  view === item.key 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-200 hover:bg-gray-700"
                } ${item.key === views[views.length - 1].key ? 'rounded-b-lg' : ''}`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => {
                router.push("/");
                setIsDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700 rounded-b-lg"
            >
              Voltar ao Site
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNavigation;