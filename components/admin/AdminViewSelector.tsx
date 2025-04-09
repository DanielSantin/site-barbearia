import React from 'react';
import DateSelectionSection from "@/components/DateSelectionSection";
import UsersManagement from './UsersManagement';
import SchedulesManagement from './SchedulesManagement';
import LogsManagement from './LogsManagement';
import { User } from "@/models/types";


type AdminViewSelectorProps = {
  view: "schedules" | "users" | "logs";
  selectedDate: string;
  handleDateChange: (date: string) => void;
  fetchSchedules: (date: string) => void;
  fetchUsers: () => void;
  fetchLogs: (page?: number, filters?: any) => void;
  blockingService: string;
  setBlockingService: (service: string) => void;
  blockEntireDay: (date: string) => void;
  handleUserClick: (user: User) => void;
  users: any[];
  schedules: any[];
  logs: any[];
  logSummary: any;
  logFilters: any;
  setLogFilters: (filters: any) => void;
  handleFilterChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  applyLogFilters: () => void;
  resetLogFilters: () => void;
  clearOldLogs: (days: number) => void;
  logsPage: number;
  totalLogsPages: number;
  isLoadingLogs: boolean;
  blockTimeSlot: (date: string, timeSlotIndex: number) => void;
  unblockTimeSlot: (date: string, timeSlotIndex: number) => void;
  removeClientReservation: (date: string, timeSlotIndex: number) => void;
};

const AdminViewSelector: React.FC<AdminViewSelectorProps> = ({
  view, 
  selectedDate, 
  handleDateChange,
  fetchSchedules,
  fetchUsers,
  fetchLogs,
  blockingService,
  setBlockingService,
  blockEntireDay,
  handleUserClick,
  users,
  schedules,
  logs,
  logSummary,
  logFilters,
  setLogFilters,
  handleFilterChange,
  applyLogFilters,
  resetLogFilters,
  clearOldLogs,
  logsPage,
  totalLogsPages,
  isLoadingLogs,
  blockTimeSlot,
  unblockTimeSlot,
  removeClientReservation,
}) => {
  switch (view) {
    case 'schedules':
      return (
        <>
          <DateSelectionSection onChange={handleDateChange} selectedDate={selectedDate} />
          <SchedulesManagement 
            selectedDate={selectedDate}
            schedules={schedules}
            blockingService={blockingService}
            setBlockingService={setBlockingService}
            blockEntireDay={blockEntireDay}
            handleUserClick={handleUserClick}
            users={users}
            blockTimeSlot={blockTimeSlot}
            unblockTimeSlot={unblockTimeSlot}
            removeClientReservation={removeClientReservation}
          />
        </>
      );
    case 'users':
      return (
        <UsersManagement 
          users={users}
          handleUserClick={handleUserClick}
        />
      );
    case 'logs':
      return (
        <LogsManagement 
          fetchLogs={fetchLogs}
          logSummary={logSummary}
          logs={logs}
          logFilters={logFilters}
          setLogFilters={setLogFilters}
          handleFilterChange={handleFilterChange}
          applyLogFilters={applyLogFilters}
          resetLogFilters={resetLogFilters}
          clearOldLogs={clearOldLogs}
          logsPage={logsPage}
          totalLogsPages={totalLogsPages}
          isLoadingLogs={isLoadingLogs}
          handleUserClick={handleUserClick}
          users={users}
        />
      );
    default:
      return null;
  }
};

export default AdminViewSelector;