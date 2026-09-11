import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import StatusBadge from "@/components/ui/StatusBadge";
import FilterChip from "@/components/ui/FilterChip";

/**
 * Diretório de workers cadastrados (Prompt 24 / Seção 3.16) — visão analítica/
 * sintética, consulta pura. Diferente de "Aprovar Workers" (`/admin/workers`), que
 * continua sendo a fila de aprovação/rejeição de verificação e documento.
 */
export default async function AdminWorkersPerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; status?: string }>;
}) {
  await exigirUsuario("ADMIN");
  const { busca, status } = await searchParams;
  const buscaTrim = (busca ?? "").trim();

  const workers = await prisma.workerProfile.findMany({
    where: {
      ...(status === "verificado" ? { statusVerificacao: "VERIFICADO" as const } : {}),
      ...(status === "pendente" ? { statusVerificacao: "PENDENTE" as const } : {}),
      ...(buscaTrim
        ? {
            OR: [
              { user: { nome: { contains: buscaTrim, mode: "insensitive" as const } } },
              { user: { sobrenome: { contains: buscaTrim, mode: "insensitive" as const } } },
              { categorias: { some: { nome: { contains: buscaTrim, mode: "insensitive" as const } } } },
            ],
          }
        : {}),
    },
    include: { user: true, categorias: true, _count: { select: { strikes: true } } },
    orderBy: { user: { nome: "asc" } },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Workers cadastrados</h1>

      <div className="mt-4 flex gap-2">
        <FilterChip href="/admin/workers/perfil" selected={!status}>
          Todos
        </FilterChip>
        <FilterChip href="/admin/workers/perfil?status=verificado" selected={status === "verificado"}>
          Verificados
        </FilterChip>
        <FilterChip href="/admin/workers/perfil?status=pendente" selected={status === "pendente"}>
          Pendentes
        </FilterChip>
      </div>

      <form className="mt-3 flex flex-wrap gap-2 text-sm">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          type="text"
          name="busca"
          defaultValue={busca ?? ""}
          placeholder="Buscar por nome ou categoria"
          className="w-full max-w-sm rounded-md border border-stone-300 px-3 py-1.5"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-1.5 font-medium text-white hover:bg-primary-dark"
        >
          Buscar
        </button>
        {busca && (
          <Link
            href={status ? `/admin/workers/perfil?status=${status}` : "/admin/workers/perfil"}
            className="self-center text-stone-500 underline"
          >
            Limpar
          </Link>
        )}
      </form>

      {workers.length === 0 ? (
        <p className="mt-6 text-stone-600">Nenhum worker encontrado.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {workers.map((worker) => (
            <li key={worker.id}>
              <Link
                href={`/admin/workers/perfil/${worker.id}`}
                className="block rounded-lg border border-stone-200 bg-card p-3 shadow-sm hover:border-stone-400"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-stone-900">
                    {worker.user.nome} {worker.user.sobrenome}
                  </p>
                  <StatusBadge
                    label={worker.statusVerificacao === "VERIFICADO" ? "Verificado" : "Pendente"}
                    tone={worker.statusVerificacao === "VERIFICADO" ? "success" : "alert"}
                  />
                </div>
                <p className="font-mono text-xs text-stone-400">{worker.user.idCadastro}</p>
                <p className="text-xs text-stone-500">
                  {worker.categorias.map((c) => c.nome).join(", ") || "sem categoria"}
                </p>
                <p className="text-xs text-stone-500">
                  Nota {worker.notaMediaRecente > 0 ? worker.notaMediaRecente.toFixed(1) : "—"} ·{" "}
                  {worker.volumeConcluidos} concluídos · {(worker.taxaConclusaoPrazo * 100).toFixed(0)}% no
                  prazo · {(worker.taxaComparecimento * 100).toFixed(0)}% comparecimento
                </p>
                <p className="text-xs text-stone-400">
                  Resposta em ~{worker.tempoMedioRespostaMin}min · {worker._count.strikes} strike(s)
                  {worker.destaquePago && " · Destaque ativo"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
