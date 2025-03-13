import React from 'react';

const LoadingScreen = ({ message = "Carregando..." }) => {
  return (
    <div className="py-12 flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
      <p className="text-gray-500">{message}</p>
    </div>
  );
};

export default LoadingScreen;