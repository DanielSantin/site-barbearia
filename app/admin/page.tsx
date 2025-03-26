"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import LoadingScreen from "@/components/LoadingScreen";
import DateSelectionSection from "@/components/DateSelectionSection";
import { ReactNode } from 'react';

type TimeSlot = {
  tooSoon: any;
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
  [x: string]: ReactNode;
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

type LogEntry = {
  _id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  actionType: string;
  additionalInfo: string;
  importance: string;
  timestamp: string;
};

type LogSummary = {
  totalLogs: number;
  importantLogs: number;
  actionCounts: {
    reservations: number;
    cancellations: number;
  };
  importantCancellations: number;
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
  const [view, setView] = useState<"schedules" | "users" | "logs">("schedules");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para o popup
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userAppointments, setUserAppointments] = useState<UserAppointment[]>([]);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  //Estados do Log
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logSummary, setLogSummary] = useState<LogSummary | null>(null);
  const [logsPage, setLogsPage] = useState(1);
  const [totalLogsPages, setTotalLogsPages] = useState(1);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logFilters, setLogFilters] = useState({
    importance: "",
    actionType: "",
    userId: "",
    startDate: "",
    endDate: ""
  });

  const fetchLogs = async (page = 1, filters = logFilters) => {
    try {
      setIsLoadingLogs(true);
      setError(null);
      
      // Construir URL com parâmetros de consulta
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");
      
      if (filters.importance) params.append("importance", filters.importance);
      if (filters.actionType) params.append("actionType", filters.actionType);
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      
      const response = await fetch(`/api/admin/logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Falha ao buscar logs");
      }
      
      const data = await response.json();
      
      setLogs(data.logs);
      setLogSummary(data.summary);
      setLogsPage(data.pagination.currentPage);
      setTotalLogsPages(data.pagination.totalPages);
    } catch (error: any) {
      console.error("Erro ao buscar logs:", error);
      setError(error.message || "Falha ao buscar logs. Tente novamente.");
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const clearOldLogs = async (days: number) => {
    if (!confirm(`Tem certeza que deseja excluir logs com mais de ${days} dias?`)) {
      return;
    }
    
    try {
      setError(null);
      const response = await fetch("/api/admin/logs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          olderThan: days
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao limpar logs");
      }
  
      const result = await response.json();
      setSuccess(`${result.deletedCount} logs foram excluídos com sucesso.`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Recarregar logs após exclusão
      fetchLogs();
    } catch (error: any) {
      console.error("Erro ao limpar logs:", error);
      setError(error.message || "Falha ao limpar logs. Tente novamente.");
    }
  };
  

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
      router.push("/auth");
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
      const response = await fetch(`/api/admin/schedules?date=${date}`);
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

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setLogFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyLogFilters = () => {
    fetchLogs(1, logFilters);
  };

  const resetLogFilters = () => {
    setLogFilters({
      importance: "",
      actionType: "",
      userId: "",
      startDate: "",
      endDate: ""
    });
    fetchLogs(1, {
      importance: "",
      actionType: "",
      userId: "",
      startDate: "",
      endDate: ""
    });
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

      if (view === "logs") {
        fetchLogs();
      }
      
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
      <LoadingScreen message="Verificando sua sessão..." />
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
    <div className="min-h-screen p-6 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">
          Painel do Administrador
        </h1>
        
        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={() => setView("schedules")}
            className={`px-4 py-2 rounded-lg font-medium ${
              view === "schedules" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
          >
            Gerenciar Agendamentos
          </button>
          <button
            onClick={() => setView("users")}
            className={`px-4 py-2 rounded-lg font-medium ${
              view === "users" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
          >
            Gerenciar Usuários
          </button>
          <button
            onClick={() => {
              setView("logs");
              fetchLogs();
            }}
            className={`px-4 py-2 rounded-lg font-medium ${
              view === "logs" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
          >
            Logs do Sistema
          </button>
          <button
            onClick={() => router.push("/")}
            className="ml-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Voltar ao Site
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-100 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-900 border border-green-700 text-green-100 rounded">
            {success}
          </div>
        )}

        {view === "schedules" && (
          <>
            <DateSelectionSection onChange={handleDateChange} selectedDate={selectedDate} />

            <div className="p-4 bg-gray-800 rounded-lg shadow mb-6">
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
                    className="border border-gray-600 bg-gray-700 text-gray-200 rounded px-3 py-1 text-sm"
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
                <p className="text-gray-400 italic">Nenhum horário encontrado para esta data.</p>
              ) : (
                <div className="overflow-x-auto">
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
                      {schedules[0]?.timeSlots.map((slot, index) => (
                        <tr key={index} className="border-t border-gray-600 hover:bg-gray-600">
                          <td className="py-2 px-4">{slot.time}</td>
                          <td className="py-2 px-4">
                            {slot.isPast ? (
                              <span className="text-gray-400">Passado</span>
                            ) : slot.booked ? (
                              <span className="text-red-400">Reservado</span>
                            ) : slot.tooSoon ? (
                              <span className="text-gray-400">Horário indisponível devido a antecedencia</span>
                            ) : (
                              <span className="text-green-400">Disponível</span>
                            )}
                          </td>
                          <td className="py-2 px-4">
                          {slot.userName ? (
                            <button
                              onClick={() => {
                                const user = users.find(u => u._id === slot.userId);
                                if (user) handleUserClick(user);
                              }}
                              className="text-blue-400 hover:underline cursor-pointer"
                            >
                              {slot.userName}
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
                                    onClick={() => blockTimeSlot(selectedDate, index)}
                                    className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 mr-2"
                                  >
                                    Bloquear
                                  </button>
                                ) : !slot.userId ? (
                                  <button
                                    onClick={() => unblockTimeSlot(selectedDate, index)}
                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                  >
                                    Desbloquear
                                  </button>
                                ) : (
                                  <span className="text-sm text-gray-400">Reservado pelo cliente</span>
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
          <div className="p-4 bg-gray-800 rounded-lg shadow text-gray-200">
            <h2 className="text-xl font-semibold mb-4">Gerenciar Usuários</h2>
            {users.length === 0 ? (
              <p className="text-gray-400 italic">Nenhum usuário encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-700 border-gray-600">
                  <thead>
                    <tr className="bg-gray-800 border-b border-gray-600">
                      <th className="py-2 px-4 text-left">Nome</th>
                      <th className="py-2 px-4 text-left">Email</th>
                      <th className="py-2 px-4 text-left">Tipo</th>
                      <th className="py-2 px-4 text-left">Status</th>
                      <th className="py-2 px-4 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-t border-gray-600 hover:bg-gray-600">
                        <td className="py-2 px-4">{user.name}</td>
                        <td className="py-2 px-4">{user.email}</td>
                        <td className="py-2 px-4">
                          <span className={user.isAdmin ? "text-purple-400 font-medium" : "text-gray-300"}>
                            {user.isAdmin ? "Administrador" : "Cliente"}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <span className={user.isBanned ? "text-red-400 font-medium" : "text-green-400 font-medium"}>
                            {user.isBanned ? "Bloqueado" : "Ativo"}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <button
                            onClick={() => handleUserClick(user)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 mr-2"
                          >
                            Ver Detalhes
                          </button>
                          <button
                            onClick={() => toggleUserBan(user._id, user.isBanned || false)}
                            className={`${user.isBanned ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white px-3 py-1 rounded text-sm`}
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

        {view === "logs" && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-800 rounded-lg shadow text-gray-200">
              <h2 className="text-xl font-semibold mb-4">Resumo de Logs</h2>
              {logSummary ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-900 rounded-lg border border-blue-700">
                    <p className="text-sm text-gray-300">Total de Logs</p>
                    <p className="text-2xl font-bold text-blue-300">{logSummary.totalLogs}</p>
                  </div>
                  <div className="p-3 bg-yellow-900 rounded-lg border border-yellow-700">
                    <p className="text-sm text-gray-300">Logs Importantes</p>
                    <p className="text-2xl font-bold text-yellow-300">{logSummary.importantLogs}</p>
                  </div>
                  <div className="p-3 bg-green-900 rounded-lg border border-green-700">
                    <p className="text-sm text-gray-300">Reservas</p>
                    <p className="text-2xl font-bold text-green-300">{logSummary.actionCounts.reservations}</p>
                  </div>
                  <div className="p-3 bg-red-900 rounded-lg border border-red-700">
                    <p className="text-sm text-gray-300">Cancelamentos (importantes)</p>
                    <p className="text-2xl font-bold text-red-300">{logSummary.importantCancellations}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 italic">Carregando resumo...</p>
              )}
            </div>

            <div className="p-4 bg-gray-800 rounded-lg shadow text-gray-200">
              <div className="flex flex-wrap items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Filtros</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={resetLogFilters}
                    className="px-3 py-1 text-sm bg-gray-600 text-gray-200 rounded hover:bg-gray-500"
                  >
                    Limpar Filtros
                  </button>
                  <button
                    onClick={() => clearOldLogs(30)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Limpar Logs de mais de 30 dias
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Importância</label>
                  <select
                    name="importance"
                    value={logFilters.importance}
                    onChange={handleFilterChange}
                    className="w-full border border-gray-600 rounded px-3 py-2 text-sm bg-gray-700 text-gray-200"
                  >
                    <option value="">Todos</option>
                    <option value="normal">Normal</option>
                    <option value="important">Importante</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Ação</label>
                  <select
                    name="actionType"
                    value={logFilters.actionType}
                    onChange={handleFilterChange}
                    className="w-full border border-gray-600 rounded px-3 py-2 text-sm bg-gray-700 text-gray-200"
                  >
                    <option value="">Todos</option>
                    <option value="reservation">Reserva</option>
                    <option value="cancellation">Cancelamento</option>
                    <option value="login">Login</option>
                    <option value="register">Registro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Data Inicial</label>
                  <input
                    type="date"
                    name="startDate"
                    value={logFilters.startDate}
                    onChange={handleFilterChange}
                    className="w-full border border-gray-600 rounded px-3 py-2 text-sm bg-gray-700 text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Data Final</label>
                  <input
                    type="date"
                    name="endDate"
                    value={logFilters.endDate}
                    onChange={handleFilterChange}
                    className="w-full border border-gray-600 rounded px-3 py-2 text-sm bg-gray-700 text-gray-200"
                  />
              </div>
              <div className="flex items-end">
                <button
                  onClick={applyLogFilters}
                  className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg shadow text-gray-300">
            <h2 className="text-xl font-semibold mb-4">Logs de Atividades</h2>
            
            {isLoadingLogs ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">Carregando logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <p className="text-center py-6 text-gray-500 italic">Nenhum log encontrado com os filtros selecionados.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-800">
                    <thead>
                      <tr className="bg-gray-700">
                        <th className="py-2 px-4 text-left">Data/Hora</th>
                        <th className="py-2 px-4 text-left">Usuário</th>
                        <th className="py-2 px-4 text-left">Ação</th>
                        <th className="py-2 px-4 text-left">Detalhes</th>
                        <th className="py-2 px-4 text-left">Importância</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id} className="border-t hover:bg-gray-800">
                          <td className="py-2 px-4 text-sm">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-2 px-4 text-sm">
                          {log.userName ? (
                            <button
                              onClick={() => {
                                const user = users.find(u => u._id === log.userId);
                                if (user) handleUserClick(user);
                              }}
                              className="text-blue-400 hover:underline cursor-pointer"
                            >
                              {log.userName}
                            </button>
                          ) : (
                            "-"
                          )}
                          </td>
                          <td className="py-2 px-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                              ${log.actionType === 'reservation' ? 'bg-green-100/90 text-green-800' : 
                                log.actionType === 'cancellation' ? 'bg-red-100/90 text-red-800' : 
                                log.actionType === 'login' ? 'bg-blue-100/90 text-blue-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {log.actionType === 'reservation' ? 'Reserva' : 
                              log.actionType === 'cancellation' ? 'Cancelamento' :
                              log.actionType === 'login' ? 'Login' :
                              log.actionType === 'register' ? 'Registro' : log.actionType}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-sm">{log.additionalInfo}</td>
                          <td className="py-2 px-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                              ${log.importance === 'important' ? 'bg-yellow-100/90 text-yellow-800' : 'bg-gray-100/90 text-gray-800'}`}>
                              {log.importance === 'important' ? 'Importante' : 'Normal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Paginação */}
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    Página {logsPage} de {totalLogsPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchLogs(logsPage - 1)}
                      disabled={logsPage <= 1}
                      className={`px-3 py-1 rounded text-sm ${
                        logsPage <= 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => fetchLogs(logsPage + 1)}
                      disabled={logsPage >= totalLogsPages}
                      className={`px-3 py-1 rounded text-sm ${
                        logsPage >= totalLogsPages 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      </div>

      

      {/* Modal para detalhes do usuário */}
      {showUserModal && selectedUser && (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Detalhes do Usuário</h2>
          <button 
            onClick={() => setShowUserModal(false)}
            className="text-gray-300 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-300 text-sm">Nome:</p>
              <p className="font-medium text-white">{selectedUser.name}</p>
            </div>
            <div>
              <p className="text-gray-300 text-sm">Email:</p>
              <p className="font-medium text-white">{selectedUser.email}</p>
            </div>
            <div>
              <p className="text-gray-300 text-sm">Tipo de conta:</p>
              <p className={`font-medium ${selectedUser.isAdmin ? "text-purple-400" : "text-gray-200"}`}>
                {selectedUser.isAdmin ? "Administrador" : "Cliente"}
              </p>
            </div>
            <div>
              <p className="text-gray-300 text-sm">Status:</p>
              <p className={`font-medium ${selectedUser.isBanned ? "text-red-400" : "text-green-400"}`}>
                {selectedUser.isBanned ? "Bloqueado" : "Ativo"}
              </p>
            </div>
            <div>
              <p className="text-gray-300 text-sm">Strikes:</p>
              <p className="font-medium text-red-400">
                {selectedUser.strikes || 0} de 5 strikes
              </p>
              <div 
                className="bg-red-500 h-2.5 rounded-full" 
                style={{ width: `${(Number(selectedUser.strikes || 0) / 5) * 100}%` }}
              ></div>
            </div>
            <div>
            <p className="text-gray-300 text-sm">Telefone:</p>
            <a
              href={`https://wa.me/55${selectedUser.whatsappPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-400 hover:underline"
            >
              {selectedUser.whatsappPhone} {selectedUser.whatsappVerified ? "(verificado)" : "(não verificado)"}
            </a>
          </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Agendamentos</h3>
          {isLoadingUserData ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-2 text-gray-300">Carregando agendamentos...</p>
            </div>
          ) : userAppointments.length === 0 ? (
            <p className="text-gray-300 italic">Nenhum agendamento encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="py-2 px-4 text-left border border-gray-600 text-gray-200">Data</th>
                    <th className="py-2 px-4 text-left border border-gray-600 text-gray-200">Horário</th>
                    <th className="py-2 px-4 text-left border border-gray-600 text-gray-200">Serviço</th>
                  </tr>
                </thead>
                <tbody>
                {userAppointments.map((appointment, index) => (
                    appointment.timeSlots.map((timeSlot: { time: string; service?: string }) => (
                      <tr key={index} className="hover:bg-gray-600">
                        <td className="py-2 px-4 border border-gray-600 text-gray-200">{formatDateFull(appointment.date)}</td>
                        <td className="py-2 px-4 border border-gray-600 text-gray-200">{timeSlot.time}</td>
                        <td className="py-2 px-4 border border-gray-600 text-gray-200">{timeSlot.service || "Não especificado"}</td>
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
            className={`${selectedUser.isBanned ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white px-4 py-2 rounded`}
          >
            {selectedUser.isBanned ? "Desbloquear Usuário" : "Bloquear Usuário"}
          </button>
          <button
            onClick={() => setShowUserModal(false)}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
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