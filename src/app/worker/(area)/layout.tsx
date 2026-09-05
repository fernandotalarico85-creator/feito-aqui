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
      <header className="bg-primary">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/worker" className="text-lg font-semibold text-white">
            Feito Aqui
          </Link>
          <UserMenu nome={usuario.nome} sairAction={sairWorkerAction} />
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
    </div>
  );
}
