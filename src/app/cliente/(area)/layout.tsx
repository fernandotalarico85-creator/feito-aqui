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
      <header className="bg-primary">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/cliente/pedidos" className="text-lg font-semibold text-white">
            Feito Aqui
          </Link>
          <UserMenu nome={usuario.nome} sairAction={sairAction} />
        </div>
      </header>
      <div className="relative mx-auto max-w-4xl px-6 py-8">
        {children}
        {/* CTA flutuante (Prompt 23) — ação principal do cliente, ancorada no
            canto inferior direito do conteúdo. */}
        <Link
          href="/cliente/pedidos/novo"
          className="fixed bottom-6 right-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90"
        >
          + Novo pedido
        </Link>
      </div>
    </div>
  );
}
