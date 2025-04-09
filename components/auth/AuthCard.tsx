// components/auth/AuthCard.tsx
import GoogleSignInButton from "./GoogleSignInButton";
import Image from 'next/image';
import Logo from "@/public/logo500x500.png"

const AuthCard = () => {
  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header com logo */}
      <div className="bg-gray-800 p-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="bg-white rounded-full">  {/* Fundo branco e borda arredondada */}
            <Image 
              src={Logo}
              alt="Calvos Club Logo" 
              width={200} 
              height={200} 
              className="rounded-full"
            />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">B.U.B.A</h1>
        <p className="text-white text-1xl">Local de Respeito</p>
        <p className="text-white mt-1">Barbearia Quase Premium</p>
      </div>
      
      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Bem-vindo</h2>
          <p className="text-gray-500 mt-1">Acesse sua conta para agendar serviços</p>
        </div>
        
        <div className="space-y-4">
          <GoogleSignInButton />
          
          <div className="flex items-center justify-center mt-6">
          <span className="text-sm text-gray-500">
            Ao entrar, você concorda com nossos termos 
            <span className="mr-1">e</span>
            <a href="/privacy-policy" className="underline text-blue-500">políticas de privacidade</a> 
          </span>

          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
      <a
        href="https://wa.me/5541996235364"
        target="_blank"
        rel="noopener noreferrer"
        className="text-center text-sm text-blue-800 block hover:underline"
      >
        Precisa de ajuda? Entre em contato conosco
      </a>

      </div>
    </div>
  );
};

export default AuthCard;