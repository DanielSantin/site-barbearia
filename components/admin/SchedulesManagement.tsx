import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Scissors, Icon, Armchair } from "lucide-react";
import { razorBlade } from '@lucide/lab'

import { Schedule, TimeSlot } from "@/models/types";
import { getTextColorByRole } from "@/lib/utils/user"

type SchedulesManagementProps = {
  selectedDate: string;
  schedules: Schedule[];
  blockingService: string;
  setBlockingService: (service: string) => void;
  blockEntireDay: (date: string) => void;
  handleUserClick: (user: any) => void;
  users: any[];
  blockTimeSlot: (date: string, timeSlotIndex: number) => void;
  unblockTimeSlot: (date: string, timeSlotIndex: number) => void;
  removeClientReservation: (date: string, timeSlotIndex: number) => void;
  enableTimeSlot: (date: string, timeSlotIndex: number) => void;
};

const SchedulesManagement: React.FC<SchedulesManagementProps> = ({
  selectedDate,
  schedules,
  blockingService,
  setBlockingService,
  blockEntireDay,
  handleUserClick,
  users,
  blockTimeSlot,
  unblockTimeSlot,
  removeClientReservation,
  enableTimeSlot
}) => {
  const [expandedSlot, setExpandedSlot] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Atualiza o tempo a cada minuto
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Função para obter o nome do cliente a partir do ID
  const getUserNameById = (userId?: string | null) => {
    if (!userId) return null;
    const user = users.find(u => u._id === userId);
    return user ? user.name || user.username || "Cliente sem nome" : null;
  };

  const getServiceIcon = (service?: string | null) => {
    switch(service) {
      case 'Barba':
        return <Icon iconNode={razorBlade} className="w-7 h-7" />
      case 'Cabelo':
        return <Scissors className="w-7 h-7" />;
      default:
        return <Armchair className="w-7 h-7" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T12:00:00Z');
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  const getCurrentTimePosition = (slots: TimeSlot[]) => {
    const currentHourMinute = format(currentTime, 'HH:mm');
    const slotIndex = slots.findIndex(slot => 
      slot.time > currentHourMinute && !slot.isPast
    );
    return slotIndex;
  };

  // Função para renderizar um cartão móvel para cada time slot
  const renderMobileCard = (slot: TimeSlot, index: number, isActive: boolean) => {
    const isExpanded = expandedSlot === index;
    
    // Determinar a cor de fundo com base no status
    const bgColorClass = slot.isPast ? 'bg-gray-500' : 
                         slot.booked ? 'bg-red-500/30' : 
                         slot.tooSoon ? 'bg-gray-500' : 
                         'bg-green-500/30';

    const isCurrentTimeSlot = getCurrentTimePosition(schedules[0]?.timeSlots.filter(s => s.enabled !== false) || []) === index;
    const user = users.find(u => u._id === slot.userId);
    const clientName = getUserNameById(slot.userId);

    return (
      <div 
        key={index} 
        className={`rounded-lg mb-4 overflow-hidden ${bgColorClass} ${!isActive ? 'opacity-60' : ''}`}
        onClick={() => setExpandedSlot(isExpanded ? null : index)}
      >
        <div className="p-4 flex justify-between items-center font-semibold text-gray-100">
          <div className="flex items-center space-x-2">
            {getServiceIcon(slot.service)}

            {/* Horário e nome do cliente */}
            <span>
              {slot.time}
            </span>
            {clientName && (
              <span className={`truncate max-w-[150px] ${user ? getTextColorByRole(user.accountRole) : 'default-class'}`}>
                {clientName}
              </span>
            )}
          </div>
          <svg 
            className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        
        {isExpanded && (
          <div className={`p-4 space-y-4 ${slot.booked ? 'bg-red-400/20' : 'bg-green-400/20'}`}>
            {/* Detalhes completos */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Status:</span>
                <span className="text-gray-100">
                  {!isActive ? 'Desativado' :
                   slot.isPast ? 'Horário Passado' : 
                   slot.booked ? 'Reservado' : 
                   slot.tooSoon ? 'Indisponível' : 
                   'Disponível'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-300">Cliente:</span>
                <span className="text-gray-100">
                  {clientName ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const user = users.find(u => u._id === slot.userId);
                        if (user) handleUserClick(user);
                      }}
                      className="text-blue-400 hover:underline"
                    >
                      {clientName}
                    </button>
                  ) : '-'}
                </span>
              </div>
              
              <div className="flex justify-between text-gray-100">
                <span className="text-gray-300">Serviço:</span>
                <div className="flex items-center space-x-2">
                  {getServiceIcon(slot.service)}
                  <span className="text-gray-100">{slot.service || '-'}</span>
                </div>
              </div>
            </div>
            
            {/* Botões de ação */}
            {!isActive ? (
              <div className="flex justify-center space-x-2 mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    enableTimeSlot(selectedDate, index);
                  }}
                  className="bg-blue-600 text-white px-3 py-1 rounded-sm text-sm hover:bg-blue-700"
                >
                  Ativar
                </button>
              </div>
            ) : !slot.isPast && (
              <div className="flex justify-center space-x-2 mt-4">
                {!slot.booked ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      blockTimeSlot(selectedDate, index);
                    }}
                    className="bg-yellow-600 text-white px-3 py-1 rounded-sm text-sm hover:bg-yellow-700"
                  >
                    Bloquear
                  </button>
                ) : !slot.userId ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      unblockTimeSlot(selectedDate, index);
                    }}
                    className="bg-green-600 text-white px-3 py-1 rounded-sm text-sm hover:bg-green-700"
                  >
                    Desbloquear
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeClientReservation(selectedDate, index);
                    }}
                    className="bg-red-600 text-white px-3 py-1 rounded-sm text-sm hover:bg-red-700 " 
                  >
                    Remover Reserva
                  </button>
                )}
              </div>
            )}

            {isActive && slot.isPast ? (
              <div className="flex justify-center space-x-2 mt-4">
                <button 
                  className="bg-gray-600 text-white px-3 py-1 rounded-sm text-sm"
                  disabled={true}
                >
                  Ação Indisponível
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-sm mb-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-100">
          Agendamentos para {formatDate(selectedDate)}
        </h2>
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <input
            type="text"
            value={blockingService}
            onChange={(e) => setBlockingService(e.target.value)}
            placeholder="Motivo do bloqueio"
            className="border border-gray-600 bg-gray-700 text-gray-200 rounded-sm px-3 py-1 text-sm"
          />
          <button
            onClick={() => blockEntireDay(selectedDate)}
            className="bg-red-600 text-white px-3 py-1 rounded-sm text-sm hover:bg-red-700"
          >
            Bloquear Dia
          </button>
        </div>
      </div>

      {/* Seção de horários ativos */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-100 mb-3">Horários Ativos</h3>
        
        {/* Mobile layout para ativos */}
        <div className="block md:hidden">
          {schedules.length === 0 || !schedules[0]?.timeSlots.some(slot => slot.enabled !== false) ? (
            <p className="text-gray-400 italic">Nenhum horário ativo encontrado para esta data.</p>
          ) : (
            schedules[0]?.timeSlots
              .filter(slot => slot.enabled !== false)
              .map((slot, index) => {
                const originalIndex = schedules[0]?.timeSlots.findIndex(s => s.time === slot.time);
                return (renderMobileCard(slot, originalIndex, true))
              })
          )}
        </div>

        {/* Tabela para desktop - Slots Ativos */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full bg-gray-700 text-gray-200 border-gray-600">
            <thead>
              <tr className="bg-gray-800 border-b border-gray-600">
                <th className="py-2 px-4 text-left">Horário</th>
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4 text-left">Cliente</th>
                <th className="py-2 px-4 text-left">Serviço</th>
                <th className="py-2 px-4 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length > 0 ? (
                schedules[0]?.timeSlots
                  .filter(slot => slot.enabled !== false)
                  .map((slot, index) => {
                    const originalIndex = schedules[0]?.timeSlots.findIndex(s => s.time === slot.time);
                    const clientName = getUserNameById(slot.userId);
                    return (
                      <tr key={originalIndex} className="border-t border-gray-600 hover:bg-gray-600">
                        <td className="py-2 px-4">{slot.time}</td>
                        <td className="py-2 px-4">
                          {slot.isPast ? (
                            <span className="text-gray-400">Passado</span>
                          ) : slot.booked ? (
                            <span className="text-red-400">Reservado</span>
                          ) : slot.tooSoon ? (
                            <span className="text-gray-400">Horário indisponível devido a antecedência</span>
                          ) : (
                            <span className="text-green-400">Disponível</span>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          {clientName ? (
                            <button
                              onClick={() => {
                                const user = users.find(u => u._id === slot.userId);
                                if (user) handleUserClick(user);
                              }}
                              className="text-blue-400 hover:underline cursor-pointer"
                            >
                              {clientName}
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-2 px-4">
                          {slot.service || "-"}
                        </td>
                        <td className="py-2 px-4">
                          {!slot.isPast && (
                            <>
                              {!slot.booked ? (
                                <button
                                  onClick={() => blockTimeSlot(selectedDate, originalIndex)}
                                  className="bg-yellow-600 text-white px-3 py-1 rounded-sm text-sm hover:bg-yellow-700 mr-2"
                                >
                                  Bloquear
                                </button>
                              ) : !slot.userId ? (
                                <button
                                  onClick={() => unblockTimeSlot(selectedDate, originalIndex)}
                                  className="bg-green-600 text-white px-3 py-1 rounded-sm text-sm hover:bg-green-700"
                                >
                                  Desbloquear
                                </button>
                              ) : (
                                <button
                                  onClick={() => removeClientReservation(selectedDate, originalIndex)}
                                  className="bg-red-600 text-white px-3 py-1 rounded-sm text-sm hover:bg-red-700"
                                >
                                  Remover Reserva
                                </button>
                              )}
                            </>
                          )}

                          {slot.isPast ? (
                            <button 
                              className="bg-gray-600 text-white px-3 py-1 rounded-sm text-sm"
                              disabled={true}
                            >
                              Ação Indisponível
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400 italic">
                    Nenhum horário ativo encontrado para esta data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seção de horários desativados */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-3">Horários Desativados</h3>
        
        {/* Mobile layout para inativos */}
        <div className="block md:hidden">
          {schedules.length === 0 || !schedules[0]?.timeSlots.some(slot => slot.enabled === false) ? (
            <p className="text-gray-400 italic">Nenhum horário desativado encontrado para esta data.</p>
          ) : (
            schedules[0]?.timeSlots
              .filter(slot => slot.enabled === false)
              .map((slot, index) => renderMobileCard(slot, index, false))
          )}
        </div>

        {/* Tabela para desktop - Slots Inativos */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full bg-gray-700 text-gray-200 border-gray-600">
            <thead>
              <tr className="bg-gray-800 border-b border-gray-600">
                <th className="py-2 px-4 text-left">Horário</th>
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4 text-left">Cliente</th>
                <th className="py-2 px-4 text-left">Serviço</th>
                <th className="py-2 px-4 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length > 0 && schedules[0]?.timeSlots.some(slot => slot.enabled === false) ? (
                schedules[0]?.timeSlots
                  .filter(slot => slot.enabled === false)
                  .map((slot, index) => {
                    const originalIndex = schedules[0]?.timeSlots.findIndex(s => s.time === slot.time);
                    const clientName = getUserNameById(slot.userId);
                    return (
                      <tr key={originalIndex} className="border-t border-gray-600 hover:bg-gray-600">
                        <td className="py-2 px-4">{slot.time}</td>
                        <td className="py-2 px-4">
                          <span className="text-yellow-400">Desativado</span>
                        </td>
                        <td className="py-2 px-4">
                          {clientName ? (
                            <button
                              onClick={() => {
                                const user = users.find(u => u._id === slot.userId);
                                if (user) handleUserClick(user);
                              }}
                              className="text-blue-400 hover:underline cursor-pointer"
                            >
                              {clientName}
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-2 px-4">
                          {slot.service || "-"}
                        </td>
                        <td className="py-2 px-4">
                          <button
                            onClick={() => enableTimeSlot(selectedDate, originalIndex)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-sm text-sm hover:bg-blue-700"
                          >
                            Ativar
                          </button>
                        </td>
                      </tr>
                    );
                  })
              ) : ( 
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400 italic">
                    Nenhum horário desativado encontrado para esta data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SchedulesManagement;