"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from "@/components/LoadingScreen";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/auth/login');
  }, [router]);

  return <LoadingScreen message="Verificando sua sessão..." />;
}
