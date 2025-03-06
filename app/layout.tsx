// layout.tsx
"use client"; // Marque o layout como Client Component para o contexto funcionar

import { SessionProvider } from "next-auth/react"; // Importando SessionProvider
import { Inter } from "next/font/google";
import "./globals.css";

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
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
