"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import Button from "@/components/ui/button";

const LogoutButton = () => {
  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/login" });
  };

  return (
    <Button 
      onClick={handleLogout} 
      className="flex items-center gap-2 px-4 py-2 text-white bg-blue-500 hover:bg-blue-500 rounded-md"
    >
      <LogOut className="w-5 h-5" />
      Sair
    </Button>
  );
};

export default LogoutButton;
