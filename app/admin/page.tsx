"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

type TimeSlot = {
  time: string;
  userId: string | null;
  userName?: string | null;
  booked?: boolean;
  service?: string | null;
  bookedAt?: string | null;
  canceledAt?: string | null;
  isPast?: boolean;
};

type Schedule = {
  _id: string;
  date: string;
  timeSlots: TimeSlot[];
};

type User = {
  _id: string;
  name: string;
  email: string;
  image?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
};

type UserAppointment = {
  timeSlots: any;
  date: string;
  time: string;
  service: string;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [dates, setDates] = useState<string[]>([]);
  const [blockingService, setBlockingService] = useState<string>("Bloqueado");
  const [view, setView] = useState<"schedules" | "users">("schedules");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para o popup
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userAppointments, setUserAppointments] = useState<UserAppointment[]>([]);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  // Gerar datas para os próximos 30 dias
  useEffect(() => {
    const nextDates = Array.from({ length: 30 }, (_, i) => {
      const date = addDays(new Date(), i);
      return format(date, "yyyy-MM-dd");
    });
    setDates(nextDates);
  }, []);

  // Verificar se o usuário é admin
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/user/isAdmin");
        const data = await response.json();

        if (data.isAdmin) {
          setIsAdmin(true);
          fetchSchedules(selectedDate);
          fetchUsers();
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Erro ao verificar status de admin:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [session, status, router, selectedDate]);

  const fetchSchedules = async (date: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/schedules?date=${date}`);
      if (!response.ok) throw new Error("Falha ao buscar agendamentos");
      
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      setError("Falha ao carregar agendamentos. Tente novamente.");
    }
  };

  const fetchUsers = async () => {
    try {
      setError(null);
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Falha ao buscar usuários");
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      setError("Falha ao carregar dados de usuários. Tente novamente.");
    }
  };

  const fetchUserAppointments = async (userId: string) => {
    try {
      setIsLoadingUserData(true);
      const response = await fetch(`/api/admin/userAppointments?userId=${userId}`);
      if (!response.ok) throw new Error("Falha ao buscar agendamentos do usuário");
      
      const data = await response.json();
      setUserAppointments(data);
    } catch (error) {
      console.error("Erro ao buscar agendamentos do usuário:", error);
      setError("Falha ao carregar agendamentos do usuário. Tente novamente.");
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const handleUserClick = async (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
    await fetchUserAppointments(user._id);
  };

  const handleDateChange = (date: string) => {
    console.log(date);
    setSelectedDate(date);
    fetchSchedules(date);
  };

  const blockTimeSlot = async (date: string, timeSlotIndex: number) => {
    try {
      setError(null);
      const response = await fetch("/api/admin/blockTimeSlot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          timeSlotIndex,
          service: blockingService,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao bloquear horário");
      }

      setSuccess("Horário bloqueado com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
      fetchSchedules(selectedDate);
    } catch (error: any) {
      console.error("Erro ao bloquear horário:", error);
      setError(error.message || "Falha ao bloquear horário. Tente novamente.");
    }
  };

  const unblockTimeSlot = async (date: string, timeSlotIndex: number) => {
    try {
      setError(null);
      const response = await fetch("/api/admin/unblockTimeSlot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          timeSlotIndex,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao desbloquear horário");
      }

      setSuccess("Horário desbloqueado com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
      fetchSchedules(selectedDate);
    } catch (error: any) {
      console.error("Erro ao desbloquear horário:", error);
      setError(error.message || "Falha ao desbloquear horário. Tente novamente.");
    }
  };

  const blockEntireDay = async (date: string) => {
    try {
      setError(null);
      const response = await fetch("/api/admin/blockEntireDay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          service: blockingService,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao bloquear dia");
      }

      setSuccess("Dia bloqueado com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
      fetchSchedules(selectedDate);
    } catch (error: any) {
      console.error("Erro ao bloquear dia:", error);
      setError(error.message || "Falha ao bloquear dia. Tente novamente.");
    }
  };

  const toggleUserBan = async (userId: string, currentBanStatus: boolean) => {
    try {
      setError(null);
      const response = await fetch("/api/admin/toggleUserBan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          isBanned: !currentBanStatus
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao atualizar status do usuário");
      }

      setSuccess(`Usuário ${!currentBanStatus ? "bloqueado" : "desbloqueado"} com sucesso!`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Atualizar lista de usuários
      fetchUsers();
      
      // Se o usuário está selecionado no modal, atualizar seus dados também
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({
          ...selectedUser,
          isBanned: !currentBanStatus
        });
      }
    } catch (error: any) {
      console.error("Erro ao alterar status do usuário:", error);
      setError(error.message || "Falha ao atualizar status do usuário. Tente novamente.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T12:00:00Z');  // Força o fuso horário UTC
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  const formatDateFull = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="mb-4">Você não tem permissão para acessar esta página.</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Voltar para a Página Inicial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Painel do Administrador
        </h1>
        
        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={() => setView("schedules")}
            className={`px-4 py-2 rounded-lg font-medium ${
              view === "schedules" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Gerenciar Agendamentos
          </button>
          <button
            onClick={() => setView("users")}
            className={`px-4 py-2 rounded-lg font-medium ${
              view === "users" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Gerenciar Usuários
          </button>
          <button
            onClick={() => router.push("/")}
            className="ml-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Voltar ao Site
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {view === "schedules" && (
          <>
            <div className="mb-6 p-4 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Selecionar Data</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
                {dates.map((date) => (
                  <button
                    key={date}
                    onClick={() => handleDateChange(date)}
                    className={`p-2 text-sm border rounded ${
                      selectedDate === date
                        ? "bg-blue-600 text-white border-blue-700"
                        : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    {formatDate(date)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow mb-6">
              <div className="flex flex-wrap items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Agendamentos para {formatDate(selectedDate)}
                </h2>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <input
                    type="text"
                    value={blockingService}
                    onChange={(e) => setBlockingService(e.target.value)}
                    placeholder="Motivo do bloqueio"
                    className="border rounded px-3 py-1 text-sm"
                  />
                  <button
                    onClick={() => blockEntireDay(selectedDate)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Bloquear Dia Inteiro
                  </button>
                </div>
              </div>

              {schedules.length === 0 ? (
                <p className="text-gray-500 italic">Nenhum horário encontrado para esta data.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 text-left">Horário</th>
                        <th className="py-2 px-4 text-left">Status</th>
                        <th className="py-2 px-4 text-left">Cliente</th>
                        <th className="py-2 px-4 text-left">Serviço</th>
                        <th className="py-2 px-4 text-left">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules[0]?.timeSlots.map((slot, index) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          <td className="py-2 px-4">{slot.time}</td>
                          <td className="py-2 px-4">
                            {slot.isPast ? (
                              <span className="text-gray-500">Passado</span>
                            ) : slot.booked ? (
                              <span className="text-red-600">Reservado</span>
                            ) : (
                              <span className="text-green-600">Disponível</span>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            {slot.userName || "-"}
                          </td>
                          <td className="py-2 px-4">
                            {slot.service || "-"}
                          </td>
                          <td className="py-2 px-4">
                            {!slot.isPast && (
                              <>
                                {!slot.booked ? (
                                  <button
                                    onClick={() => blockTimeSlot(selectedDate, index)}
                                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 mr-2"
                                  >
                                    Bloquear
                                  </button>
                                ) : !slot.userId ? (
                                  <button
                                    onClick={() => unblockTimeSlot(selectedDate, index)}
                                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                                  >
                                    Desbloquear
                                  </button>
                                ) : (
                                  <span className="text-sm text-gray-500">Reservado pelo cliente</span>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {view === "users" && (
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Gerenciar Usuários</h2>
            {users.length === 0 ? (
              <p className="text-gray-500 italic">Nenhum usuário encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 text-left">Nome</th>
                      <th className="py-2 px-4 text-left">Email</th>
                      <th className="py-2 px-4 text-left">Tipo</th>
                      <th className="py-2 px-4 text-left">Status</th>
                      <th className="py-2 px-4 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-t hover:bg-gray-50">
                        <td className="py-2 px-4">{user.name}</td>
                        <td className="py-2 px-4">{user.email}</td>
                        <td className="py-2 px-4">
                          <span className={user.isAdmin ? "text-purple-600 font-medium" : "text-gray-600"}>
                            {user.isAdmin ? "Administrador" : "Cliente"}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <span className={user.isBanned ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                            {user.isBanned ? "Bloqueado" : "Ativo"}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <button
                            onClick={() => handleUserClick(user)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 mr-2"
                          >
                            Ver Detalhes
                          </button>
                          <button
                            onClick={() => toggleUserBan(user._id, user.isBanned || false)}
                            className={`${user.isBanned ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-white px-3 py-1 rounded text-sm`}
                          >
                            {user.isBanned ? "Desbloquear" : "Bloquear"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para detalhes do usuário */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Detalhes do Usuário</h2>
                <button 
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">Nome:</p>
                    <p className="font-medium">{selectedUser.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Email:</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Tipo de conta:</p>
                    <p className={`font-medium ${selectedUser.isAdmin ? "text-purple-600" : "text-gray-800"}`}>
                      {selectedUser.isAdmin ? "Administrador" : "Cliente"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Status:</p>
                    <p className={`font-medium ${selectedUser.isBanned ? "text-red-600" : "text-green-600"}`}>
                      {selectedUser.isBanned ? "Bloqueado" : "Ativo"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Agendamentos</h3>
                {isLoadingUserData ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Carregando agendamentos...</p>
                  </div>
                ) : userAppointments.length === 0 ? (
                  <p className="text-gray-500 italic">Nenhum agendamento encontrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="py-2 px-4 text-left border">Data</th>
                          <th className="py-2 px-4 text-left border">Horário</th>
                          <th className="py-2 px-4 text-left border">Serviço</th>
                        </tr>
                      </thead>
                      <tbody>
                      {userAppointments.map((appointment, index) => (
                          appointment.timeSlots.map((timeSlot) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="py-2 px-4 border">{formatDateFull(appointment.date)}</td>
                              <td className="py-2 px-4 border">{timeSlot.time}</td>
                              <td className="py-2 px-4 border">{timeSlot.service || "Não especificado"}</td>
                            </tr>
                          ))
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={() => toggleUserBan(selectedUser._id, selectedUser.isBanned || false)}
                  className={`${selectedUser.isBanned ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-white px-4 py-2 rounded`}
                >
                  {selectedUser.isBanned ? "Desbloquear Usuário" : "Bloquear Usuário"}
                </button>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}