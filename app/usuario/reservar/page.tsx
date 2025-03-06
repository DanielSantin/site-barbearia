"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Button from "@/components/ui/button";
import { useSession } from "next-auth/react";

export default function ReservarHorario() {
  const { data: session, status } = useSession();
  const [horarios, setHorarios] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  useEffect(() => {
    console.log("useEffect está sendo chamado");
    async function fetchHorarios() {
      try {
        setLoading(true);
        const response = await axios.get("/api/schedules");
        setHorarios(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
        setError("Falha ao carregar horários disponíveis");
        setLoading(false);
      }
    }
    
    async function fetchReservas() {
      // Só busca reservas se o usuário estiver autenticado
      if (status === "authenticated" && session) {
        try {
          const response = await axios.get("/api/schedules?userReservations=true");
          // Extrair as reservas do usuário
          const reservasData = response.data.flatMap((r) =>
            r.timeSlots
              .filter((slot) => slot.userId !== null)
              .map((slot) => ({ date: r.date, time: slot.time }))
          );
          setReservas(reservasData);
        } catch (error) {
          console.error("Erro ao buscar reservas:", error);
        }
      }
    }


    // Carregar os horários e as reservas
    console.log("Chamando fetchHorarios");
    fetchHorarios();
    
    // Só busca reservas se o usuário estiver autenticado
    if (status === "authenticated") {
      fetchReservas();
    }


  }, [status, session]);

  
  async function reservarHorario(date, time) {
    if (status !== "authenticated") {
      setError("Você precisa estar logado para reservar um horário");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post("/api/schedules", { date, time });
      
      // Atualiza o estado de reservas
      setReservas((prevReservas) => [...prevReservas, { date, time }]);
      
      // Atualiza os horários disponíveis
      const updatedHorarios = horarios.map(dia => {
        if (dia.date === date) {
          return {
            ...dia,
            timeSlots: dia.timeSlots.map(slot => {
              if (slot.time === time) {
                return { ...slot, booked: true, userId: session.user.id };
              }
              return slot;
            })
          };
        }
        return dia;
      });
      
      setHorarios(updatedHorarios);
      setSuccessMessage("Horário reservado com sucesso!");
      
      // Limpa a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      setLoading(false);
    } catch (error) {
      console.error("Erro ao reservar horário:", error.response?.data || error.message);
      setError(error.response?.data?.error || "Falha ao reservar horário");
      setLoading(false);
    }
  }

  async function cancelarReserva(date, time) {
    if (status !== "authenticated") {
      setError("Você precisa estar logado para cancelar uma reserva");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Faz a chamada para a API de cancelamento
      const response = await axios.delete("/api/schedules", { 
        data: { date, time } 
      });
      
      // Atualiza o estado de reservas (remove a reserva cancelada)
      setReservas((prevReservas) => 
        prevReservas.filter(r => !(r.date === date && r.time === time))
      );
      
      // Atualiza os horários disponíveis
      const updatedHorarios = horarios.map(dia => {
        if (dia.date === date) {
          return {
            ...dia,
            timeSlots: dia.timeSlots.map(slot => {
              if (slot.time === time) {
                return { ...slot, booked: false, userId: null };
              }
              return slot;
            })
          };
        }
        return dia;
      });
      
      setHorarios(updatedHorarios);
      setSuccessMessage("Reserva cancelada com sucesso!");
      
      // Limpa a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      setLoading(false);
    } catch (error) {
      console.error("Erro ao cancelar reserva:", error.response?.data || error.message);
      setError(error.response?.data?.error || "Falha ao cancelar reserva");
      setLoading(false);
    }
  }

  if (status === "loading") {
    return <div className="p-4">Verificando autenticação...</div>;
  }

  if (loading && horarios.length === 0) {
    return <div className="p-4">Carregando horários...</div>;
  }




      

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Reservar Horário</h1>
      
      {status !== "authenticated" && (
        <div className="p-3 mb-4 bg-yellow-100 text-yellow-800 rounded">
          Você precisa estar <a href="/login" className="underline font-bold">logado</a> para reservar horários.
        </div>
      )}
      
      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      
      {successMessage && (
        <div className="p-3 mb-4 bg-green-100 text-green-700 rounded">{successMessage}</div>
      )}
      
      {horarios.length === 0 ? (
        <p>Não há horários disponíveis.</p>
      ) : (
        <div>
          {status === "authenticated" && (
            <p className="mb-4">Você tem {reservas.length} reserva(s) ativa(s). Máximo: 2 reservas.</p>
          )}
          
          <div className="space-y-6">
            {horarios.map((dia) => (
              <div key={dia.date} className="border rounded-lg p-4">
                <h2 className="font-bold text-lg mb-3">
                    {new Date(`${dia.date}T12:00:00`).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dia.timeSlots.map((slot) => {
                    const isReserved = reservas.some(
                      (r) => r.date === dia.date && r.time === slot.time
                    );
                    const isBooked = slot.booked;
                    
                    return (
                      <div
                        key={`${dia.date}-${slot.time}`}
                        className={`flex justify-between items-center p-3 rounded ${
                          isReserved 
                            ? 'bg-green-100 border-green-300 border' 
                            : isBooked 
                              ? 'bg-gray-100 border-gray-300 border'
                              : 'bg-white border border-gray-200'
                        }`}
                      >
                        <span className="font-medium">{slot.time}</span>
                        <div className="flex space-x-2">
                          {isReserved ? (
                            <>
                              <Button
                                className="bg-green-500 hover:bg-green-600"
                                disabled={true}
                              >
                                Reservado
                              </Button>
                              <Button
                                onClick={() => cancelarReserva(dia.date, slot.time)}
                                className="bg-red-500 hover:bg-red-600"
                                disabled={loading}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => reservarHorario(dia.date, slot.time)}
                              disabled={isBooked || loading || status !== "authenticated" || reservas.length >= 2}
                              className={
                                isBooked 
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : ''
                              }
                            >
                              {isBooked ? "Indisponível" : "Reservar"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}