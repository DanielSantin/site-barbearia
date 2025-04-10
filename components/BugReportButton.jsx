import { useState } from 'react';
import { Bug, X, Send } from 'lucide-react';

export default function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulação de envio de relatório de bug
    setTimeout(() => {
      setSuccessMessage(true);
      setTimeout(() => {
        setIsOpen(false);
        setDescription('');
        setSuccessMessage(false);
      }, 2000);
    }, 500);
  };

  return (
    <>
      {/* Botão flutuante para reportar bug */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-2 right-2 flex items-center gap-2 px-3 py-2 text-white bg-blue-900/50 hover:bg-blue-800 rounded-full shadow-lg transition-all duration-200"
      >
        <Bug size={18} />
        <span className="text-sm font-medium">Reportar Bug</span>
      </button>

      {/* Overlay do modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          {/* Modal */}
          <div className="bg-gray-800 rounded-xl shadow-lg w-full max-w-md border border-gray-700 transition-all duration-200">
            {/* Cabeçalho */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Bug className="text-blue-400" size={20} />
                <h2 className="text-lg font-semibold text-gray-200">Reportar Bug</h2>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Conteúdo */}
            {!successMessage ? (
              <form onSubmit={handleSubmit} className="p-4">
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                    Descreva o problema encontrado:
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows={5}
                    placeholder="Explique o bug com o máximo de detalhes possível..."
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 mr-3 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-600 rounded-md transition-colors"
                  >
                    <Send size={16} />
                    Enviar
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-900 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-200 mb-2">Bug reportado com sucesso!</h3>
                <p className="text-gray-400">Obrigado por nos ajudar a melhorar o sistema.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}