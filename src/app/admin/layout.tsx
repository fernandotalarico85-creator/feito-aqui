import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { sairAdminAction } from "./actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await exigirUsuario("ADMIN");

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="text-lg font-semibold text-stone-900">
            Feito Aqui — Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin/disputas" className="text-stone-600 hover:text-stone-900">
              Disputas
            </Link>
            <Link href="/admin/repasses" className="text-stone-600 hover:text-stone-900">
              Repasses
            </Link>
            <Link href="/admin/workers" className="text-stone-600 hover:text-stone-900">
              Workers
            </Link>
            <Link href="/admin/strikes" className="text-stone-600 hover:text-stone-900">
              Strikes
            </Link>
            <Link
              href="/admin/strikes/novo"
              className="rounded-md bg-stone-900 px-3 py-1.5 font-medium text-white hover:bg-stone-700"
            >
              + Registrar strike
            </Link>
            <span className="text-stone-400">|</span>
            <span className="text-stone-500">{usuario.nome}</span>
            <form action={sairAdminAction}>
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
