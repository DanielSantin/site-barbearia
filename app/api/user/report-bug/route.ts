// src/pages/api/report-bug.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { logUserAction } from "@/lib/services/logService";
import { authOptions } from "@/lib/utils/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// Limite por IP
const ipRequestTimestamps = new Map<string, number>();
const LIMIT_INTERVAL = 15 * 1000; // 15 segundos em ms

type RequestBody = {
  description: string;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();

    const lastRequestTime = ipRequestTimestamps.get(ip) || 0;
    if (now - lastRequestTime < LIMIT_INTERVAL) {
      const waitTime = Math.ceil((LIMIT_INTERVAL - (now - lastRequestTime)) / 1000);
      return NextResponse.json({ error: `Aguarde ${waitTime}s para tentar novamente.` }, { status: 429 });
    }

    ipRequestTimestamps.set(ip, now);

    const { description } = await req.json() as RequestBody;
    const session = await getServerSession(authOptions);
    const userId =  session?.user?._id || "";
    const userName = session?.user?.name || "";

    const logSuccess = await logUserAction({
      userId,
      userName,
      actionType: 'Report',
      service: 'bug-report',
      importance: 'important',
      additionalInfo: description,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toISOString().split('T')[1].substring(0, 8)
    });

    if (logSuccess) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Erro ao processar o envio" }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro ao processar report de bug:', error);
    return NextResponse.json({ error: "Erro ao processar o envio" }, { status: 400 });
  }
}
