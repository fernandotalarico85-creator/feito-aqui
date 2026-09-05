import type { Metadata } from "next";
import { Bricolage_Grotesque, Work_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

// Sistema visual "Oficina" (Prompt 23) — Bricolage Grotesque (títulos, Seção 3.14) +
// Work Sans (corpo), agora o padrão de todo o app, não mais uma exceção pontual.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
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
      className={`${bricolage.variable} ${workSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
