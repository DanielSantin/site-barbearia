// contexts/ScheduleContext.jsx
import { createContext, useContext, useState } from "react";
import { useSchedules } from "../hooks/useSchedules";
import { useReservation } from "../hooks/useReservation";
import { useStrikes } from "../hooks/useStrikes";
import { toast } from "react-hot-toast";

const ScheduleContext = createContext();

export const ScheduleProvider = ({ children }) => {
  const [selectedOption, setSelectedOption] = useState("Cabelo");
  
  const {
    selectedDate,
    availableSlots,
    consecutiveGroups,
    isLoading,
    firstLoading,
    errorMessage,
    setErrorMessage,
    handleDateChange,
    fetchTimeSlots
  } = useSchedules();
  
  const {
    isLoading: reservationLoading,
    showCancelDialog,
    showPixInfo,
    showStrikesInfo,
    setShowCancelDialog,
    setShowPixInfo,
    setShowStrikesInfo,
    handleReservation,
    handleCancelReservation,
    confirmLateCancelation
  } = useReservation(selectedDate, fetchTimeSlots, setErrorMessage);
  
  const { userStrikes, updateStrikes } = useStrikes();
  
  // Constantes
  const PIX_KEY = "000.000.000-00";
  const CANCELATION_FEE = 20.00;
  
  const handleOptionChange = (option) => {
    setSelectedOption(option);
    setErrorMessage(null);
  };
  
  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    toast.success("Chave PIX copiada!");
  };
  
  // Wrapper para confirmar cancelamento e atualizar strikes
  const confirmCancel = async (strike) => {
    const strikes = await confirmLateCancelation(strike);
    updateStrikes(strikes);
  };
  
  return (
    <ScheduleContext.Provider
      value={{
        // Estado
        selectedOption,
        selectedDate,
        availableSlots,
        consecutiveGroups,
        isLoading: isLoading || reservationLoading,
        firstLoading,
        errorMessage,
        showCancelDialog,
        showPixInfo,
        showStrikesInfo,
        userStrikes,
        
        // Constantes
        PIX_KEY,
        CANCELATION_FEE,
        
        // Funções
        handleOptionChange,
        handleDateChange,
        handleReservation: (timeSlotIndex) => 
          handleReservation(timeSlotIndex, selectedOption, consecutiveGroups),
        handleCancelReservation: (timeSlotIndex) => 
          handleCancelReservation(timeSlotIndex, availableSlots),
        confirmLateCancelation: confirmCancel,
        setShowCancelDialog,
        setShowPixInfo,
        setShowStrikesInfo,
        handleCopyPix
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useScheduleContext = () => useContext(ScheduleContext);