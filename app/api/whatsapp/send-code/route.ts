import { NextResponse } from 'next/server';
import { whatsappVerificationService } from '@/lib/services/whatsappVerificationService';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/utils/auth";

export async function POST(request: Request) {
  // Get user session (optional - if the user is logged in)
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  const body = await request.json();
  const { phoneNumber } = body;

  if (!phoneNumber || phoneNumber.length < 10) {
    return NextResponse.json({ error: 'Número de telefone inválido' }, { status: 400 });
  }

  try {
    // Generate and store verification code using the service
    const phoneDisponible = await whatsappVerificationService.isPhoneDisponible(phoneNumber)
    if (!phoneDisponible) {
      return NextResponse.json({ error: 'Falha ao enviar código de verificação, telefone já cadastrado.' }, { status: 500 });
    }

    const verificationCode = await whatsappVerificationService.createVerificationCode(
      phoneNumber,
      userId
    );
    
    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);

    // Format the phone number for international dialing (assuming Brazilian number)
    const formattedPhone = `+55${phoneNumber}`;
    const message = `Seu código de verificação do Calvos Club é: ${verificationCode}`
    
    //const response = await client.messages.create({to: '+5569999155652',from: '+15708026808', body: message}).then(message => console.log(message.sid));

    // Send the WhatsApp message with the verification code
    const response = await client.messages.create({
      from: 'whatsapp:+14155238886',  // Your Twilio WhatsApp number
      body: `Seu código de verificação do Calvos Club é: ${verificationCode}`,
      to: `whatsapp:${formattedPhone}`
    });

    console.log("WhatsApp message sent:", response.sid);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending WhatsApp verification:', error);
    return NextResponse.json({ error: 'Falha ao enviar código de verificação' }, { status: 500 });
  }
}