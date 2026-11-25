// app/layout.js
"use client";
import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";
import { CompareProvider } from "@/lib/CompareContext";
import PageTransition from "@/components/PageTransition";
import CompareBar from "@/components/CompareBar";
import "./globals.css";

const Chatbot = dynamic(() => import("@/components/Chatbot"), { ssr: false });

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>OM SPACE — Find a Place Where Your Story Begins</title>
        <meta
          name="description"
          content="OM SPACE is a premium real estate platform connecting buyers, renters, agencies and administrators across Vijayawada."
        />
        <meta name="theme-color" content="#123D32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider>
          <CompareProvider>
            <PageTransition>{children}</PageTransition>
            <Chatbot />
            <CompareBar />
          </CompareProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
