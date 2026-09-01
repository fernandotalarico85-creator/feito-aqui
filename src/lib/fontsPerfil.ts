import { Manrope, Inter } from "next/font/google";

/**
 * Fontes exclusivas da tela "Meu Perfil" (Prompt 20) — exceção pontual à identidade
 * visual padrão do protótipo (Geist, definida em src/app/layout.tsx). Usadas só dentro
 * de PerfilCard.tsx e das páginas /cliente/perfil e /worker/perfil — não propagar para
 * o resto do app.
 */
export const manropePerfil = Manrope({ subsets: ["latin"], weight: ["700", "800"] });
export const interPerfil = Inter({ subsets: ["latin"] });
