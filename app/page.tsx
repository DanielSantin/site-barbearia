"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import ServiceSelection from "@/components/ServiceSelection";
import DateSelectionSection from "@/components/DateSelectionSection";
import TimeSlotsGrid from "@/components/TimeSlotsGrid";
import TimeSlotLegend from "@/components/TimeSlotLegend";
import CancelDialog from "@/components/CancelDialog";
import PixInfoModal from "@/components/PixInfoModal";
import StrikesInfoModal from "@/components/StrikesInfoModal";
import NoAvailabilityMessage from "@/components/NoAvailabilityMessage";

import LoadingScreen from "@/components/LoadingScreen";
import { Calendar, Clock, Scissors, AlertCircle } from "lucide-react";

export default function Home() {
  const [selectedOption, setSelectedOption] = useState("Cabelo");
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [consecutiveGroups, setConsecutiveGroups] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [currentCancelIndex, setCurrentCancelIndex] = useState(null);
  const [showPixInfo, setShowPixInfo] = useState(false);
  const [showStrikesInfo, setShowStrikesInfo] = useState(false);
  const [userStrikes, setUserStrikes] = useState(0);
  const [firstLoading, setFirstLoading] = useState(true);

  const PIX_KEY = "000.000.000-00";
  const CANCELATION_FEE = 20.00;
  
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = "/auth";
    },
  });

  if (status === "loading") {
    return <LoadingScreen message="Verificando sua sessão..." />;
  }

  const handleDateChange = async (selectedDate) => {
    setSelectedDate(selectedDate);
    setErrorMessage(null);
    fetchTimeSlots(selectedDate);
  };

  const fetchTimeSlots = async (date) => {
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
      setFirstLoading(false);
    }
  };
  
  const findConsecutiveSlots = (slots) => {
    const groups = [];
    
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

  const handleOptionChange = (option) => {
    setSelectedOption(option);
    setErrorMessage(null);
  };

  const handleReservation = async (timeSlotIndex) => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      if (selectedOption === "Cabelo e Barba") {
        // Encontrar o grupo consecutivo que começa com o timeSlotIndex selecionado
        const group = consecutiveGroups.find(g => g[0] === timeSlotIndex);
        if (!group) {
          throw new Error("Não foi possível encontrar horários consecutivos disponíveis");
        }
        
        const responseFirst = await fetch("/api/schedules", {
          method: "POST",
          body: JSON.stringify({
            date: selectedDate,
            timeSlotIndex: group[0],
            service: "Cabelo"
          }),
          headers: { "Content-Type": "application/json" },
        });
  
        // Verificar se a primeira requisição foi bem-sucedida
        if (!responseFirst.ok) {
          const errorData = await responseFirst.json();
          throw new Error(errorData.error || "Erro ao reservar horário");
        }
  
        const responseSecond = await fetch("/api/schedules", {
          method: "POST",
          body: JSON.stringify({
            date: selectedDate,
            timeSlotIndex: group[1],
            service: "Barba"
          }),
          headers: { "Content-Type": "application/json" },
        });
        
        // Verificar se a segunda requisição foi bem-sucedida
        if (!responseSecond.ok) {
          // Se a primeira funcionou mas a segunda falhou, cancelar a primeira
          await fetch(`/api/schedules?date=${selectedDate}&timeSlotIndex=${group[0]}`, {
            method: "DELETE",
          });
          
          const errorData = await responseSecond.json();
          throw new Error(errorData.error || "Erro ao reservar horário");
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
  
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Erro ao reservar horário");
        }
  
        const data = await response.json();
        toast.success("Horário reservado com sucesso!");
      }
      
      fetchTimeSlots(selectedDate);
    } catch (error) {
      console.error("Erro ao reservar horário:", error);
      setErrorMessage(error.message || "Erro ao reservar horário. Tente novamente.");
      toast.error(error.message || "Erro ao reservar horário. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleCancelReservation = async (timeSlotIndex) => {
    const slot = availableSlots[timeSlotIndex];
    if (!slot) return;

    // Verificar se é cancelamento em cima da hora
    const now = new Date();
    const [hours, minutes] = slot.time.split(':').map(Number);
    const appointmentTime = new Date();
    appointmentTime.setHours(hours, minutes, 0, 0);
    
    // Calcular diferença em minutos
    const diffMs = appointmentTime.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    // Se for menos de 60 minutos (1 hora) de antecedência
    if (diffMinutes < 60 && diffMinutes > 0) {
      setCurrentCancelIndex(timeSlotIndex);
      setShowCancelDialog(true);
      return;
    }
    
    // Caso contrário, prosseguir com o cancelamento normal
    executeCancelation(timeSlotIndex);
  };

  const executeCancelation = async (timeSlotIndex, accCancelTax = false) => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const response = await fetch(`/api/schedules?date=${selectedDate}&timeSlotIndex=${timeSlotIndex}&accCancelTax=${accCancelTax}`, {
        method: "DELETE",
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao cancelar reserva");
      }
  
      // Armazenar os strikes retornados pelo backend
      if (data.strikes !== undefined) {
        setUserStrikes(data.strikes);
      }
  
      toast.success("Reserva cancelada com sucesso!");
      fetchTimeSlots(selectedDate);
    } catch (error) {
      console.error("Erro ao cancelar reserva:", error);
      setErrorMessage(error.message || "Erro ao cancelar reserva. Tente novamente.");
      toast.error(error.message || "Erro ao cancelar reserva. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmLateCancelation = (strike) => {
    if (currentCancelIndex !== null) {
      executeCancelation(currentCancelIndex, !strike);
      setShowCancelDialog(false);
      if (strike === false) {
        setShowPixInfo(true);
      } else {
        setShowStrikesInfo(true);
      }
    }
  };
  
  const isUserReservation = (slot) => {
    return slot.booked && slot.userId === session?.user?.id;
  };

  const isPartOfConsecutiveGroup = (index) => {
    if (selectedOption !== "Cabelo e Barba") return true;
    return consecutiveGroups.some(group => group[0] === index);
  };

  const formatDate = (dateString) => {
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
  
  const getDayOfWeek = (dateString) => {
    const date = new Date(`${dateString}T12:00:00`);
    return date.getDay(); // 0 = domingo, 6 = sábado
  };
  
  const isWeekend = (dateString) => {
    const dayOfWeek = getDayOfWeek(dateString);
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = domingo, 6 = sábado
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    toast.success("Chave PIX copiada!");
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Calvos Club</h1>
          <p className="text-gray-500 mt-2">Agende seu horário</p>
        </div>
        
        <DateSelectionSection onChange={handleDateChange} />
        
        <ServiceSelection 
          selectedOption={selectedOption} 
          onOptionChange={handleOptionChange} 
        />
        
        {firstLoading && <LoadingScreen message="Carregando horários disponíveis..." />}

        {/* No Session Warning */}
        errorMessage && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
            <div className="bg-yellow-100 rounded-full p-2 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}
        
        {!firstLoading && selectedDate && availableSlots.length === 0 && (
          <NoAvailabilityMessage 
            isWeekend={isWeekend(selectedDate)} 
          />
        )}

        {selectedDate && availableSlots.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">
                {formatDate(selectedDate)}
              </h3>
            </div>
            
            <TimeSlotsGrid 
              slots={availableSlots}
              selectedOption={selectedOption}
              consecutiveGroups={consecutiveGroups}
              isUserReservation={isUserReservation}
              isPartOfConsecutiveGroup={isPartOfConsecutiveGroup}
              handleReservation={handleReservation}
              handleCancelReservation={handleCancelReservation}
              isLoading={isLoading}
            />
            
            <TimeSlotLegend showCombo={selectedOption === "Cabelo e Barba"} />
          </div>
        )}
      </div>

      {showCancelDialog && (
        <CancelDialog 
          onClose={() => setShowCancelDialog(false)}
          onConfirm={confirmLateCancelation}
          fee={CANCELATION_FEE}
        />
      )}

      {showPixInfo && (
        <PixInfoModal 
          onClose={() => setShowPixInfo(false)}
          pixKey={PIX_KEY}
          fee={CANCELATION_FEE}
          onCopy={handleCopyPix}
        />
      )}

      {showStrikesInfo && (
        <StrikesInfoModal 
          onClose={() => setShowStrikesInfo(false)}
          strikes={userStrikes}
        />
      )}
    </div>
  );
}