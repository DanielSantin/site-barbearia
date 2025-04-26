// app/api/resend-code/route.ts

import { NextResponse } from 'next/server';
import { whatsappVerificationService } from '@/lib/services/whatsappVerificationService';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/utils/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  const body = await request.json();
  const { phoneNumber } = body;

  if (!phoneNumber || phoneNumber.length < 10) {
    return NextResponse.json({ error: 'Número de telefone inválido' }, { status: 400 });
  }

  try {
    const existingCode = await whatsappVerificationService.getExistingCodeIfValid(phoneNumber);

    if (!existingCode) {
      return NextResponse.json({ error: 'Nenhum código válido encontrado para reenvio' }, { status: 404 });
    }

    const formattedPhone = `55${phoneNumber}`;
    const infobipApiKey = process.env.INFOBIP_API_KEY!;
    const infobipBaseUrl = process.env.INFOBIP_BASE_URL!;
    const infobipSender = process.env.INFOBIP_SENDER_ID!;

    const payload = {
      messages: [
        { 
          from: "InfoSMS",
          destinations: [{ to: formattedPhone }],
          text: `Barbearia Universitária Barba Azul. Seu código de verificação é: ${existingCode}.`
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
      return NextResponse.json({ error: 'Erro ao reenviar SMS via Infobip' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao reenviar código de verificação:', error);
    return NextResponse.json({ error: 'Falha ao reenviar código de verificação' }, { status: 500 });
  }
}
