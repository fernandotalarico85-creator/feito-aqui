import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { montarListaOrganica, type WorkerParaRanking } from "@/lib/ranking";

export default async function ProfissionaisRecomendadosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ solicitado?: string }>;
}) {
  const usuario = await exigirUsuario("CLIENTE");
  const { id } = await params;
  const { solicitado } = await searchParams;

  const pedido = await prisma.serviceRequest.findFirst({
    where: { id, clientProfile: { userId: usuario.id } },
    include: { category: true, address: true, _count: { select: { budgets: true } } },
  });

  if (!pedido) notFound();

  const agora = new Date();

  const workersElegiveis = await prisma.workerProfile.findMany({
    where: {
      statusVerificacao: "VERIFICADO",
      elegivelParaTriagem: true,
      categorias: { some: { id: pedido.categoryId } },
    },
    include: { user: true },
  });

  const paraRanking: (WorkerParaRanking & {
    nome: string;
    destaquePago: boolean;
    destaquePagoValidoAte: Date | null;
  })[] = workersElegiveis.map((w) => ({
    id: w.id,
    nome: w.user.nome,
    notaMediaRecente: w.notaMediaRecente,
    taxaConclusaoPrazo: w.taxaConclusaoPrazo,
    taxaComparecimento: w.taxaComparecimento,
    tempoMedioRespostaMin: w.tempoMedioRespostaMin,
    volumeConcluidos: w.volumeConcluidos,
    regiaoAtendimento: w.regiaoAtendimento,
    destaquePago: w.destaquePago,
    destaquePagoValidoAte: w.destaquePagoValidoAte,
  }));

  const patrocinados = paraRanking.filter(
    (w) => w.destaquePago && w.destaquePagoValidoAte && w.destaquePagoValidoAte >= agora,
  );

  const listaOrganica = montarListaOrganica(paraRanking, pedido.address.cidade);

  return (
    <div>
      <Link
        href="/cliente/pedidos"
        className="text-sm text-stone-500 hover:underline"
      >
        ← Meus pedidos
      </Link>

      <h1 className="mt-2 text-xl font-semibold text-stone-900">
        Profissionais recomendados
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Para o pedido de <strong>{pedido.category.nome}</strong> em{" "}
        {pedido.address.bairro}, {pedido.address.cidade}.
      </p>
      <p className="font-mono text-xs text-stone-400">{pedido.numeroOS}</p>

      {solicitado && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Orçamento solicitado! O profissional vai analisar seu pedido e responder em breve.
        </p>
      )}

      {pedido._count.budgets > 0 && (
        <Link
          href={`/cliente/pedidos/${pedido.id}/orcamentos`}
          className="mt-4 block rounded-md bg-sky-50 px-3 py-2 text-sm text-sky-700 hover:bg-sky-100"
        >
          Você já recebeu {pedido._count.budgets} orçamento(s) para este pedido → ver e aceitar
        </Link>
      )}

      {patrocinados.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-600">
            Patrocinado
          </h2>
          <ul className="mt-2 flex flex-col gap-3">
            {patrocinados.map((w) => (
              <WorkerCard key={w.id} worker={w} pedidoId={pedido.id} destaque />
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Resultados ({listaOrganica.length})
        </h2>

        {listaOrganica.length === 0 ? (
          <p className="mt-3 text-stone-600">
            Nenhum profissional verificado disponível para essa categoria ainda.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-3">
            {listaOrganica.map(({ worker, coldStart }) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                pedidoId={pedido.id}
                coldStart={coldStart}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function WorkerCard({
  worker,
  pedidoId,
  destaque,
  coldStart,
}: {
  worker: WorkerParaRanking & { nome: string };
  pedidoId: string;
  destaque?: boolean;
  coldStart?: boolean;
}) {
  return (
    <li>
      <Link
        href={`/cliente/workers/${worker.id}?pedido=${pedidoId}`}
        className={`block rounded-lg border bg-white p-4 hover:border-stone-400 ${
          destaque ? "border-amber-300" : "border-stone-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-stone-900">{worker.nome}</span>
          <div className="flex items-center gap-2">
            {coldStart && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                Novo na plataforma
              </span>
            )}
            <span className="flex items-center gap-1 text-sm text-stone-600">
              ★ {worker.notaMediaRecente > 0 ? worker.notaMediaRecente.toFixed(1) : "—"}
            </span>
          </div>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          {worker.regiaoAtendimento} · {worker.volumeConcluidos} serviços concluídos
        </p>
      </Link>
    </li>
  );
}
