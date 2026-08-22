import { exigirUsuario } from "@/lib/auth";
import EmConstrucao from "@/components/EmConstrucao";

export default async function AdminWorkersPortfolioPage() {
  await exigirUsuario("ADMIN");
  return <EmConstrucao titulo="Portfólio dos workers" />;
}
