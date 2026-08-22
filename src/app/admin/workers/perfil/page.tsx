import { exigirUsuario } from "@/lib/auth";
import EmConstrucao from "@/components/EmConstrucao";

export default async function AdminWorkersPerfilPage() {
  await exigirUsuario("ADMIN");
  return <EmConstrucao titulo="Perfil de workers" />;
}
