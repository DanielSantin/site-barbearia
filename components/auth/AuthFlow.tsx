// components/auth/AuthFlow.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthCard from "./AuthCard";
import WhatsAppVerification from "./WhatsAppVerification";
import { useSession } from "next-auth/react";
import LoadingScreen from "@/components/LoadingScreen";

const AuthFlow = () => {
  const [step, setStep] = useState<"login" | "verification">("login");
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const needsVerification = searchParams.get("verification") === "true";

  // Detecta quando o usuário está autenticado e precisa de verificação
  useEffect(() => {
    if (status === "authenticated") {
      // Verifica se o usuário já confirmou o telefone anteriormente
      const hasVerifiedPhone = false; // Substitua por uma lógica real que verifica no perfil do usuário
      
      if (needsVerification || !hasVerifiedPhone) {
        setStep("verification");
      } else if (step === "login") {
        // Se já verificou antes, redireciona para a página principal
        router.push("/dashboard");
      }
    }
  }, [status, step, router, needsVerification]);

  const handleVerificationComplete = async () => {
    // Aqui você pode salvar o telefone verificado no perfil do usuário
    try {
      // Atualiza o perfil do usuário com o telefone verificado
      // await fetch('/api/users/update-phone', { 
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ verified: true }) 
      // });
      
      // Redireciona para a página principal
      router.push("/");
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    }
  };

  const handleCancel = () => {
    // Volta para o passo de login (pode ser útil implementar logout aqui)
    setStep("login");
  };

  // Se estiver carregando a sessão, mostra um indicador de carregamento
  if (status === "loading") {
    return <LoadingScreen message="Verificando Autenticação..." />;
  }

  // Renderiza o componente adequado com base no passo atual
  if (step === "verification" && status === "authenticated") {
    return (
      <WhatsAppVerification
        whatsappPhone={session?.user?.whatsappPhone || ""}
        onVerified={handleVerificationComplete}
      />
    );
  }

  return <AuthCard />;
};

export default AuthFlow;