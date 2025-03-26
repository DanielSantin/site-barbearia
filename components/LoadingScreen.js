import React from 'react';

const LoadingScreen = ({ message = "Carregando..." }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-500 mb-4"></div>
      <p className="text-gray-400 text-lg">{message}</p>
    </div>
  );
};

export default LoadingScreen;