import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/utils/auth";
import { whatsappVerificationService } from "@/lib/services/whatsappVerificationService";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const body = await req.json();
  const { phoneNumber, code } = body;

  if (!phoneNumber || !code) {
    return NextResponse.json(
      { error: "Número de telefone e código são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    const isValid = await whatsappVerificationService.verifyCode(phoneNumber, code);
    if (!isValid) {
      return NextResponse.json(
        { error: "Código de verificação inválido ou expirado" },
        { status: 401 }
      );
    }

    // Associa o telefone ao usuário
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