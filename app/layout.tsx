"use client"; // Marque o layout como Client Component para o contexto funcionar

import { SessionProvider } from "next-auth/react"; // Importando SessionProvider
import { Inter } from "next/font/google";
import "./globals.css";
import BugReportButton from "@/components/BugReportButton"; // Importe o componente

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Envolva todo o conteúdo com o SessionProvider */}
        <SessionProvider>
          {children}
          <BugReportButton /> {/* Adicione o componente aqui */}
        </SessionProvider>
      </body>
    </html>
  );
}