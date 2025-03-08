"use client";

import { useState, useEffect } from "react";
import DatePicker from "@/components/ui/datePicker";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Calendar, Clock, Scissors, AlertCircle } from "lucide-react";
import { razorBlade } from '@lucide/lab';
import { Icon } from 'lucide-react';

export default function Home() {
  const { data: session } = useSession();
  const [selectedOption, setSelectedOption] = useState<string | null>("Cabelo");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [consecutiveGroups, setConsecutiveGroups] = useState<any[]>([]);

  const handleDateChange = async (selectedDate: string) => {
    console.log("Data selecionada:", selectedDate);
    setSelectedDate(selectedDate);
    fetchTimeSlots(selectedDate);
  };

  const fetchTimeSlots = async (date: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/schedules?date=${date}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar horários');
      }

      const data = await response.json();
      const timeSlots = data[0]?.timeSlots || [];
      setAvailableSlots(timeSlots);
      
      findConsecutiveSlots(timeSlots);
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
      toast.error("Erro ao carregar horários. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const findConsecutiveSlots = (slots: any[]) => {
    const groups: number[][] = [];
    
    for (let i = 0; i < slots.length - 1; i++) {
      if (
        !slots[i].booked && 
        !slots[i].isPast &&  
        !slots[i+1].booked && 
        !slots[i+1].isPast
      ) {
        const currentTime = slots[i].time.split(':').map(Number);
        const nextTime = slots[i+1].time.split(':').map(Number);
        
        const currentMinutes = currentTime[0] * 60 + currentTime[1];
        const nextMinutes = nextTime[0] * 60 + nextTime[1];
        
        if (nextMinutes - currentMinutes <= 30) {
          groups.push([i, i+1]);
        }
      }
    }
    
    setConsecutiveGroups(groups);
  };

  const handleOptionChange = (option: string) => {
    setSelectedOption(option);
    console.log("Opção selecionada:", option);
  };

  const handleReservation = async (timeSlotIndex: number) => {
    if (!session) {
      toast.error("Você precisa estar logado para fazer uma reserva.");
      return;
    }
  
    setIsLoading(true);
    try {
      if (selectedOption === "Cabelo e Barba") {
        // Encontrar o grupo consecutivo que começa com o timeSlotIndex selecionado
        const group = consecutiveGroups.find(g => g[0] === timeSlotIndex);
        if (!group) {
          throw new Error("Não foi possível encontrar horários consecutivos disponíveis");
        }
        

      const responseFirst  = await fetch("/api/schedules", {
          method: "POST",
          body: JSON.stringify({
            date: selectedDate,
            timeSlotIndex: group[0],
            service: "Cabelo"
          }),
          headers: { "Content-Type": "application/json" },
        })


        const responseSecond = await fetch("/api/schedules", {
          method: "POST",
          body: JSON.stringify({
            date: selectedDate,
            timeSlotIndex: group[1],
            service: "Barba"
          }),
          headers: { "Content-Type": "application/json" },
        })
        
        console.log(responseFirst);
        console.log(responseSecond);

        // Verificar se ambas as requisições foram bem-sucedidas
        if (!responseFirst.ok || !responseSecond.ok) {
          // Se uma falhar, tentar cancelar a outra para evitar reservas parciais
          if (responseFirst.ok) {
            await fetch(`/api/schedules?date=${selectedDate}&timeSlotIndex=${group[0]}`, {
              method: "DELETE",
            });
          }
          if (responseSecond.ok) {
            await fetch(`/api/schedules?date=${selectedDate}&timeSlotIndex=${group[1]}`, {
              method: "DELETE",
            });
          }
          throw new Error("Não foi possível reservar ambos os horários");
        }
        
        toast.success("Horários para Cabelo e Barba reservados com sucesso!");
      } else {
        const response = await fetch("/api/schedules", {
          method: "POST",
          body: JSON.stringify({
            date: selectedDate,
            timeSlotIndex,
            service: selectedOption
          }),
          headers: { "Content-Type": "application/json" },
        });
  
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Erro ao reservar horário");
        }
  
        toast.success("Horário reservado com sucesso!");
      }
      
      fetchTimeSlots(selectedDate!);
    } catch (error: any) {
      console.error("Erro ao reservar horário:", error);
      toast.error(error.message || "Erro ao reservar horário. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelReservation = async (timeSlotIndex: number) => {
    if (!session) {
      toast.error("Você precisa estar logado para cancelar uma reserva.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/schedules?date=${selectedDate}&timeSlotIndex=${timeSlotIndex}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao cancelar reserva");
      }

      toast.success("Reserva cancelada com sucesso!");
      fetchTimeSlots(selectedDate!);
    } catch (error: any) {
      console.error("Erro ao cancelar reserva:", error);
      toast.error(error.message || "Erro ao cancelar reserva. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const isUserReservation = (slot: any) => {
    return slot.booked && slot.userId === session?.user?.id;
  };

  const isPastTimeSlot = (slot: any) => {
    return slot.isPast;
  };
  
  const isPartOfConsecutiveGroup = (index: number): boolean => {
    if (selectedOption !== "Cabelo e Barba") return true;
    return consecutiveGroups.some(group => group[0] === index);
  };

  const formatDate = (dateString: string) => {
    // Adiciona a hora para garantir que seja interpretado no fuso local
    const date = new Date(`${dateString}T12:00:00`);
    
    // Array com os nomes dos dias da semana em português
    const weekDays = [
      "Domingo", "Segunda-feira", "Terça-feira", 
      "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"
    ];
    
    // Obter o dia da semana
    const weekDay = weekDays[date.getDay()];
    
    // Formatar o dia e mês como DD/MM
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    return `Horários de ${weekDay} - ${day}/${month}`;
  };
  
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(`${dateString}T12:00:00`);
    return date.getDay(); // 0 = domingo, 6 = sábado
  };
  
  const isWeekend = (dateString: string) => {
    const dayOfWeek = getDayOfWeek(dateString);
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = domingo, 6 = sábado
  };

  // Service icons mapping
  const getServiceIcon = (service: string) => {
    switch(service) {
      case "Cabelo":
        return <Scissors className="w-4 h-4 mr-1" />;
      case "Barba":
        return  <Icon iconNode={razorBlade} className="w-4 h-4 mr-1" />;
      case "Cabelo e Barba":
        return (
          <div className="flex items-center">
            <Scissors className="w-3 h-3 mr-1" />
            <Icon iconNode={razorBlade} className="w-3 h-3" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Calvos Club</h1>
          <p className="text-gray-500 mt-2">Agende seu horário</p>
        </div>
        
        {/* Date Picker with Icon */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Calendar className="w-5 h-5 text-gray-500 mr-2" />
            <span className="text-gray-700 font-medium">Escolha uma data</span>
          </div>
          <DatePicker label="" onChange={handleDateChange} />
        </div>

        {/* Service Selection Tabs */}
        <div className="mb-8">
          <div className="flex items-center mb-3">
            <Scissors className="w-5 h-5 text-gray-500 mr-2" />
            <span className="text-gray-700 font-medium">Selecione o serviço</span>
          </div>
          <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => handleOptionChange("Cabelo")}
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
              onClick={() => handleOptionChange("Barba")}
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
              onClick={() => handleOptionChange("Cabelo e Barba")}
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
        
        {/* Loading State */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-gray-500">Carregando horários disponíveis...</p>
          </div>
        )}

        {/* No Session Warning */}
        {!session && !isLoading && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
            <div className="bg-yellow-100 rounded-full p-2 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-yellow-700">
              Faça login para reservar um horário
            </p>
          </div>
        )}

        {/* Weekend or No Availability Message */}
        {selectedDate && !isLoading && availableSlots.length === 0 && (
          <div className="py-8 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg mb-6">
            <div className="bg-gray-100 rounded-full p-3 mb-4">
              <AlertCircle className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {isWeekend(selectedDate) 
                ? "Não atendemos nos finais de semana" 
                : "Não há horários disponíveis para este dia"}
            </h3>
            <p className="text-gray-500 text-center max-w-xs">
              {isWeekend(selectedDate)
                ? "Nosso estabelecimento está fechado aos sábados e domingos. Por favor, selecione um dia útil para agendar seu horário."
                : "Todos os horários deste dia já foram reservados ou não há atendimento nesta data. Por favor, escolha outra data."}
            </p>
          </div>
        )}

        {/* Available Time Slots */}
        {selectedDate && availableSlots.length > 0 && !isLoading && (
          <div>
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">
                {formatDate(selectedDate)}
              </h3>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              {availableSlots.map((slot, index) => {
                const isPast = slot.isPast;
                const isAvailableForSelectedService = isPartOfConsecutiveGroup(index);
                const showReservationButton = selectedOption !== "Cabelo e Barba" || isAvailableForSelectedService;
                const isConsecutiveStart = selectedOption === "Cabelo e Barba" && consecutiveGroups.some(g => g[0] === index);
                
                return (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg shadow-sm transition-all duration-200 ${
                      isPast 
                        ? "bg-gray-100 border border-gray-200" 
                        : slot.booked 
                          ? isUserReservation(slot) 
                            ? "bg-green-50 border border-green-200" 
                            : "bg-red-50 border border-red-100" 
                          : isConsecutiveStart
                            ? "bg-blue-50 border border-blue-200" 
                            : "bg-white border border-gray-200 hover:border-blue-300 hover:shadow"
                    }`}
                  >
                    <p className="text-center font-medium mb-2">
                      {slot.time}
                    </p>
                    <div className="flex justify-center">
                      {isPast ? (
                        <span className="text-xs text-gray-500 bg-gray-100 py-1 px-2 rounded-full flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Horário passado
                        </span>
                      ) : !slot.booked ? (
                        showReservationButton ? (
                          <button
                            onClick={() => handleReservation(index)}
                            className={`px-3 py-1 text-sm rounded-full w-full flex items-center justify-center ${
                              isConsecutiveStart 
                                ? "bg-blue-600 text-white hover:bg-blue-700" 
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            } transition-colors duration-200`}
                            disabled={isLoading}
                          >
                            {getServiceIcon(selectedOption || "")}
                            Reservar
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500 bg-gray-100 py-1 px-2 rounded-full">
                            Indisponível
                          </span>
                        )
                      ) : isUserReservation(slot) ? (
                        <button
                          onClick={() => handleCancelReservation(index)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded-full w-full hover:bg-red-600 flex items-center justify-center transition-colors duration-200"
                          disabled={isLoading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancelar
                        </button>
                      ) : (
                        <span className="text-xs text-red-500 bg-red-50 py-1 px-2 rounded-full flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Ocupado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Legenda:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  <span className="w-4 h-4 inline-block mr-2 bg-white border border-gray-200 rounded"></span>
                  <span className="text-xs text-gray-600">Disponível</span>
                </div>
                {selectedOption === "Cabelo e Barba" && (
                  <div className="flex items-center">
                    <span className="w-4 h-4 inline-block mr-2 bg-blue-50 border border-blue-200 rounded"></span>
                    <span className="text-xs text-gray-600">Disponível para combo</span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="w-4 h-4 inline-block mr-2 bg-green-50 border border-green-200 rounded"></span>
                  <span className="text-xs text-gray-600">Sua reserva</span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 inline-block mr-2 bg-red-50 border border-red-100 rounded"></span>
                  <span className="text-xs text-gray-600">Ocupado</span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 inline-block mr-2 bg-gray-100 border border-gray-200 rounded"></span>
                  <span className="text-xs text-gray-600">Horário passado</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}