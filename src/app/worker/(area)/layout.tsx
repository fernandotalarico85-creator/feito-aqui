import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { sairWorkerAction } from "./actions";
import UserMenu from "./UserMenu";

export default async function WorkerAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await exigirUsuario("WORKER");

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/worker" className="text-lg font-semibold text-stone-900">
            Feito Aqui
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/worker/pedidos" className="text-stone-600 hover:text-stone-900">
              Pedidos recebidos
            </Link>
            <Link href="/worker/orcamentos" className="text-stone-600 hover:text-stone-900">
              Meus orçamentos
            </Link>
            <Link href="/worker/ganhos" className="text-stone-600 hover:text-stone-900">
              Meus ganhos
            </Link>
            <Link href="/worker/agenda" className="text-stone-600 hover:text-stone-900">
              Agenda
            </Link>
            <Link href="/worker/destaque" className="text-stone-600 hover:text-stone-900">
              Destaque
            </Link>
            <Link href="/worker/strikes" className="text-stone-600 hover:text-stone-900">
              Strikes
            </Link>
            <span className="text-stone-400">|</span>
            <UserMenu nome={usuario.nome} sairAction={sairWorkerAction} />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
    </div>
  );
}
