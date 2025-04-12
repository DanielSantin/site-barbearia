"use client";

import { Schedule, User, UserAppointment, LogEntry, LogSummary } from "@/models/types";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import LoadingScreen from "@/components/LoadingScreen";

import AdminViewSelector from '@/components/admin/AdminViewSelector'
import AdminNavigation from '@/components/admin/AdminNavigation'
import UserModal from "@/components/admin/UserModal"
import toast, { Toaster } from 'react-hot-toast';

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
      toast.error(error.message || "Falha ao buscar logs. Tente novamente.");
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const clearOldLogs = async (days: number) => {
    if (!confirm(`Tem certeza que deseja excluir logs com mais de ${days} dias?`)) {
      return;
    }

    try {
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
      toast.success(`${result.deletedCount} logs foram excluídos com sucesso.`);
      
      // Recarregar logs após exclusão
      fetchLogs();
    } catch (error: any) {
      console.error("Erro ao limpar logs:", error);
      toast.error(error.message || "Falha ao limpar logs. Tente novamente.");
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
        const response = await fetch("/api/admin/isAdmin");
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
      const response = await fetch(`/api/admin/schedules?date=${date}`);
      if (!response.ok) throw new Error("Falha ao buscar agendamentos");
      
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Falha ao carregar agendamentos. Tente novamente.");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Falha ao buscar usuários");
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast.error("Falha ao carregar dados de usuários. Tente novamente.");
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
      toast.error("Falha ao carregar agendamentos do usuário. Tente novamente.");
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

      toast.success("Horário bloqueado com sucesso!");
      fetchSchedules(selectedDate);
    } catch (error: any) {
      console.error("Erro ao bloquear horário:", error);
      toast.error(error.message || "Falha ao bloquear horário. Tente novamente.");
    }
  };

  const unblockTimeSlot = async (date: string, timeSlotIndex: number) => {
    try {
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

      toast.success("Horário desbloqueado com sucesso!");
      fetchSchedules(selectedDate);
    } catch (error: any) {
      console.error("Erro ao desbloquear horário:", error);
      toast.success(error.message || "Falha ao desbloquear horário. Tente novamente.");
    }
  };


  const removeClientReservation = async (date: string, timeSlotIndex: number) => {
    try {
      const response = await fetch("/api/admin/schedules", {
        method: "DELETE",
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
        throw new Error(errorData.error || "Falha ao remover reserva");
      }

      toast.success("Reserva removida com sucesso!");
      fetchSchedules(selectedDate);
    } catch (error: any) {
      console.error("Erro ao remover reserva:", error);
      toast.success(error.message || "Falha ao desbloquear horário. Tente novamente.");
    }
  };


  const blockEntireDay = async (date: string) => {
    try {
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

      toast.success("Dia bloqueado com sucesso!");
      fetchSchedules(selectedDate);
    } catch (error: any) {
      console.error("Erro ao bloquear dia:", error);
      toast.error(error.message || "Falha ao bloquear dia. Tente novamente.");
    }
  };

  const toggleUserBan = async (userId: string, currentBanStatus: boolean) => {
    try {
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

      toast.success(`Usuário ${!currentBanStatus ? "bloqueado" : "desbloqueado"} com sucesso!`)
      
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
      toast.error(error.message || "Falha ao atualizar status do usuário. Tente novamente.");
    }
  };


  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch("/api/admin/changeRole", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          newRole
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao atualizar status do usuário");
      }

      // Atualizar lista de usuários
      fetchUsers();

      if (view === "logs") {
        fetchLogs();
      }
      
      // Se o usuário está selecionado no modal, atualizar seus dados também
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({
          ...selectedUser,
          accountRole: newRole
        });
      }
    } catch (error: any) {
      console.error("Erro ao alterar status do usuário:", error);
      toast.error(error.message || "Falha ao atualizar status do usuário. Tente novamente.");
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

  if (isLoading || !isAdmin) {
    return (
      <LoadingScreen message="Verificando sua sessão..." />
    );
  }
  return (
    <div className="min-h-screen p-6 bg-linear-to-b from-gray-900 to-black">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">
          Painel do Administrador
        </h1>
        
        <AdminNavigation 
          view={view} 
          setView={setView} 
          fetchLogs={fetchLogs} 
        />

        <AdminViewSelector 
          view={view}
          selectedDate={selectedDate}
          handleDateChange={handleDateChange}
          fetchSchedules={fetchSchedules}
          fetchUsers={fetchUsers}
          fetchLogs={fetchLogs}
          blockingService={blockingService}
          setBlockingService={setBlockingService}
          blockEntireDay={blockEntireDay}
          handleUserClick={handleUserClick}
          users={users}
          schedules={schedules}
          logs={logs}
          logSummary={logSummary}
          logFilters={logFilters}
          setLogFilters={setLogFilters}
          handleFilterChange={handleFilterChange}
          applyLogFilters={applyLogFilters}
          resetLogFilters={resetLogFilters}
          clearOldLogs={clearOldLogs}
          logsPage={logsPage}
          totalLogsPages={totalLogsPages}
          isLoadingLogs={isLoadingLogs}
          blockTimeSlot={blockTimeSlot}
          unblockTimeSlot={unblockTimeSlot}
          removeClientReservation={removeClientReservation}
        />
      </div>

      {showUserModal && selectedUser && (
        <div>
        <UserModal 
          setShowUserModal={setShowUserModal}
          selectedUser={selectedUser}
          isLoadingUserData={isLoadingUserData}
          userAppointments={userAppointments}
          toggleUserBan={toggleUserBan}
          formatDateFull={formatDateFull}
          changeUserRole={changeUserRole}
        />
        </div>
      )}

      <Toaster />


    </div>
  );
}