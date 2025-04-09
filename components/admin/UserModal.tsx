import React, { useState } from "react"

import { TimeSlot, User, UserAppointment} from "@/models/types";
import { getTextColorByRole } from "@/lib/utils/user"

type UserModalProps = {
    setShowUserModal: React.Dispatch<React.SetStateAction<boolean>>;
    selectedUser: User;
    isLoadingUserData: boolean;
    userAppointments: UserAppointment[];
    toggleUserBan: (userId: string, currentBanStatus: boolean) => void;
    formatDateFull: (dateString: string) => string;
    changeUserRole: (userId: string, newRole: string) => void;
};

const UserModal: React.FC<UserModalProps> = ({
    setShowUserModal,
    selectedUser,
    isLoadingUserData,
    userAppointments,
    toggleUserBan,
    formatDateFull,
    changeUserRole
}) => {
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

    const handleRoleChange = (newRole: string) => {
        changeUserRole(selectedUser._id, newRole);
        setIsRoleDropdownOpen(false);
    };

    const displayRole = selectedUser.isAdmin ? "Admin" : selectedUser.accountRole || "Cliente";
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Detalhes do Usuário</h2>
                        <button 
                            onClick={() => setShowUserModal(false)}
                            className="text-gray-300 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-300 text-sm">Nome:</p>
                                <p className="font-medium text-white">{selectedUser.name}</p>
                            </div>
                            <div>
                                <p className="text-gray-300 text-sm">Email:</p>
                                <p className="font-medium text-white">{selectedUser.email}</p>
                            </div>
                            <div className="relative">
                                <p className="text-gray-300 text-sm">Tipo de conta:</p>
                                <div className="flex items-center">
                                    <p className={`font-medium ${selectedUser.isAdmin ? "text-purple-400" : `${getTextColorByRole(selectedUser.accountRole)}`} mr-2`}>
                                        {displayRole}
                                    </p>
                                    <button 
                                        onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                                        className="text-blue-400 hover:text-blue-300 text-sm"
                                    >
                                        (Alterar)
                                    </button>
                                </div>
                                {isRoleDropdownOpen && (
                                    <div className="absolute z-10 mt-1 w-48 bg-gray-800 rounded-md shadow-lg">
                                        <ul className="py-1">
                                            <li 
                                                onClick={() => handleRoleChange("Cliente")}
                                                className={`px-4 py-2 text-gray-200 hover:bg-gray-600 cursor-pointer ${getTextColorByRole("Cliente")} `}
                                            >
                                                Cliente
                                            </li>
                                            <li 
                                                onClick={() => handleRoleChange("Calouro")}
                                                className={`px-4 py-2 text-gray-200 hover:bg-gray-600 cursor-pointer ${getTextColorByRole("Calouro")} `}
                                            >
                                                Calouro
                                            </li>
                                            <li 
                                                onClick={() => handleRoleChange("Parceiro")}
                                                className={`px-4 py-2 text-gray-200 hover:bg-gray-600 cursor-pointer ${getTextColorByRole("Parceiro")} `}
                                            >
                                                Parceiro
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-gray-300 text-sm">Status:</p>
                                <p className={`font-medium ${selectedUser.isBanned ? "text-red-400" : "text-green-400"}`}>
                                    {selectedUser.isBanned ? "Bloqueado" : "Ativo"}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-300 text-sm">Strikes:</p>
                                <p className="font-medium text-red-400">
                                    {selectedUser.strikes || 0} de 5 strikes
                                </p>
                                <div 
                                    className="bg-red-500 h-2.5 rounded-full" 
                                    style={{ width: `${(Number(selectedUser.strikes || 0) / 5) * 100}%` }}
                                ></div>
                            </div>
                            <div>
                                <p className="text-gray-300 text-sm">Telefone:</p>
                                <a
                                    href={`https://wa.me/55${selectedUser.whatsappPhone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-blue-400 hover:underline"
                                >
                                {selectedUser.whatsappPhone} {selectedUser.whatsappVerified ? "(verificado)" : "(não verificado)"}
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    {/* Rest of the component remains the same */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2 text-white">Agendamentos</h3>
                        {isLoadingUserData ? (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400 mx-auto"></div>
                                <p className="mt-2 text-gray-300">Carregando agendamentos...</p>
                            </div>
                        ) : userAppointments.length === 0 ? (
                            <p className="text-gray-300 italic">Nenhum agendamento encontrado.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-700">
                                            <th className="py-2 px-4 text-left border border-gray-600 text-gray-200">Data</th>
                                            <th className="py-2 px-4 text-left border border-gray-600 text-gray-200">Horário</th>
                                            <th className="py-2 px-4 text-left border border-gray-600 text-gray-200">Serviço</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userAppointments.map((appointment, index) => (
                                            appointment.timeSlots.map((timeSlot: TimeSlot) => (
                                                <tr key={index} className="hover:bg-gray-600">
                                                    <td className="py-2 px-4 border border-gray-600 text-gray-200">{formatDateFull(appointment.date)}</td>
                                                    <td className="py-2 px-4 border border-gray-600 text-gray-200">{timeSlot.time}</td>
                                                    <td className="py-2 px-4 border border-gray-600 text-gray-200">{timeSlot.service || "Não especificado"}</td>
                                                </tr>
                                            ))
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-between">
                        <button
                            onClick={() => toggleUserBan(selectedUser._id, selectedUser.isBanned || false)}
                            className={`${selectedUser.isBanned ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white px-4 py-2 rounded`}
                        >
                            {selectedUser.isBanned ? "Desbloquear Usuário" : "Bloquear Usuário"}
                        </button>
                        <button
                            onClick={() => setShowUserModal(false)}
                            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserModal;