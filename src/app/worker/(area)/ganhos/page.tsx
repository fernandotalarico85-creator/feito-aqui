import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { liberarRepassesVencidos } from "@/lib/repasses";
import { confirmarConclusoesVencidas } from "@/lib/confirmacaoConclusao";
import { CONFIRMACAO_CONCLUSAO_PRAZO_HORAS } from "@/lib/config";

const TIPO_LABEL: Record<string, string> = {
  ACEITE: "Aceite do orçamento",
  PONTUALIDADE: "Pontualidade no check-in",
  CONCLUSAO: "Conclusão do serviço",
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Justificativa em análise",
  CARENCIA: "Liberação agendada",
  LIBERADO: "Liberado",
};

const STATUS_CLASSE: Record<string, string> = {
  PENDENTE: "bg-stone-100 text-stone-600",
  EM_ANALISE: "bg-amber-100 text-amber-700",
  CARENCIA: "bg-sky-100 text-sky-700",
  LIBERADO: "bg-emerald-100 text-emerald-700",
};

/** Status especial pra parcela de conclusão enquanto ela ainda não foi liberada
 * (Seção 3.8) — só soma uma duração fixa a uma data já conhecida, não lê o relógio. */
function statusConclusaoOverride(
  statusConclusao: string | null,
  conclusaoMarcadaEm: Date | null,
): { label: string; classe: string } | null {
  if (statusConclusao === "AGUARDANDO_CONFIRMACAO_CLIENTE" && conclusaoMarcadaEm) {
    const prazo = new Date(
      conclusaoMarcadaEm.getTime() + CONFIRMACAO_CONCLUSAO_PRAZO_HORAS * 60 * 60 * 1000,
    );
    return {
      label: `Aguardando confirmação do cliente (auto em ${prazo.toLocaleDateString("pt-BR")})`,
      classe: "bg-amber-100 text-amber-700",
    };
  }
  if (statusConclusao === "CONTESTADO") {
    return { label: "Entrega contestada — em análise", classe: "bg-red-100 text-red-700" };
  }
  return null;
}

export default async function GanhosPage() {
  const usuario = await exigirUsuario("WORKER");
  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  await confirmarConclusoesVencidas();
  await liberarRepassesVencidos(worker.id);

  const repasses = await prisma.repasseWorker.findMany({
    where: { workerProfileId: worker.id },
    include: {
      booking: {
        include: { budget: { include: { serviceRequest: { include: { category: true } } } } },
      },
    },
    orderBy: { criadoEm: "desc" },
  });

  const totalLiberado = repasses
    .filter((r) => r.status === "LIBERADO")
    .reduce((soma, r) => soma + r.valor, 0);
  const totalPendente = repasses
    .filter((r) => r.status !== "LIBERADO")
    .reduce((soma, r) => soma + r.valor, 0);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-stone-900">Meus ganhos</h1>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-2xl font-semibold text-emerald-700">R$ {totalLiberado.toFixed(2)}</p>
          <p className="text-sm text-stone-500">liberado</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-2xl font-semibold text-amber-600">R$ {totalPendente.toFixed(2)}</p>
          <p className="text-sm text-stone-500">a receber (pendente/agendado)</p>
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-stone-900">Histórico</h2>

      {repasses.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">Nenhum repasse ainda.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {repasses.map((r) => {
            const override =
              r.tipo === "CONCLUSAO" && r.status !== "LIBERADO"
                ? statusConclusaoOverride(r.booking.statusConclusao, r.booking.conclusaoMarcadaEm)
                : null;

            return (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3"
            >
              <div>
                <Link
                  href={`/worker/bookings/${r.bookingId}`}
                  className="text-sm font-medium text-stone-900 hover:underline"
                >
                  {r.booking.budget.serviceRequest.category.nome} — {TIPO_LABEL[r.tipo]}
                </Link>
                <p className="text-xs text-stone-500">
                  R$ {r.valor.toFixed(2)} · {r.criadoEm.toLocaleDateString("pt-BR")}
                  {r.status === "CARENCIA" && r.liberadoEm && (
                    <> · libera em {r.liberadoEm.toLocaleDateString("pt-BR")}</>
                  )}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  override?.classe ?? STATUS_CLASSE[r.status]
                }`}
              >
                {override?.label ?? STATUS_LABEL[r.status]}
              </span>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
