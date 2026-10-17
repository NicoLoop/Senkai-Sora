import React, { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { TopProgressBar } from "@/components/TopProgressBar";

export const metadata: Metadata = {
  title: "Senkai Sora | Watch Anime & Cartoons in Multi-Audio",
  description: "Senkai Sora - Stream your favorite anime and cartoons in high definition with Multi-Audio Hindi, Tamil, Telugu and Japanese dubs.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0a0d" />
      </head>
      <body
        className="min-h-screen bg-[#0a0a0d] text-neutral-100 antialiased selection:bg-purple-600 selection:text-white"
        suppressHydrationWarning
      >
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
