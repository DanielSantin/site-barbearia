// Button.js (componente Button)
import React from 'react';

const Button = ({ onClick, children, className = "", disabled = false }) => {
  return (
    <button
      onClick={onClick}
      className={`bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button; // Exportação padrão
