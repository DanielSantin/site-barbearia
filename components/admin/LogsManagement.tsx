import React, { useState } from 'react';
import { LogEntry, LogSummary } from "@/models/types";

type LogsManagementProps = {
  fetchLogs: (page?: number, filters?: any) => void;
  logSummary: LogSummary | null;
  logs: LogEntry[];
  logFilters: any;
  setLogFilters: (filters: any) => void;
  handleFilterChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  applyLogFilters: () => void;
  resetLogFilters: () => void;
  clearOldLogs: (days: number) => void;
  logsPage: number;
  totalLogsPages: number;
  isLoadingLogs: boolean;
  handleUserClick: (user: any) => void;
  users: any[];
};

const LogsManagement: React.FC<LogsManagementProps> = ({
  fetchLogs,
  logSummary,
  logs,
  logFilters,
  setLogFilters,
  handleFilterChange,
  applyLogFilters,
  resetLogFilters,
  clearOldLogs,
  logsPage,
  totalLogsPages,
  isLoadingLogs,
  handleUserClick,
  users
}) => {
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const getActionTypeClass = (actionType: string) => {
    switch(actionType) {
      case 'reservation': return 'bg-green-100/90 text-green-800';
      case 'cancellation': return 'bg-red-100/90 text-red-800';
      case 'login': return 'bg-blue-100/90 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionTypeColor = (actionType: string) => {
    switch(actionType) {
      case 'reservation': return 'border-l-4 border-green-500';
      case 'cancellation': return 'border-l-4 border-red-500';
      case 'login': return 'border-l-4 border-blue-500';
      case 'register': return 'border-l-4 border-purple-500';
      default: return 'border-l-4 border-gray-500';
    }
  };

  const renderMobileLogCard = (log: LogEntry) => {
    const isExpanded = expandedLog === log._id;
    
    const actionTypeLabel = {
      'reservation': 'Reserva',
      'cancellation': 'Cancelamento',
      'login': 'Login',
      'register': 'Registro'
    }[log.actionType] || log.actionType;

    return (
      <div 
        key={log._id} 
        className={`rounded-lg mb-4 overflow-hidden ${
          log.importance === 'important' ? 'bg-yellow-500/30' : 'bg-gray-500/30'
        } ${getActionTypeColor(log.actionType)}`}
        onClick={() => setExpandedLog(isExpanded ? null : log._id)}
      >
        <div className="p-4 flex justify-between items-center font-semibold text-gray-100">
          <div className="flex items-center space-x-2">
            <span className="text-sm">
              {new Date(log.timestamp).toLocaleString('pt-BR').split(' ')[0]} {log.userName || '-'}
            </span>
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
          <div className={`p-4 space-y-4 ${
            log.importance === 'important' ? 'bg-yellow-400/20' : 'bg-gray-400/20'
          }`}>
            {/* Detailed Log Information */}
            <div className="space-y-3">
              <div className="bg-gray-700 rounded p-3">
                <span className="block text-xs text-gray-300 mb-1">Data/Hora:</span>
                <span className="text-gray-100 font-medium">
                  {new Date(log.timestamp).toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="bg-gray-700 rounded p-3">
                <span className="block text-xs text-gray-300 mb-1">Usuário:</span>
                <span className="text-gray-100 font-medium">
                  {log.userName ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const user = users.find(u => u._id === log.userId);
                        if (user) handleUserClick(user);
                      }}
                      className="text-blue-400 hover:underline"
                    >
                      {log.userName}
                    </button>
                  ) : '-'}
                </span>
              </div>
              
              <div className="bg-gray-700 rounded p-3">
                <span className="block text-xs text-gray-300 mb-1">Detalhes:</span>
                <span className="text-gray-100 font-medium break-words">
                  {log.additionalInfo || '-'}
                </span>
              </div>

              <div className="bg-gray-700 rounded p-3">
                <span className="block text-xs text-gray-300 mb-1">Tipo de Ação:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionTypeClass(log.actionType)}`}>
                  {actionTypeLabel}
                </span>
              </div>

              <div className="bg-gray-700 rounded p-3">
                <span className="block text-xs text-gray-300 mb-1">Importância:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium 
                  ${log.importance === 'important' ? 'bg-yellow-100/90 text-yellow-800' : 'bg-gray-100/90 text-gray-800'}`}>
                  {log.importance === 'important' ? 'Importante' : 'Normal'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Log Summary Section */}
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

      {/* Filters Section */}
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
        
        {/* Mobile Filters Dropdown */}
        <div className="block md:hidden mb-4">
          <button
            onClick={() => setExpandedFilters(!expandedFilters)}
            className="w-full bg-gray-700 text-gray-200 px-3 py-2 rounded flex justify-between items-center"
          >
            Filtros
            <svg 
              className={`w-5 h-5 transform transition-transform ${expandedFilters ? 'rotate-180' : ''}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {expandedFilters && (
            <div className="space-y-4 mt-4">
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
              <button
                onClick={applyLogFilters}
                className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
              >
                Aplicar Filtros
              </button>
            </div>
          )}
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
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

      {/* Logs Section */}
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
            {/* Mobile Log Cards */}
            <div className="block md:hidden">
              {logs.map(renderMobileLogCard)}
            </div>

            {/* Desktop Log Table */}
            <div className="hidden md:block overflow-x-auto">
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionTypeClass(log.actionType)}`}>
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
            
            {/* Pagination */}
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
  );
};

export default LogsManagement;