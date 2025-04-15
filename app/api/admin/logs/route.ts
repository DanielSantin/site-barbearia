import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
import { 
  getAllLogs, 
  countLogs, 
  getLogsSummary, 
  deleteLogs,
  LogFilter 
} from "@/lib/services/logService";


const { ObjectId } = require("mongodb");
import clientPromise from "@/lib/utils/db";

// API para buscar logs de ações dos usuários (apenas para admins)
export async function GET(req: Request) {
  try {
    // Verificar se o usuário está autenticado e é admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const client = await clientPromise;
    const dbAuth = client.db("auth");

    // Verificar se é admin
    const acessUserId = session.user._id;
    const userCollection = dbAuth.collection("users");
    const user = await userCollection.findOne({ _id: new ObjectId(acessUserId) });
    
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Extrair parâmetros da requisição
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const importance = searchParams.get("importance");
    const actionType = searchParams.get("actionType");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    // Construir o filtro baseado nos parâmetros
    const filter: LogFilter = {};
    
    if (importance) {
      filter.importance = importance;
    }
    
    if (actionType) {
      filter.actionType = actionType;
    }
    
    if (userId) {
      filter.userId = userId;
    }
    
    if (startDate || endDate) {
      filter.timestamp = {};
      
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      
      if (endDate) {
        // Adiciona 1 dia ao endDate para incluir todo o dia
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        filter.timestamp.$lt = endDateObj;
      }
    }

    // Calcular skip baseado na página
    const skip = (page - 1) * limit;
    
    // Buscar logs com paginação usando a nova função do serviço local
    const logs = await getAllLogs(limit, skip, filter);
    
    // Contar total de registros para paginação
    const totalLogs = await countLogs(filter);
    
    // Buscar dados de resumo usando a nova função
    const summary = await getLogsSummary();
    
    return NextResponse.json({
      logs,
      summary,
      pagination: {
        total: totalLogs,
        totalPages: Math.ceil(totalLogs / limit),
        currentPage: page,
        limit
      }
    });
    
  } catch (error) {
    console.error("Erro na API GET admin/getLogs:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// API para limpar logs antigos ou por critérios (apenas para admins)
export async function DELETE(req: Request) {
  try {
    // Verificar se o usuário está autenticado e é admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const client = await clientPromise;
    const dbAuth = client.db("auth");

    // Verificar se é admin
    const userId = session.user._id;
    const userCollection = dbAuth.collection("users");
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    
    // Extrair parâmetros
    const { olderThan, importance, actionType } = await req.json();
    
    const filter: LogFilter = {};
    
    // Filtro por data - logs mais antigos que X dias
    if (olderThan && typeof olderThan === 'number') {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThan);
      filter.timestamp = { $lt: cutoffDate };
    }
    
    // Filtros adicionais opcionais
    if (importance) {
      filter.importance = importance;
    }
    
    if (actionType) {
      filter.actionType = actionType;
    }
    
    // Verificar se há algum filtro aplicado para evitar deleção acidental de todos os logs
    if (Object.keys(filter).length === 0) {
      return NextResponse.json({ 
        error: "É necessário fornecer pelo menos um critério de filtro para excluir logs" 
      }, { status: 400 });
    }
    
    // Executar a deleção usando a função do serviço local
    const deletedCount = await deleteLogs(filter);
    
    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount} logs foram excluídos com sucesso.`
    });
    
  } catch (error) {
    console.error("Erro na API DELETE admin/getLogs:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}