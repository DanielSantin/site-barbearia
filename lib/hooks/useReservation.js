import { useState } from "react";
import { toast } from "react-hot-toast";
import { reserveSlot, cancelReservation } from "../services/scheduleService";
import { isLastMinuteCancel } from "../utils/dateUtils";

export const useReservation = (selectedDate, fetchTimeSlots, setErrorMessage) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [currentCancelIndex, setCurrentCancelIndex] = useState(null);
  const [showPixInfo, setShowPixInfo] = useState(false);
  const [showStrikesInfo, setShowStrikesInfo] = useState(false);
  
  const handleReservation = async (timeSlotIndex, selectedOption, consecutiveGroups) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (selectedOption === "Cabelo e Barba") {
        // Encontrar o grupo consecutivo que começa com o timeSlotIndex selecionado
        const group = consecutiveGroups.find(g => g[0] === timeSlotIndex);
        if (!group) {
          throw new Error("Não foi possível encontrar horários consecutivos disponíveis");
        }
        
        // Primeiro horário para corte de cabelo
        const responseFirst = await reserveSlot(selectedDate, group[0], "Cabelo");
  
        try {
          // Segundo horário para barba
          await reserveSlot(selectedDate, group[1], "Barba");
        } catch (error) {
          // Se o segundo falhar, cancelar o primeiro
          await cancelReservation(selectedDate, group[0]);
          throw error;
        }
        
        toast.success("Horários para Cabelo e Barba reservados com sucesso!");
      } else {
        await reserveSlot(selectedDate, timeSlotIndex, selectedOption);
        toast.success("Horário reservado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao reservar horário:", error);
      setErrorMessage(error.message || "Erro ao reservar horário. Tente novamente.");
      toast.error(error.message || "Erro ao reservar horário. Tente novamente.");
    } finally {
      fetchTimeSlots(selectedDate);
      setIsLoading(false);
    }
  };

  const handleCancelReservation = async (timeSlotIndex) => {

    if (isLastMinuteCancel(timeSlotIndex, selectedDate)) {
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
      const data = await cancelReservation(selectedDate, timeSlotIndex, accCancelTax);
      
      toast.success("Reserva cancelada com sucesso!");
      fetchTimeSlots(selectedDate);
      
      return data.strikes;
    } catch (error) {
      console.error("Erro ao cancelar reserva:", error);
      setErrorMessage(error.message || "Erro ao cancelar reserva. Tente novamente.");
      toast.error(error.message || "Erro ao cancelar reserva. Tente novamente.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmLateCancelation = async (strike) => {
    if (currentCancelIndex !== null) {
      const strikes = await executeCancelation(currentCancelIndex, !strike);
      setShowCancelDialog(false);
      if (strike === false) {
        setShowPixInfo(true);
      } else {
        setShowStrikesInfo(true);
        return strikes;
      }
    }
    return null;
  };

  return {
    isLoading,
    showCancelDialog,
    showPixInfo,
    showStrikesInfo,
    setShowCancelDialog,
    setShowPixInfo,
    setShowStrikesInfo,
    handleReservation,
    handleCancelReservation,
    confirmLateCancelation
  };
};