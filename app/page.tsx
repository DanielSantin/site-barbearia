"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Para redirecionamento
import { LogoutButton } from "@/components/auth/LogoutButton"; // Supondo que já tenha o componente de logout

interface TimeSlot {
  time: string;
  booked: boolean;
}

interface Schedule {
  date: string;
  timeSlots: TimeSlot[];
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter(); // Hook para redirecionamento
  const [loading, setLoading] = useState(true); // Controle de carregamento

  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Função para formatar o dia da semana e data (dia/mês)
  const formatDate = (date: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short', // Exibe o dia da semana (ex: 'Seg')
      day: '2-digit', // Exibe o dia (ex: '04')
      month: 'short', // Exibe o mês abreviado (ex: 'Mar')
    };
    const formattedDate = new Date(date).toLocaleDateString("pt-BR", options);
    return formattedDate;
  };

  // Verifica se o usuário está autenticado e redireciona se necessário
  useEffect(() => {
    if (status === "loading") return; // Não faz nada enquanto carrega a sessão

    if (!session) {
      router.push("/auth"); // Redireciona para a página de login se não estiver autenticado
    } else {
      setLoading(false); // Depois de verificar a sessão, marca como "carregamento concluído"
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!loading) {
      // Só faz a busca de horários depois que a autenticação estiver carregada
      fetch("/api/schedule")
        .then((res) => res.json())
        .then((data) => setSchedules(data))
        .catch((err) => console.error("Erro ao buscar horários", err));
    }
  }, [loading]);

  const reserveSlot = async (date: string, time: string) => {
    const response = await fetch("/api/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date, time }),
    });

    if (response.ok) {
      setSchedules((prevSchedules) =>
        prevSchedules.map((schedule) => {
          if (schedule.date === date) {
            return {
              ...schedule,
              timeSlots: schedule.timeSlots.map((slot) =>
                slot.time === time ? { ...slot, booked: true } : slot
              ),
            };
          }
          return schedule;
        })
      );
      alert("Horário reservado com sucesso");
    } else {
      alert("Erro ao reservar horário");
    }
  };

  // No seu código do componente Home

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full border-t-4 border-blue-500 h-16 w-16 border-solid"></div>
        <span className="ml-4 text-lg font-semibold text-[#6a4e23]">Carregando...</span>
      </div>
    );
  }


  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <header className="w-full flex justify-between items-center p-4 bg-primary-color text-white">
        <div>
          <h1 className="text-2xl font-bold">Calvos Club</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-lg">{session?.user?.name || "Usuário"}</span>
          <LogoutButton />
        </div>
      </header>

      <section className="w-full max-w-3xl mx-auto p-4">
        <h2 className="text-xl font-semibold mb-4">Horários Disponíveis</h2>

        {schedules.length > 0 ? (
          schedules.map((schedule) => (
            <div key={schedule.date} className="card mb-6">
              <h3 className="text-lg font-semibold text-center mb-2 text-[#6a4e23] rounded p-2">
              {formatDate(schedule.date)}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {schedule.timeSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    disabled={slot.booked}
                    className={`slot ${slot.booked ? "bg-gray-300" : "bg-primary-color"}`}
                    onClick={() => !slot.booked && reserveSlot(schedule.date, slot.time)}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-xl">Nenhum horário disponível</p>
        )}
      </section>
    </main>
  );
}
