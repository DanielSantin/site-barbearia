"use client";

import { useState, useEffect } from "react";
import { MdSms } from "react-icons/md";
import { signIn, signOut } from "next-auth/react"

interface WhatsAppVerificationProps {
  whatsappPhone?: string;
  onVerified: (verifiedPhone: string) => void;
}

const WhatsAppVerification = ({ whatsappPhone = "", onVerified }: WhatsAppVerificationProps) => {
  const [phoneNumber, setPhoneNumber] = useState(whatsappPhone);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const handleLogOut = async () => {
    await signOut({ redirect: false });
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhone(e.target.value));
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  const sendVerificationCode = async () => {
    setError("");
    setLoading(true);
    try {
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");
      const response = await fetch('/api/whatsapp/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: cleanPhoneNumber })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao enviar código');

      setCodeSent(true);
      setCountdown(60);
    } catch (error) {
      console.error("Erro ao enviar código:", error);
      setError(error instanceof Error ? error.message : "Não foi possível enviar o código de verificação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setError("");
    setVerifying(true);
    try {
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");
      const response = await fetch("/api/whatsapp/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: cleanPhoneNumber, code }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Código inválido");

      if (data.token) localStorage.setItem("jwt", data.token);

      onVerified(cleanPhoneNumber);
      handleLogOut();
      signIn("google");
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      setError(error instanceof Error ? error.message : "Código inválido ou expirado. Tente novamente.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gray-800 p-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="bg-blue-500/50 rounded-full border border-white p-4">
            <MdSms className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">Verificação por SMS</h1>
        <p className="text-blue-100 mt-1">Calvos Club • Barbearia Premium</p>
      </div>

      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {codeSent ? "Insira o código recebido" : "Confirme seu número"}
          </h2>
          <p className="text-gray-500 mt-1">
            {codeSent 
              ? "Enviamos um código de verificação via SMS" 
              : "Enviaremos um código de verificação via SMS"}
          </p>
        </div>

        <div className="space-y-4">
          {!codeSent ? (
            <>
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Número de Celular
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>

              <button
                onClick={sendVerificationCode}
                disabled={loading || phoneNumber.replace(/\D/g, "").length < 10}
                className="w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-70 shadow-md"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <MdSms className="w-5 h-5 mr-2" />
                )}
                Enviar Código
              </button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Código de Verificação
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                  disabled={verifying}
                  maxLength={6}
                />
              </div>

              <button
                onClick={verifyCode}
                disabled={verifying || code.length !== 6}
                className="w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-70 shadow-md"
              >
                {verifying ? (
                  <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Verificar Código
              </button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-500">
                    Reenviar código em {countdown} segundos
                  </p>
                ) : (
                  <button
                    onClick={sendVerificationCode}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Reenviar código
                  </button>
                )}
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

            <button
              onClick={() => {
                if (codeSent) {
                  setCodeSent(false);
                  setCode(""); // opcional: limpa o código
                  setError(""); // opcional: limpa mensagens de erro
                } else {
                  handleLogOut();
                }
              }}
              className="w-full py-2 text-gray-600 hover:text-gray-800"
            >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppVerification;
