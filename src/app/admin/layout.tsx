import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { sairAdminAction } from "./actions";
import UserMenu from "./UserMenu";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await exigirUsuario("ADMIN");

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-primary">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="text-lg font-semibold text-white">
            Feito Aqui — Admin
          </Link>
          <UserMenu nome={usuario.nome} sairAction={sairAdminAction} />
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
    </div>
  );
}
