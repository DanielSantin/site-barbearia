"use client";

import AuthCard from "@/components/auth/AuthCard";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
  
    useEffect(() => {
      // Redireciona para /dashboard se o usuário já estiver autenticado e com WhatsApp verificado
      if (status === "authenticated" && session?.user?.whatsappVerified) {
        router.push("/dashboard");
        return;
      }
  
      // Redireciona para /auth/verify se o usuário estiver autenticado mas sem WhatsApp verificado
      if (status === "authenticated" && !session?.user?.whatsappVerified) {
        router.push("/auth/verify");
        return;
      }
    }, [status, session, router]);
  
    // Mostra um loader enquanto verifica o status da sessão
    if (status === "loading") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-gray-900 to-black">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      );
    }
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-gray-900 to-black p-4">
            <AuthCard />
        </div>

    )
}