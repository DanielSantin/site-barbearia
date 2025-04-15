import fs from 'fs';
import path from 'path';

/**
 * Tipos de ação que podem ser registradas nos logs
 */
export type ActionType = 'reservation' | 'cancellation' | 'login' | 'logout' | 'profile_update' | "Report";

/**
 * Nível de importância do log
 */
export type ImportanceLevel = 'normal' | 'important' | 'critical';

/**
 * Interface para os parâmetros da função de log
 */
export interface LogParams {
  userId: string;
  userName: string;
  actionType: ActionType;
  date?: string;
  time?: string;
  service?: string;
  importance?: ImportanceLevel;
  additionalInfo?: string;
}

/**
 * Interface para os filtros de busca de logs
 */
export interface LogFilter {
  userId?: string;
  actionType?: string;
  importance?: string;
  timestamp?: {
    $gte?: Date;
    $lt?: Date;
  };
  [key: string]: any;
}

// Configuração do diretório de logs
const LOG_DIR = path.join(process.cwd(), 'logs');

// Garantir que o diretório de logs existe
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Formata o nome do arquivo de log baseado na data atual
 * @returns Nome do arquivo formatado (YYYY-MM-DD.log)
 */
function getLogFileName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}.log`;
}

/**
 * Registra uma ação do usuário no sistema de logs local
 * 
 * @param params Parâmetros do log a ser registrado
 * @returns Promise<boolean> Indica sucesso ou falha na operação
 */
export async function logUserAction(params: LogParams): Promise<boolean> {
  try {
    const {
      userId,
      userName,
      actionType,
      date,
      time,
      service,
      importance = 'normal',
      additionalInfo
    } = params;
    
    const logEntry = {
      userId,
      userName,
      actionType,
      date,
      time,
      service,
      importance,
      additionalInfo,
      timestamp: new Date()
    };
    
    const logFileName = getLogFileName();
    const logFilePath = path.join(LOG_DIR, logFileName);
    
    // Adicionar entrada de log ao arquivo
    fs.appendFileSync(
      logFilePath, 
      JSON.stringify(logEntry) + '\n',
      { encoding: 'utf8' }
    );
    
    return true;
  } catch (error) {
    console.error("Erro ao registrar log:", error);
    return false;
  }
}

/**
 * Lê os logs de um arquivo específico
 * @param filePath Caminho do arquivo
 * @returns Array de entradas de log
 */
function readLogsFromFile(filePath: string): any[] {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    return lines.map(line => JSON.parse(line));
  } catch (error) {
    console.error(`Erro ao ler arquivo de log ${filePath}:`, error);
    return [];
  }
}

/**
 * Lista todos os arquivos de log disponíveis
 * @returns Array com os caminhos dos arquivos
 */
function getAllLogFiles(): string[] {
  return fs.readdirSync(LOG_DIR)
    .filter(file => file.endsWith('.log'))
    .map(file => path.join(LOG_DIR, file));
}

/**
 * Obtém os logs de um usuário específico
 * 
 * @param userId ID do usuário
 * @param limit Número máximo de logs a retornar (opcional, padrão 50)
 * @param skip Número de logs a pular (opcional, padrão 0)
 * @returns Array com os logs do usuário, ordenados do mais recente para o mais antigo
 */
export async function getUserLogs(userId: string, limit: number = 50, skip: number = 0) {
  try {
    const logFiles = getAllLogFiles();
    let allLogs: any[] = [];
    
    // Ler logs de todos os arquivos
    for (const file of logFiles) {
      const logs = readLogsFromFile(file);
      allLogs = [...allLogs, ...logs];
    }
    
    // Filtrar por userId
    const userLogs = allLogs.filter(log => log.userId === userId);
    
    // Ordenar por timestamp (mais recente primeiro)
    userLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Aplicar skip e limit
    return userLogs.slice(skip, skip + limit);
  } catch (error) {
    console.error("Erro ao buscar logs do usuário:", error);
    return [];
  }
}

/**
 * Obtém todos os logs do sistema
 * 
 * @param limit Número máximo de logs a retornar (opcional, padrão 100)
 * @param skip Número de logs a pular (opcional, padrão 0)
 * @param filter Filtros adicionais (opcional)
 * @returns Array com os logs, ordenados do mais recente para o mais antigo
 */
export async function getAllLogs(limit: number = 100, skip: number = 0, filter: LogFilter = {}) {
  try {
    const logFiles = getAllLogFiles();
    let allLogs: any[] = [];
    
    // Ler logs de todos os arquivos
    for (const file of logFiles) {
      const logs = readLogsFromFile(file);
      allLogs = [...allLogs, ...logs];
    }
    
    // Aplicar filtros se existirem
    if (Object.keys(filter).length > 0) {
      allLogs = allLogs.filter(log => {
        return Object.entries(filter).every(([key, value]) => {
          if (key === 'timestamp') {
            const logDate = new Date(log.timestamp);
            if (value.$gte && logDate < value.$gte) return false;
            if (value.$lt && logDate >= value.$lt) return false;
            return true;
          }
          return log[key] === value;
        });
      });
    }
    
    // Ordenar por timestamp (mais recente primeiro)
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Aplicar skip e limit
    return allLogs.slice(skip, skip + limit);
  } catch (error) {
    console.error("Erro ao buscar todos os logs:", error);
    return [];
  }
}

/**
 * Obtém a contagem total de logs com base em um filtro
 * 
 * @param filter Filtros a serem aplicados
 * @returns Número total de logs que correspondem ao filtro
 */
export async function countLogs(filter: LogFilter = {}): Promise<number> {
  try {
    const logFiles = getAllLogFiles();
    let count = 0;
    
    for (const file of logFiles) {
      const logs = readLogsFromFile(file);
      
      // Aplicar filtros
      const filteredLogs = logs.filter(log => {
        return Object.entries(filter).every(([key, value]) => {
          if (key === 'timestamp') {
            const logDate = new Date(log.timestamp);
            if (value.$gte && logDate < value.$gte) return false;
            if (value.$lt && logDate >= value.$lt) return false;
            return true;
          }
          return log[key] === value;
        });
      });
      
      count += filteredLogs.length;
    }
    
    return count;
  } catch (error) {
    console.error("Erro ao contar logs:", error);
    return 0;
  }
}

/**
 * Busca logs por tipo de ação
 * 
 * @param actionType Tipo de ação a filtrar
 * @param startDate Data inicial (opcional)
 * @param endDate Data final (opcional)
 * @param limit Número máximo de logs (opcional, padrão 100)
 * @returns Array com os logs filtrados
 */
export async function getLogsByActionType(
  actionType: ActionType, 
  startDate?: Date, 
  endDate?: Date, 
  limit: number = 100
) {
  try {
    const filter: LogFilter = { actionType };
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = startDate;
      if (endDate) filter.timestamp.$lt = endDate;
    }
    
    return await getAllLogs(limit, 0, filter);
  } catch (error) {
    console.error(`Erro ao buscar logs por tipo de ação (${actionType}):`, error);
    return [];
  }
}

/**
 * Busca logs importantes (níveis 'important' ou 'critical')
 * 
 * @param days Número de dias para trás a considerar
 * @returns Array de logs importantes
 */
export async function getImportantLogs(days: number = 7) {
  try {
    // Calcular a data de corte
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filter: LogFilter = {
      importance: { $in: ['important', 'critical'] } as any,
      timestamp: { $gte: cutoffDate }
    };
    
    return await getAllLogs(1000, 0, filter);
  } catch (error) {
    console.error("Erro ao buscar logs importantes:", error);
    return [];
  }
}

/**
 * Exclui logs baseados em um filtro específico
 * 
 * @param filter Critérios para selecionar logs a serem excluídos
 * @returns Número de logs removidos
 */
export async function deleteLogs(filter: LogFilter): Promise<number> {
  try {
    if (Object.keys(filter).length === 0) {
      throw new Error("É necessário fornecer pelo menos um critério de filtro para excluir logs");
    }
    
    const logFiles = getAllLogFiles();
    let totalDeleted = 0;
    
    for (const filePath of logFiles) {
      const logs = readLogsFromFile(filePath);
      
      // Filtrar logs que NÃO correspondem ao critério de exclusão
      const remainingLogs = logs.filter(log => {
        return !Object.entries(filter).every(([key, value]) => {
          if (key === 'timestamp') {
            const logDate = new Date(log.timestamp);
            if (value.$gte && logDate < value.$gte) return false;
            if (value.$lt && logDate >= value.$lt) return false;
            return true;
          }
          
          // Para filtro de importância que usa $in
          if (key === 'importance' && value.$in) {
            return value.$in.includes(log.importance);
          }
          
          return log[key] === value;
        });
      });
      
      const deletedCount = logs.length - remainingLogs.length;
      totalDeleted += deletedCount;
      
      if (deletedCount > 0) {
        // Reescrever o arquivo apenas com os logs restantes
        if (remainingLogs.length > 0) {
          fs.writeFileSync(filePath, remainingLogs.map(log => JSON.stringify(log)).join('\n') + '\n');
        } else {
          // Se não houver logs restantes, excluir o arquivo
          fs.unlinkSync(filePath);
        }
      }
    }
    
    return totalDeleted;
  } catch (error) {
    console.error("Erro ao excluir logs:", error);
    throw error;
  }
}

/**
 * Limpa logs antigos do sistema (retenção de dados)
 * 
 * @param olderThanDays Dias para considerar um log como antigo (padrão 90 dias)
 * @returns Número de logs removidos
 */
export async function cleanupOldLogs(olderThanDays: number = 90): Promise<number> {
  try {
    // Calcular a data de corte
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const filter: LogFilter = {
      timestamp: { $lt: cutoffDate },
      importance: { $ne: 'critical' } as any
    };
    
    return await deleteLogs(filter);
  } catch (error) {
    console.error("Erro ao limpar logs antigos:", error);
    return 0;
  }
}

/**
 * Obtém estatísticas sobre os logs
 * 
 * @returns Objeto com estatísticas resumidas
 */
export async function getLogsSummary() {
  try {
    // Contar logs por tipo de ação e importância
    const totalLogs = await countLogs();
    const importantLogs = await countLogs({ importance: 'important' });
    const reservations = await countLogs({ actionType: 'reservation' });
    const cancellations = await countLogs({ actionType: 'cancellation' });
    const importantCancellations = await countLogs({ 
      actionType: 'cancellation', 
      importance: 'important' 
    });
    
    return {
      totalLogs,
      importantLogs,
      actionCounts: {
        reservations,
        cancellations
      },
      importantCancellations
    };
  } catch (error) {
    console.error("Erro ao obter resumo dos logs:", error);
    return {
      totalLogs: 0,
      importantLogs: 0,
      actionCounts: {
        reservations: 0,
        cancellations: 0
      },
      importantCancellations: 0
    };
  }
}