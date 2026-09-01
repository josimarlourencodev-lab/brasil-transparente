import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Brasil Transparente",
  description:
    "Portal autônomo, neutro e independente de monitoramento de notícias e histórico de políticos atuais do Brasil.",
  manifest: "/manifest.webmanifest",
  applicationName: "Brasil Transparente",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Brasil Transparente",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F4C81",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}