import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { fetchAvailableSlots } from "../services/scheduleService";
import { findConsecutiveSlots } from "../utils/slotUtils";

export const useSchedules = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [consecutiveGroups, setConsecutiveGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [firstLoading, setFirstLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchTimeSlots = useCallback(async (date) => {
    setIsLoading(true);
    try {
      const timeSlots = await fetchAvailableSlots(date);
      setAvailableSlots(timeSlots);

      const groups = findConsecutiveSlots(timeSlots);
      setConsecutiveGroups(groups);
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
      toast.error("Erro ao carregar horários. Tente novamente.");
    } finally {
      setIsLoading(false);
      setFirstLoading(false);
    }
  }, []);

  const handleDateChange = useCallback(async (date) => {
    setSelectedDate(date);
    setErrorMessage(null);
    await fetchTimeSlots(date);
  }, [fetchTimeSlots]);

  return {
    selectedDate,
    availableSlots,
    consecutiveGroups,
    isLoading,
    firstLoading,
    errorMessage,
    setErrorMessage,
    handleDateChange,
    fetchTimeSlots
  };
};
