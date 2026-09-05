import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });

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
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${lora.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </ThemeProvider>
        <PwaRegister />
      </body>
    </html>
  );
}