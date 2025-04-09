import React from 'react';
import { User } from "@/models/types";
import { getTextColorByRole } from "@/lib/utils/user"

type UsersManagementProps = {
  users: User[];
  handleUserClick: (user: User) => void;
  toggleUserBan?: (userId: string, currentBanStatus: boolean) => void;
};

const UsersManagement: React.FC<UsersManagementProps> = ({
  users,
  handleUserClick,
  toggleUserBan
}) => {
  const renderMobileCard = (user: User) => {
    // Determine background color based on user status
    const bgColorClass = user.isBanned ? 'bg-red-500/30' : 'bg-green-500/30';

    return (
      <div 
        key={user._id} 
        className={`rounded-lg mb-4 overflow-hidden ${bgColorClass}`}
        onClick={() => handleUserClick(user)}
      >
        <div className="p-4 flex justify-between items-center font-semibold text-gray-100">
          <div className="flex items-center space-x-2">
            <span>{user.name}</span>
            <span className={`text-sm ${user.isAdmin ? "text-purple-300" : `${getTextColorByRole(user.accountRole)}`}`}>
              {user.isAdmin ? "Admin" : user.accountRole || "Cliente"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow text-gray-200">
      <h2 className="text-xl font-semibold mb-4">Gerenciar Usuários</h2>
      
      {/* Mobile Layout */}
      <div className="block md:hidden">
        {users.length === 0 ? (
          <p className="text-gray-400 italic">Nenhum usuário encontrado.</p>
        ) : (
          users.map(renderMobileCard)
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-gray-700 border-gray-600">
          <thead>
            <tr className="bg-gray-800 border-b border-gray-600">
              <th className="py-2 px-4 text-left">Nome</th>
              <th className="py-2 px-4 text-left">Email</th>
              <th className="py-2 px-4 text-left">Tipo</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-t border-gray-600 hover:bg-gray-600">
                <td className="py-2 px-4">{user.name}</td>
                <td className="py-2 px-4">{user.email}</td>
                <td className="py-2 px-4">
                  <span className={`${user.isAdmin ? "text-purple-300" : `${getTextColorByRole(user.accountRole)}`}`}>
                    {user.isAdmin ? "Admin" : user.accountRole || "Cliente"}
                  </span>
                </td>
                <td className="py-2 px-4">
                  <span className={user.isBanned ? "text-red-400 font-medium" : "text-green-400 font-medium"}>
                    {user.isBanned ? "Bloqueado" : "Ativo"}
                  </span>
                </td>
                <td className="py-2 px-4">
                  <button
                    onClick={() => handleUserClick(user)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 mr-2"
                  >
                    Ver Detalhes
                  </button>
                  {toggleUserBan && (
                    <button
                      onClick={() => toggleUserBan(user._id, user.isBanned || false)}
                      className={`${user.isBanned ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white px-3 py-1 rounded text-sm`}
                    >
                      {user.isBanned ? "Desbloquear" : "Bloquear"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersManagement;