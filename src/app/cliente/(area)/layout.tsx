import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { sairAction } from "./actions";

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
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/cliente/pedidos" className="text-stone-600 hover:text-stone-900">
              Meus pedidos
            </Link>
            <Link href="/cliente/carteira" className="text-stone-600 hover:text-stone-900">
              Minha carteira
            </Link>
            <Link href="/cliente/perfil" className="text-stone-600 hover:text-stone-900">
              Meu perfil
            </Link>
            <Link
              href="/cliente/pedidos/novo"
              className="rounded-md bg-stone-900 px-3 py-1.5 font-medium text-white hover:bg-stone-700"
            >
              + Novo pedido
            </Link>
            <span className="text-stone-400">|</span>
            <span className="text-stone-500">{usuario.nome}</span>
            <form action={sairAction}>
              <button type="submit" className="text-stone-500 underline hover:text-stone-900">
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
    </div>
  );
}
