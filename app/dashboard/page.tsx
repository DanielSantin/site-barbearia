"use client";

import { signOut, useSession } from "next-auth/react";
import ServiceSelection from "@/components/ServiceSelection";
import DateSelectionSection from "@/components/DateSelectionSection";
import TimeSlotsGrid from "@/components/TimeSlotsGrid";
import TimeSlotLegend from "@/components/TimeSlotLegend";
import CancelDialog from "@/components/CancelDialog";
import PixInfoModal from "@/components/PixInfoModal";
import StrikesInfoModal from "@/components/StrikesInfoModal";
import NoAvailabilityMessage from "@/components/NoAvailabilityMessage";
import LoadingScreen from "@/components/LoadingScreen";
import LogoutButton from "@/components/ui/logoutButton";
import AdminPageButton from "@/components/ui/adminPageButton";
import Header from "@/components/Header"

import { FaWhatsapp } from "react-icons/fa";
import { Clock } from "lucide-react";
import { Toaster } from 'react-hot-toast';
import { ScheduleProvider, useScheduleContext } from "@/lib/contexts/ScheduleContext";
import { isPartOfConsecutiveGroup, isUserReservation } from "@/lib/utils/slotUtils";
import { formatDate, isWeekend } from "@/lib/utils/dateUtils";
import { useEffect } from "react";

const WhatsAppButton = () => {
  const whatsappNumber = "+554196235364"; // Exemplo: número com DDD e número
  const message = "Olá, gostaria de mais informações sobre o agendamento.";

  const handleWhatsAppClick = () => {
    const cleanedNumber = whatsappNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanedNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button 
      onClick={handleWhatsAppClick}
      className="bg-blue-800 hover:bg-blue-900 text-white p-2 rounded-full shadow-lg transition-colors duration-300"
      title="Falar no WhatsApp"
    >
        <FaWhatsapp className="w-10 h-10" />
    </button>
  );
};


// Componente principal que usa o contexto
const ScheduleApp = () => { 
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = "/auth/login";
    },
  });

  useEffect(() => {
    if (session && session.user.isBanned) {
      signOut({ redirect: true, callbackUrl: "/auth/login" });
    }
  }, [session]);


  // Always call this hook, regardless of status
  const {
    selectedOption,
    selectedDate,
    availableSlots,
    consecutiveGroups,
    isLoading,
    firstLoading,
    showCancelDialog,
    showPixInfo,
    showStrikesInfo,
    userStrikes,
    PIX_KEY,
    CANCELATION_FEE,
    handleOptionChange,
    handleDateChange,
    handleReservation,
    handleCancelReservation,
    confirmLateCancelation,
    setShowCancelDialog,
    setShowPixInfo,
    setShowStrikesInfo,
    handleCopyPix
  } = useScheduleContext();

  // Now you can use conditional rendering after all hooks are called
  if (status === "loading") {
    return <LoadingScreen message="Verificando sua sessão..." />;
  }

  // Função de verificação de propriedade do horário
  const checkIsUserReservation = (slot: any) => {
    return isUserReservation(slot, session?.user?._id);
  };

  // Função para verificar se o slot faz parte de um grupo consecutivo
  const checkIsPartOfConsecutiveGroup = (index: number) => {
    return isPartOfConsecutiveGroup(index, selectedOption, consecutiveGroups);
  };


  return (
    <div className="bg-linear-to-b from-gray-900 to-black min-h-screen">
    <div className="max-w-lg mx-auto p-6 bg-gray-800 rounded-xl shadow-lg relative">
      {session?.user.isAdmin && (
      <div className="absolute top-4 left-4">
        <AdminPageButton />
      </div>
      )}
      {!session?.user.isAdmin && (
        <div className="absolute top-4 left-8">
          <WhatsAppButton />
        </div>
      )}

      <div className="absolute top-4 right-4">
        <LogoutButton />
      </div>

      {/* Substitua a div do texto pelo componente Header */}
      <Header />
      
      <DateSelectionSection 
        onChange={handleDateChange} 
        selectedDate={selectedDate} // Add this prop
      />
      
      <ServiceSelection 
        selectedOption={selectedOption} 
        onOptionChange={handleOptionChange} 
      />

      <Toaster/>
        
        {firstLoading && <LoadingScreen message="Carregando horários disponíveis..." />}
        
        {!firstLoading && selectedDate && availableSlots.length === 0 && (
          <NoAvailabilityMessage 
            isWeekend={isWeekend(selectedDate)} 
          />
        )}
  
        {selectedDate && availableSlots.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-300">
                {formatDate(selectedDate)}
              </h3>
            </div>
            
            <TimeSlotsGrid 
              slots={availableSlots}
              selectedOption={selectedOption}
              consecutiveGroups={consecutiveGroups}
              isUserReservation={checkIsUserReservation}
              isPartOfConsecutiveGroup={checkIsPartOfConsecutiveGroup}
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

};

// Componente que envolve o app com o provider
export default function Home() {
  return (
    <ScheduleProvider>
      <ScheduleApp />
    </ScheduleProvider>
  );
}