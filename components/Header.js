import React from 'react';
import Image from 'next/image';

const Header = () => {
  return (
    <div className="text-center mb-6 flex flex-col items-center">
      <div className="relative w-28 h-28 mb-2 overflow-hidden bg-white rounded-full">
        <div className="bg-white rounded-full">  {/* Fundo branco e borda arredondada */}
          <Image
            src="/logo500x500.png" // Substitua pelo caminho correto da sua logo
            alt="Calvos Club Logo"
            fill
            className="object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
            priority
          />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-200">Barbearia Universitária Barba Azul</h1>
      <p className="text-gray-400 mt-1">Agende seu horário</p>
    </div>
  );
};

export default Header;