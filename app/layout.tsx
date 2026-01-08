import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Market Delivery - Supermarket Delivery",
  description: "Your favorite market now with fast and practical delivery",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/logo-sao-jorge.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo-sao-jorge.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/logo-sao-jorge.png",
        type: "image/png",
      },
    ],
    apple: "/logo-sao-jorge.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`font-sans antialiased`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
