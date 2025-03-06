"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";

export default function MinhasReservas() {
  const [reservas, setReservas] = useState([]);

  useEffect(() => {
    async function fetchReservas() {
        // Só busca reservas se o usuário estiver autenticado
        if (status === "authenticated" && session) {
            try {
            const response = await axios.get("/api/schedules?userReservations=true");
            console.log("Reservas recebidas:", response.data);
            
            // Extrair as reservas do usuário
            const reservasData = response.data.flatMap((r) =>
                r.timeSlots
                  .filter((slot) => slot.userId === session.user.id) // Apenas slots deste usuário
                  .map((slot) => ({ date: r.date, time: slot.time }))
              );
              
            setReservas(reservasData);
            } catch (error) {
            console.error("Erro ao buscar reservas:", error);
            }
        }
        }
    fetchReservas();
  }, []);

  async function cancelarReserva(date, time) {
    await axios.delete("/api/schedules", { data: { date, time } });
    setReservas(reservas.filter(r => !(r.date === date && r.time === time)));
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Minhas Reservas</h1>
      {reservas.length === 0 ? (
        <p>Você não tem reservas ativas.</p>
      ) : (
        <ul>
          {reservas.map((reserva) => (
            <li key={`${reserva.date}-${reserva.time}`} className="flex justify-between border p-2 my-2">
              {reserva.date} - {reserva.time}
              <Button onClick={() => cancelarReserva(reserva.date, reserva.time)}>Cancelar</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
