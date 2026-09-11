import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { sairAction } from "./actions";
import UserMenu from "./UserMenu";

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await exigirUsuario("CLIENTE");

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/cliente/pedidos" className="text-lg font-semibold text-stone-900">
            Feito Aqui
          </Link>
          <UserMenu nome={usuario.nome} sairAction={sairAction} />
        </div>
      </header>
      <div className="relative mx-auto max-w-4xl px-6 py-8">
        {children}
        {/* FAB (Prompt 25, Seção 3.17) — círculo 56×56, sem sombra, ação principal
            do cliente ancorada no canto inferior direito do conteúdo. */}
        <Link
          href="/cliente/pedidos/novo"
          aria-label="Novo pedido"
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-semibold text-white hover:opacity-90"
        >
          +
        </Link>
      </div>
    </div>
  );
}
