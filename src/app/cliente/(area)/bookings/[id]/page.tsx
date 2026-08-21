import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  TOKENS_POR_AVALIACAO,
  VALOR_REAIS_POR_AVALIACAO,
  TOLERANCIA_CHECKIN_MINUTOS,
  CONFIRMACAO_CONCLUSAO_PRAZO_HORAS,
} from "@/lib/config";
import { confirmarConclusoesVencidas } from "@/lib/confirmacaoConclusao";
import {
  avaliarAction,
  cancelarBookingClienteAction,
  reportarNoShowAction,
  confirmarConclusaoAction,
  contestarConclusaoAction,
  simularPassagemDeTempoConfirmacaoAction,
} from "./actions";

const STATUS_LABEL: Record<string, string> = {
  FECHADO: "Fechado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const CONTESTACAO_LABEL: Record<string, string> = {
  NENHUMA: "",
  EM_ANALISE: "Contestada pelo profissional — em análise",
  MANTIDA: "Contestação analisada — nota mantida",
  REVERTIDA: "Contestação aceita — nota revertida",
};

const MENSAGENS_ERRO: Record<string, string> = {
  nota_invalida: "Escolha uma nota de 1 a 5 estrelas.",
  cedo_demais: "Ainda dentro da janela de tolerância — aguarde um pouco antes de reportar.",
  texto_obrigatorio: "Escreva o motivo da contestação.",
};

const ETAPAS = ["FECHADO", "EM_ANDAMENTO", "CONCLUIDO"] as const;

// Fora do componente de propósito — lê o relógio (impuro).
function podeReportarNoShow(janelaDataInicio: Date): boolean {
  const prazo = new Date(janelaDataInicio.getTime() + TOLERANCIA_CHECKIN_MINUTOS * 60 * 1000);
  return Date.now() >= prazo.getTime();
}

export default async function AcompanhamentoBookingClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuario = await exigirUsuario("CLIENTE");
  const { id } = await params;
  const { erro } = await searchParams;

  await confirmarConclusoesVencidas();

  const booking = await prisma.booking.findFirst({
    where: { id, budget: { serviceRequest: { clientProfile: { userId: usuario.id } } } },
    include: {
      budget: {
        include: {
          serviceRequest: { include: { category: true, address: true } },
          worker: { include: { user: true } },
        },
      },
      review: true,
      servicePhotos: { orderBy: { criadoEm: "asc" } },
    },
  });

  if (!booking) notFound();

  const { budget, review, servicePhotos } = booking;
  const etapaAtual = ETAPAS.indexOf(booking.status as (typeof ETAPAS)[number]);
  const fotosReview: string[] = review?.fotosJson ? JSON.parse(review.fotosJson) : [];
  const fotosReplica: string[] = review?.replicaWorkerFotosJson
    ? JSON.parse(review.replicaWorkerFotosJson)
    : [];
  // Só soma uma duração fixa a uma data já conhecida — não lê o relógio, então não
  // viola a regra de pureza de render mesmo ficando dentro do componente.
  const prazoConfirmacao = booking.conclusaoMarcadaEm
    ? new Date(
        booking.conclusaoMarcadaEm.getTime() + CONFIRMACAO_CONCLUSAO_PRAZO_HORAS * 60 * 60 * 1000,
      )
    : null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/cliente/pedidos" className="text-sm text-stone-500 hover:underline">
        ← Meus pedidos
      </Link>

      <h1 className="mt-2 text-xl font-semibold text-stone-900">
        {budget.serviceRequest.category.nome}
      </h1>
      <p className="font-mono text-xs text-stone-400">
        {budget.serviceRequest.numeroOS} · {budget.numeroPO}
      </p>
      <p className="mt-1 text-sm text-stone-500">
        {budget.serviceRequest.address.logradouro}, {budget.serviceRequest.address.numero} —{" "}
        {budget.serviceRequest.address.bairro}, {budget.serviceRequest.address.cidade}
      </p>

      {etapaAtual >= 0 && (
        <ol className="mt-6 flex items-center gap-2 text-xs">
          {ETAPAS.map((etapa, i) => (
            <li key={etapa} className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 font-medium ${
                  i <= etapaAtual
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-400"
                }`}
              >
                {STATUS_LABEL[etapa]}
              </span>
              {i < ETAPAS.length - 1 && <span className="text-stone-300">→</span>}
            </li>
          ))}
        </ol>
      )}
      {booking.status === "CANCELADO" && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Cancelado por {booking.canceladoPor === "CLIENTE" ? "você" : "o profissional"} em{" "}
          {booking.canceladoEm?.toLocaleDateString("pt-BR")}
          {booking.motivoCancelamento && <> — {booking.motivoCancelamento}</>}
          {booking.pagamentoStatus === "reembolsado" && (
            <> · valor reembolsado na sua carteira.</>
          )}
        </p>
      )}

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">Andamento</h2>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm text-stone-700">
          <li>
            Pedido fechado às{" "}
            {booking.criadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </li>
          {booking.checkInHorario ? (
            <li>
              Profissional chegou às{" "}
              {booking.checkInHorario.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {booking.checkInAtrasado && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  fora do horário combinado
                </span>
              )}
              {booking.checkInDentroGeofence === false && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  chegada fora da área esperada — em revisão
                </span>
              )}
            </li>
          ) : (
            <li className="text-stone-400">Aguardando o profissional chegar</li>
          )}
          {booking.checkOutHorario && (
            <li>
              Concluído às{" "}
              {booking.checkOutHorario.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </li>
          )}
        </ul>
      </section>

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">Pagamento</h2>
        <dl className="mt-2 grid grid-cols-2 gap-y-1.5 text-sm">
          <dt className="font-medium text-stone-700">Valor do serviço</dt>
          <dd className="text-right font-medium text-stone-900">
            R$ {booking.valorTotal.toFixed(2)}
          </dd>
        </dl>
        <p className="mt-3 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          Pagamento {booking.pagamentoStatus.replace("_", " ")}
        </p>
      </section>

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">Profissional</h2>
        <p className="mt-2 text-sm text-stone-700">{budget.worker.user.nome}</p>
        <p className="text-sm text-stone-500">{budget.worker.user.email}</p>
        <p className="mt-1 text-xs text-stone-400">
          Prazo de entrega combinado: {budget.prazoEntrega.toLocaleDateString("pt-BR")}
        </p>
      </section>

      {(booking.status === "FECHADO" || booking.status === "EM_ANDAMENTO") && (
        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-stone-900">Cancelar serviço</h2>

          {erro && (
            <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {MENSAGENS_ERRO[erro] ?? "Não foi possível concluir a ação."}
            </p>
          )}

          {booking.status === "FECHADO" &&
            !booking.checkInHorario &&
            podeReportarNoShow(budget.serviceRequest.janelaDataInicio) && (
              <form action={reportarNoShowAction} className="mt-2">
                <input type="hidden" name="bookingId" value={booking.id} />
                <p className="text-xs text-stone-500">
                  O profissional não apareceu dentro da janela de tolerância?
                </p>
                <button
                  type="submit"
                  className="mt-1.5 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Reportar no-show (reembolso automático)
                </button>
              </form>
            )}

          <form action={cancelarBookingClienteAction} className="mt-4 flex flex-col gap-2">
            <input type="hidden" name="bookingId" value={booking.id} />
            <textarea
              name="motivo"
              rows={2}
              placeholder="Motivo (opcional)"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="self-start rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              Cancelar pedido
            </button>
          </form>
        </section>
      )}

      {booking.status === "CONCLUIDO" && booking.statusConclusao === "AGUARDANDO_CONFIRMACAO_CLIENTE" && (
        <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-stone-900">Confirmar conclusão do serviço</h2>
          <p className="mt-1 text-sm text-stone-700">
            O profissional marcou o serviço como concluído e enviou {servicePhotos.length} foto
            {servicePhotos.length === 1 ? "" : "s"} do resultado. Confira e confirme a entrega
            para liberar o pagamento final dele — ou conteste se não foi entregue como combinado.
          </p>

          {erro && (
            <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {MENSAGENS_ERRO[erro] ?? "Não foi possível concluir a ação."}
            </p>
          )}

          {servicePhotos.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {servicePhotos.map((foto) => (
                <div key={foto.id} className="relative aspect-square overflow-hidden rounded-md">
                  <Image src={foto.url} alt="Foto do resultado" fill unoptimized className="object-cover" />
                </div>
              ))}
            </div>
          )}

          {prazoConfirmacao && (
            <p className="mt-3 text-xs text-stone-500">
              Se você não confirmar nem contestar até {prazoConfirmacao.toLocaleDateString("pt-BR")}{" "}
              às {prazoConfirmacao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              , a entrega é confirmada automaticamente e o pagamento final é liberado.
            </p>
          )}

          <form action={confirmarConclusaoAction} className="mt-4">
            <input type="hidden" name="bookingId" value={booking.id} />
            <button
              type="submit"
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
            >
              Confirmar entrega
            </button>
          </form>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-red-700 underline">
              Contestar entrega
            </summary>
            <form action={contestarConclusaoAction} className="mt-2 flex flex-col gap-2">
              <input type="hidden" name="bookingId" value={booking.id} />
              <textarea
                name="texto"
                required
                rows={3}
                placeholder="O que não está certo com o serviço entregue?"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="self-start rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Enviar contestação
              </button>
            </form>
          </details>

          <form action={simularPassagemDeTempoConfirmacaoAction} className="mt-4">
            <input type="hidden" name="bookingId" value={booking.id} />
            <button type="submit" className="text-xs text-stone-400 underline">
              (Teste) Simular passagem de tempo — pular as {CONFIRMACAO_CONCLUSAO_PRAZO_HORAS}h do
              prazo de confirmação automática
            </button>
          </form>
        </section>
      )}

      {booking.status === "CONCLUIDO" && booking.statusConclusao === "CONTESTADO" && (
        <section className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-sm font-semibold text-red-700">Entrega contestada</h2>
          <p className="mt-1 text-sm text-red-700">
            Sua contestação está em análise pelo admin. O pagamento final do profissional fica
            retido até a decisão.
          </p>
        </section>
      )}

      {booking.status === "CONCLUIDO" && booking.statusConclusao === "CONFIRMADO" && (
        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-stone-900">Avaliação</h2>

          {erro && (
            <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {MENSAGENS_ERRO[erro] ?? "Não foi possível enviar a avaliação."}
            </p>
          )}

          {!review ? (
            <form action={avaliarAction} className="mt-3 flex flex-col gap-4">
              <input type="hidden" name="bookingId" value={booking.id} />
              <div>
                <p className="text-sm font-medium text-stone-700">Nota</p>
                <div className="mt-1 flex gap-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label key={n} className="flex flex-col items-center gap-1 text-xs text-stone-600">
                      <input type="radio" name="nota" value={n} required defaultChecked={n === 5} />
                      {n} ★
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700" htmlFor="depoimento">
                  Depoimento (opcional)
                </label>
                <textarea
                  id="depoimento"
                  name="depoimento"
                  rows={3}
                  className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-700">Fotos (opcional, até 3)</p>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  <input name="foto1" type="file" accept="image/*" className="text-xs" />
                  <input name="foto2" type="file" accept="image/*" className="text-xs" />
                  <input name="foto3" type="file" accept="image/*" className="text-xs" />
                </div>
              </div>
              <p className="text-xs text-stone-400">
                Ao avaliar, você ganha {TOKENS_POR_AVALIACAO} tokens (= R${" "}
                {VALOR_REAIS_POR_AVALIACAO.toFixed(2)}) de crédito na sua carteira.
              </p>
              <button
                type="submit"
                className="self-start rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
              >
                Enviar avaliação
              </button>
            </form>
          ) : (
            <div className="mt-3">
              <p className="text-lg font-semibold text-amber-600">★ {review.nota}</p>
              {review.depoimento && <p className="mt-1 text-sm text-stone-700">{review.depoimento}</p>}
              {fotosReview.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {fotosReview.map((url) => (
                    <div key={url} className="relative h-16 w-16 overflow-hidden rounded-md">
                      <Image src={url} alt="Foto da avaliação" fill unoptimized className="object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {review.statusContestacao !== "NENHUMA" && (
                <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {CONTESTACAO_LABEL[review.statusContestacao]}
                </p>
              )}

              {review.replicaWorkerTexto && (
                <div className="mt-3 rounded-md bg-stone-50 p-3">
                  <p className="text-xs font-medium text-stone-500">Resposta do profissional:</p>
                  <p className="mt-1 text-sm text-stone-700">{review.replicaWorkerTexto}</p>
                  {fotosReplica.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {fotosReplica.map((url) => (
                        <div key={url} className="relative h-16 w-16 overflow-hidden rounded-md">
                          <Image src={url} alt="Foto da réplica" fill unoptimized className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
