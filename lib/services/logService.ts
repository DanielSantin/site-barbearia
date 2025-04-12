// src/lib/services/logService.ts

import clientPromise from "../utils/db";
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
 * Registra uma ação do usuário no sistema de logs
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
    
    const client = await clientPromise;
    const db = client.db();
    const logsCollection = db.collection("userActionLogs");
    
    await logsCollection.insertOne({
      userId,
      userName,
      actionType,
      date,
      time,
      service,
      importance,
      additionalInfo,
      timestamp: new Date()
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao registrar log:", error);
    return false;
  }
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
    const client = await clientPromise;
    const db = client.db();
    const logsCollection = db.collection("userActionLogs");
    
    const logs = await logsCollection
      .find({ userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return logs;
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
export async function getAllLogs(limit: number = 100, skip: number = 0, filter: Record<string, any> = {}) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const logsCollection = db.collection("userActionLogs");
    
    const logs = await logsCollection
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return logs;
  } catch (error) {
    console.error("Erro ao buscar todos os logs:", error);
    return [];
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
    const client = await clientPromise;
    const db = client.db();
    const logsCollection = db.collection("userActionLogs");
    
    let filter: Record<string, any> = { actionType };
    
    // Adiciona filtro de data se ambas as datas forem fornecidas
    if (startDate && endDate) {
      filter.timestamp = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    const logs = await logsCollection
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    return logs;
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
    const client = await clientPromise;
    const db = client.db();
    const logsCollection = db.collection("userActionLogs");
    
    // Calcular a data de corte
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const logs = await logsCollection
      .find({
        importance: { $in: ['important', 'critical'] },
        timestamp: { $gte: cutoffDate }
      })
      .sort({ timestamp: -1 })
      .toArray();
    
    return logs;
  } catch (error) {
    console.error("Erro ao buscar logs importantes:", error);
    return [];
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
    const client = await clientPromise;
    const db = client.db();
    const logsCollection = db.collection("userActionLogs");
    
    // Calcular a data de corte
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    // Remover logs antigos, exceto os marcados como importantes
    const result = await logsCollection.deleteMany({
      timestamp: { $lt: cutoffDate },
      importance: { $ne: 'critical' } // Mantém logs críticos
    });
    
    return result.deletedCount || 0;
  } catch (error) {
    console.error("Erro ao limpar logs antigos:", error);
    return 0;
  }
}