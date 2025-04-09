import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/utils/auth";
import { whatsappVerificationService } from "@/lib/services/whatsappVerificationService";

// Limite de tentativas por userId
const attemptLimitMap = new Map<string, { count: number, firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 10 minutos

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = session.user._id;
  const body = await req.json();
  const { phoneNumber, code } = body;

  if (!phoneNumber || !code) {
    return NextResponse.json(
      { error: "Número de telefone e código são obrigatórios" },
      { status: 400 }
    );
  }

  // Verifica número de tentativas
  const now = Date.now();
  const attemptData = attemptLimitMap.get(userId);

  if (attemptData) {
    const timeSinceFirstAttempt = now - attemptData.firstAttempt;

    if (attemptData.count >= MAX_ATTEMPTS && timeSinceFirstAttempt < BLOCK_DURATION_MS) {
      const remaining = Math.ceil((BLOCK_DURATION_MS - timeSinceFirstAttempt) / 1000);
      return NextResponse.json({
        error: `Muitas tentativas. Tente novamente em ${remaining} segundos.`
      }, { status: 429 });
    }

    // Resetar se passou o tempo do bloqueio
    if (timeSinceFirstAttempt >= BLOCK_DURATION_MS) {
      attemptLimitMap.set(userId, { count: 1, firstAttempt: now });
    } else {
      attemptLimitMap.set(userId, { ...attemptData, count: attemptData.count + 1 });
    }
  } else {
    attemptLimitMap.set(userId, { count: 1, firstAttempt: now });
  }

  try {
    const isValid = await whatsappVerificationService.verifyCode(phoneNumber, code);
    if (!isValid) {
      return NextResponse.json(
        { error: "Código de verificação inválido ou expirado" },
        { status: 401 }
      );
    }

    // Código válido, limpa os dados de tentativa
    attemptLimitMap.delete(userId);

    await whatsappVerificationService.associatePhoneWithUser(userId, phoneNumber);

    return NextResponse.json({
      success: true,
      message: "Número de telefone verificado com sucesso",
      phone: phoneNumber
    });
  } catch (error) {
    console.error("Erro ao verificar código do WhatsApp:", error);
    return NextResponse.json({ error: "Falha ao verificar código" }, { status: 500 });
  }
}
