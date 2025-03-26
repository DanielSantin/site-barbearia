// components/auth/GoogleSignInButton.tsx
"use client";

import { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { signIn } from "@/lib/auth/actions";

const GoogleSignInButton = () => {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", {
        callbackUrl: `${window.location.origin}`,
      });
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className="w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-70 shadow-md"
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <FaGoogle className="w-5 h-5 mr-2" />
      )}
      Entrar com Google
    </button>
  );
};

export default GoogleSignInButton;