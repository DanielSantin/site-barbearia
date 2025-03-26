"use client";

import WhatsAppVerification from "@/components/auth/WhatsAppVerification";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function WppPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        // Redireciona para login se não estiver autenticado
        if (status === "unauthenticated") {
            router.push("/auth/login");
            return;
        }

        // Redireciona para dashboard se já estiver verificado
        if (status === "authenticated" && session?.user?.whatsappVerified) {
            router.push("/dashboard");
        }
    }, [status, session, router]);

    const handleCancel = () => {
        // Volta para o passo de login
        router.push("/auth/login");
    };

    const handleVerificationComplete = async (verifiedPhone: string) => {
        try {
            // Atualiza a sessão para incluir o telefone verificado
                
            
            // Redireciona para o dashboard
            router.push("/dashboard");
        } catch (error) {
            console.error("Erro ao atualizar sessão:", error);
        }
    };

    // Mostra loader enquanto verifica o status da sessão
    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    return (    
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4">
            <WhatsAppVerification
                phone={session?.user?.phone || ""}
                onVerified={handleVerificationComplete}
                onCancel={handleCancel}
            />
        </div>
    );
}