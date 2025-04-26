import { NextResponse } from 'next/server';
import { whatsappVerificationService } from '@/lib/services/whatsappVerificationService';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/utils/auth";

// Controle de rate limit por userId
const rateLimitMap = new Map<string, number>();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { phoneNumber } = body;

  if (!phoneNumber || phoneNumber.length < 10) {
    return NextResponse.json({ error: 'Número de telefone inválido' }, { status: 400 });
  }

  // Verificação de tempo de espera
  const now = Date.now();
  const lastSent = rateLimitMap.get(userId);
  const waitTime = 30 * 1000;

  if (lastSent && now - lastSent < waitTime) {
    const secondsLeft = Math.ceil((waitTime - (now - lastSent)) / 1000);
    return NextResponse.json(
      { error: `Aguarde ${secondsLeft} segundos antes de tentar novamente.` },
      { status: 429 }
    );
  }

  try {
    const phoneDisponible = await whatsappVerificationService.isPhoneDisponible(phoneNumber);
    if (!phoneDisponible) {
      return NextResponse.json({ error: 'Falha ao enviar código de verificação, telefone já cadastrado.' }, { status: 500 });
    }

    const verificationCode = await whatsappVerificationService.createVerificationCode(
      phoneNumber,
      userId
    );

    const formattedPhone = `55${phoneNumber}`;

    const infobipApiKey = process.env.INFOBIP_API_KEY!;
    const infobipBaseUrl = process.env.INFOBIP_BASE_URL!;
    const infobipSender = process.env.INFOBIP_SENDER_ID!;

    const payload = {
      messages: [
        {
          destinations: [{ to: formattedPhone }],
          text: `Barbaria Universitária Barba Azul. Seu código de verificação é: ${verificationCode}`
        }
      ]
    };

    const response = await fetch(`${infobipBaseUrl}/sms/2/text/advanced`, {
      method: "POST",
      headers: {
        Authorization: `App ${infobipApiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorResponse = await response.text();
      console.error("Erro na resposta da Infobip (SMS):", errorResponse);
      return NextResponse.json({ error: 'Erro ao enviar SMS via Infobip' }, { status: 500 });
    }

    // Atualiza o tempo do último envio
    rateLimitMap.set(userId, Date.now());
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar código de verificação via SMS:', error);
    return NextResponse.json({ error: 'Falha ao enviar código de verificação' }, { status: 500 });
  }
}
