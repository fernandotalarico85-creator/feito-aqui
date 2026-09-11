import type { Metadata } from "next";
import { Barlow, Geist_Mono } from "next/font/google";
import "./globals.css";

// Sistema visual "Clínica Experts" (Prompt 25, Seção 3.17) — Barlow como fonte única
// (títulos e corpo), no lugar do par Bricolage Grotesque + Work Sans da "Oficina".
const barlow = Barlow({
  variable: "--font-barlow",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Feito Aqui — Protótipo",
  description: "Protótipo do marketplace de serviços Feito Aqui.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${barlow.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
