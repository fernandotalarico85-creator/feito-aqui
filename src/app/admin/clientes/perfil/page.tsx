import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { limparCpf } from "@/lib/cpf";

/**
 * Diretório de clientes cadastrados (Prompt 24 / Seção 3.16) — consulta pura, sem
 * nenhuma ação. Diferente de "Workers > Aprovar Perfil" (que decide aprovação), esta
 * tela e sua irmã em Workers > Perfil só existem pra listar/buscar/detalhar.
 */
export default async function AdminClientesPerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>;
}) {
  await exigirUsuario("ADMIN");
  const { busca } = await searchParams;
  const buscaTrim = (busca ?? "").trim();
  const buscaCpf = limparCpf(buscaTrim);

  const clientes = await prisma.clientProfile.findMany({
    where: buscaTrim
      ? {
          OR: [
            { user: { nome: { contains: buscaTrim, mode: "insensitive" } } },
            { user: { sobrenome: { contains: buscaTrim, mode: "insensitive" } } },
            ...(buscaCpf ? [{ user: { cpf: { contains: buscaCpf } } }] : []),
          ],
        }
      : undefined,
    include: {
      user: true,
      _count: { select: { serviceRequests: true, strikes: true } },
    },
    orderBy: { user: { nome: "asc" } },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Clientes cadastrados</h1>

      <form className="mt-4 flex flex-wrap gap-2 text-sm">
        <input
          type="text"
          name="busca"
          defaultValue={busca ?? ""}
          placeholder="Buscar por nome ou CPF"
          className="w-full max-w-sm rounded-md border border-stone-300 px-3 py-1.5"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-1.5 font-medium text-white hover:bg-primary-dark"
        >
          Buscar
        </button>
        {busca && (
          <Link href="/admin/clientes/perfil" className="self-center text-stone-500 underline">
            Limpar
          </Link>
        )}
      </form>

      {clientes.length === 0 ? (
        <p className="mt-6 text-stone-600">Nenhum cliente encontrado.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {clientes.map((cliente) => (
            <li key={cliente.id}>
              <Link
                href={`/admin/clientes/perfil/${cliente.id}`}
                className="block rounded-lg border border-stone-200 bg-card p-3 shadow-sm hover:border-stone-400"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-stone-900">
                    {cliente.user.nome} {cliente.user.sobrenome}
                  </p>
                  <span className="font-mono text-xs text-stone-400">{cliente.user.idCadastro}</span>
                </div>
                <p className="text-xs text-stone-500">
                  CPF {cliente.user.cpf} · {cliente.user.email}
                </p>
                <p className="text-xs text-stone-500">
                  {cliente.enderecoCidade}/{cliente.enderecoEstado} · cadastrado em{" "}
                  {cliente.user.criadoEm.toLocaleDateString("pt-BR")}
                </p>
                <p className="text-xs text-stone-400">
                  {cliente._count.serviceRequests} pedido(s) · {cliente._count.strikes} strike(s)
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
