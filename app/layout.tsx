"use client"; 

import { SessionProvider } from "next-auth/react";
import { Inter } from "next/font/google";
import "./globals.css";
import BugReportButton from "@/components/BugReportButton"; 



const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <BugReportButton /> 
        </SessionProvider>
      </body>
    </html>
  );
}