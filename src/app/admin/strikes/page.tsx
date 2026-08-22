import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listarWorkersParaSuspensao } from "@/lib/penalidades";
import { STRIKES_MEDIA_LIMITE_SUSPENSAO, STRIKES_MEDIA_JANELA_MESES } from "@/lib/config";
import type { GravidadeStrike } from "@/generated/prisma/enums";

const GRAVIDADES_VALIDAS: readonly string[] = ["MEDIA", "GRAVE", "GRAVISSIMA"];

const GRAVIDADE_LABEL: Record<string, string> = {
  MEDIA: "Média",
  GRAVE: "Grave",
  GRAVISSIMA: "Gravíssima",
};

const GRAVIDADE_CLASSE: Record<string, string> = {
  MEDIA: "bg-amber-100 text-amber-700",
  GRAVE: "bg-orange-100 text-orange-700",
  GRAVISSIMA: "bg-red-100 text-red-700",
};

export default async function StrikesPage({
  searchParams,
}: {
  searchParams: Promise<{ workerId?: string; gravidade?: string; tipo?: string }>;
}) {
  await exigirUsuario("ADMIN");
  const { workerId, gravidade, tipo } = await searchParams;

  const [strikes, workers, workersParaSuspensao] = await Promise.all([
    prisma.strike.findMany({
      where: {
        ...(workerId ? { workerId } : {}),
        ...(tipo === "cliente" ? { clientProfileId: { not: null } } : {}),
        ...(tipo === "worker" ? { workerId: { not: null } } : {}),
        ...(gravidade && GRAVIDADES_VALIDAS.includes(gravidade)
          ? { gravidade: gravidade as GravidadeStrike }
          : {}),
      },
      include: {
        worker: { include: { user: true } },
        clientProfile: { include: { user: true } },
      },
      orderBy: { dataOcorrencia: "desc" },
    }),
    prisma.workerProfile.findMany({ include: { user: true }, orderBy: { user: { nome: "asc" } } }),
    listarWorkersParaSuspensao(),
  ]);

  const tituloTipo = tipo === "cliente" ? "Strikes de clientes" : tipo === "worker" ? "Strikes de workers" : "Strikes";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-stone-900">{tituloTipo}</h1>
        <Link
          href="/admin/strikes/novo"
          className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
        >
          + Registrar strike
        </Link>
      </div>

      {workersParaSuspensao.length > 0 && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          <p className="font-medium">
            {workersParaSuspensao.length} worker(s) com {STRIKES_MEDIA_LIMITE_SUSPENSAO}+ strikes
            médios nos últimos {STRIKES_MEDIA_JANELA_MESES} meses — revisão manual sugerida:
          </p>
          <ul className="mt-1 list-inside list-disc">
            {workersParaSuspensao.map((w) => (
              <li key={w.workerId}>
                {w.nome} ({w.count} strikes)
              </li>
            ))}
          </ul>
        </div>
      )}

      <form className="mt-4 flex flex-wrap gap-3 text-sm">
        {tipo && <input type="hidden" name="tipo" value={tipo} />}
        <select
          name="workerId"
          defaultValue={workerId ?? ""}
          className="rounded-md border border-stone-300 px-3 py-1.5"
        >
          <option value="">Todos os workers</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.user.nome}
            </option>
          ))}
        </select>
        <select
          name="gravidade"
          defaultValue={gravidade ?? ""}
          className="rounded-md border border-stone-300 px-3 py-1.5"
        >
          <option value="">Todas as gravidades</option>
          <option value="MEDIA">Média</option>
          <option value="GRAVE">Grave</option>
          <option value="GRAVISSIMA">Gravíssima</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-3 py-1.5 font-medium text-white hover:bg-stone-700"
        >
          Filtrar
        </button>
        <Link
          href={tipo ? `/admin/strikes?tipo=${tipo}` : "/admin/strikes"}
          className="self-center text-stone-500 underline"
        >
          Limpar
        </Link>
      </form>

      {strikes.length === 0 ? (
        <p className="mt-6 text-stone-600">Nenhum strike encontrado.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {strikes.map((strike) => (
            <li
              key={strike.id}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3"
            >
              <div>
                <p className="text-sm font-medium text-stone-900">
                  {strike.worker?.user.nome ?? strike.clientProfile?.user.nome ?? "—"}{" "}
                  <span className="font-normal text-stone-400">
                    ({strike.worker ? "worker" : "cliente"})
                  </span>
                </p>
                <p className="text-xs text-stone-500">
                  {strike.tipoInfracao} · {strike.dataOcorrencia.toLocaleDateString("pt-BR")}
                </p>
                {strike.observacao && (
                  <p className="mt-0.5 text-xs text-stone-400">{strike.observacao}</p>
                )}
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${GRAVIDADE_CLASSE[strike.gravidade]}`}
              >
                {GRAVIDADE_LABEL[strike.gravidade]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
