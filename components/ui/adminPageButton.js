"use client";

import Button from "@/components/ui/button";
import { useRouter } from "next/navigation";

const AdminPageButton = () => {
  const router = useRouter();

  const handleRedirect = async () => {
    router.push("/admin"); // Redireciona para /admin
  };

  return (
    <Button 
      onClick={handleRedirect} 
      className="flex items-center gap-2 px-4 py-2 text-white bg-blue-500 hover:bg-blue-500 rounded-md"
    >
      Admin
    </Button>
  );
};

export default AdminPageButton;
