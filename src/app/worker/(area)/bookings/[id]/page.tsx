import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ALERTA_SAIDA_PROLONGADA_MINUTOS,
  JANELA_CARENCIA_TOKENS_DIAS,
  JUSTIFICATIVA_ATRASO_PRAZO_HORAS,
  CONFIRMACAO_CONCLUSAO_PRAZO_HORAS,
} from "@/lib/config";
import { confirmarConclusoesVencidas } from "@/lib/confirmacaoConclusao";
import GeoActionForm from "./GeoActionForm";
import ConcluirServicoForm from "./ConcluirServicoForm";
import {
  fazerCheckInAction,
  fazerCheckOutAction,
  simularPassagemDeTempoAction,
  contestarAvaliacaoAction,
  cancelarBookingWorkerAction,
  justificativaAtrasoAction,
} from "./actions";

const STATUS_LABEL: Record<string, string> = {
  FECHADO: "Fechado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const CONTESTACAO_LABEL: Record<string, string> = {
  NENHUMA: "",
  EM_ANALISE: "Sua contestação está em análise pelo admin.",
  MANTIDA: "Contestação analisada — a nota foi mantida.",
  REVERTIDA: "Contestação aceita — a nota foi revertida.",
};

const REPASSE_TIPO_LABEL: Record<string, string> = {
  ACEITE: "Aceite do orçamento (2%)",
  PONTUALIDADE: "Pontualidade no check-in (30%)",
  CONCLUSAO: "Conclusão do serviço (resto)",
};

const REPASSE_STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Justificativa em análise",
  CARENCIA: "Liberação agendada",
  LIBERADO: "Liberado",
};

const REPASSE_STATUS_CLASSE: Record<string, string> = {
  PENDENTE: "bg-stone-100 text-stone-600",
  EM_ANALISE: "bg-amber-100 text-amber-700",
  CARENCIA: "bg-sky-100 text-sky-700",
  LIBERADO: "bg-emerald-100 text-emerald-700",
};

const MENSAGENS_ERRO: Record<string, string> = {
  texto_obrigatorio: "Escreva o texto.",
  prazo_expirado: "O prazo já passou.",
  sem_foto: "Envie pelo menos 1 foto do resultado para marcar como concluído (Seção 3.8).",
};

const ETAPAS = ["FECHADO", "EM_ANDAMENTO", "CONCLUIDO"] as const;

// Fora do componente de propósito — lê o relógio (impuro), o que a regra de pureza de
// render do React não permite dentro de uma função de componente.
function estaEmAlertaSaidaProlongada(checkInHorario: Date, jaAlertado: boolean): boolean {
  if (jaAlertado) return true;
  return (Date.now() - checkInHorario.getTime()) / 60000 > ALERTA_SAIDA_PROLONGADA_MINUTOS;
}

function estaDentroDoPrazoContestacao(dataCriacaoReview: Date): boolean {
  return Date.now() <= dataCriacaoReview.getTime() + JANELA_CARENCIA_TOKENS_DIAS * 24 * 60 * 60 * 1000;
}

function estaDentroDoPrazoJustificativa(dataCriacaoRepasse: Date): boolean {
  return Date.now() <= dataCriacaoRepasse.getTime() + JUSTIFICATIVA_ATRASO_PRAZO_HORAS * 60 * 60 * 1000;
}

/** Status/legenda especiais pra parcela de conclusão do repasse (Seção 3.8) enquanto
 * ela ainda não foi liberada — substitui o "Pendente" genérico por algo que reflita
 * onde a confirmação do cliente está. Não lê o relógio (só soma uma duração fixa a uma
 * data já conhecida), então pode ficar dentro do componente sem violar a regra de
 * pureza — mas fica ao lado das outras por consistência. */
function statusConclusaoOverride(
  statusConclusao: string | null,
  conclusaoMarcadaEm: Date | null,
): { label: string; classe: string; detalhe: string } | null {
  if (statusConclusao === "AGUARDANDO_CONFIRMACAO_CLIENTE" && conclusaoMarcadaEm) {
    const prazo = new Date(
      conclusaoMarcadaEm.getTime() + CONFIRMACAO_CONCLUSAO_PRAZO_HORAS * 60 * 60 * 1000,
    );
    return {
      label: "Aguardando confirmação do cliente",
      classe: "bg-amber-100 text-amber-700",
      detalhe: `Se o cliente não confirmar nem contestar, libera automaticamente em ${prazo.toLocaleDateString(
        "pt-BR",
      )} às ${prazo.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`,
    };
  }
  if (statusConclusao === "CONTESTADO") {
    return {
      label: "Entrega contestada",
      classe: "bg-red-100 text-red-700",
      detalhe: "O cliente contestou a entrega — em análise pelo admin, valor retido até a decisão.",
    };
  }
  return null;
}

export default async function AcompanhamentoBookingWorkerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuario = await exigirUsuario("WORKER");
  const { id } = await params;
  const { erro } = await searchParams;

  await confirmarConclusoesVencidas();

  const booking = await prisma.booking.findFirst({
    where: { id, budget: { worker: { userId: usuario.id } } },
    include: {
      budget: {
        include: {
          serviceRequest: {
            include: {
              category: true,
              address: true,
              clientProfile: { include: { user: true } },
            },
          },
        },
      },
      review: true,
      repasses: { orderBy: { criadoEm: "asc" } },
    },
  });

  if (!booking) notFound();

  const { budget, review, repasses } = booking;
  const etapaAtual = ETAPAS.indexOf(booking.status as (typeof ETAPAS)[number]);
  const repassePontualidade = repasses.find((r) => r.tipo === "PONTUALIDADE");
  const podeJustificar =
    repassePontualidade != null &&
    repassePontualidade.status === "PENDENTE" &&
    estaDentroDoPrazoJustificativa(repassePontualidade.criadoEm);
  const cliente = budget.serviceRequest.clientProfile.user;
  const endereco = budget.serviceRequest.address;
  const fotosReview: string[] = review?.fotosJson ? JSON.parse(review.fotosJson) : [];
  const dentroDoPrazoContestacao = review != null && estaDentroDoPrazoContestacao(review.criadoEm);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/worker/orcamentos" className="text-sm text-stone-500 hover:underline">
        ← Meus orçamentos
      </Link>

      <h1 className="mt-2 text-xl font-semibold text-stone-900">
        {budget.serviceRequest.category.nome}
      </h1>
      <p className="font-mono text-xs text-stone-400">
        {budget.serviceRequest.numeroOS} · {budget.numeroPO}
      </p>
      <p className="mt-1 text-sm text-stone-500">
        {endereco.logradouro}, {endereco.numero} — {endereco.bairro}, {endereco.cidade}
      </p>

      {etapaAtual >= 0 && (
        <ol className="mt-6 flex items-center gap-2 text-xs">
          {ETAPAS.map((etapa, i) => (
            <li key={etapa} className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 font-medium ${
                  i <= etapaAtual ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-400"
                }`}
              >
                {STATUS_LABEL[etapa]}
              </span>
              {i < ETAPAS.length - 1 && <span className="text-stone-300">→</span>}
            </li>
          ))}
        </ol>
      )}

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">Check-in / check-out</h2>

        {!booking.checkInHorario && (
          <>
            <p className="mt-1 text-sm text-stone-500">
              Chegou no endereço? Confirme sua localização para registrar o check-in.
            </p>
            <GeoActionForm
              action={fazerCheckInAction}
              bookingId={booking.id}
              buttonLabel="Cheguei"
              defaultLat={endereco.latitude}
              defaultLng={endereco.longitude}
            />
          </>
        )}

        {booking.checkInHorario && !booking.checkOutHorario && (
          <>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-700">
                Chegou às {booking.checkInHorario.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 font-medium ${
                  booking.checkInDentroGeofence
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {booking.checkInDentroGeofence ? "Dentro da área esperada" : "Fora da área esperada"}
              </span>
              {booking.checkInAtrasado && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-700">
                  Fora do horário combinado
                </span>
              )}
            </div>

            {estaEmAlertaSaidaProlongada(booking.checkInHorario, booking.alertaSaidaProlongada) && (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                Alerta: mais de {ALERTA_SAIDA_PROLONGADA_MINUTOS} minutos desde o check-in sem
                check-out registrado.
              </p>
            )}

            <p className="mt-4 text-sm text-stone-500">Concluiu o serviço?</p>
            {erro && (
              <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {MENSAGENS_ERRO[erro] ?? "Não foi possível concluir a ação."}
              </p>
            )}
            <ConcluirServicoForm
              action={fazerCheckOutAction}
              bookingId={booking.id}
              defaultLat={endereco.latitude}
              defaultLng={endereco.longitude}
            />

            <form action={simularPassagemDeTempoAction} className="mt-3">
              <input type="hidden" name="bookingId" value={booking.id} />
              <button type="submit" className="text-xs text-stone-400 underline">
                (Teste) Simular passagem de tempo — adiantar {ALERTA_SAIDA_PROLONGADA_MINUTOS + 5}{" "}
                min desde o check-in
              </button>
            </form>
          </>
        )}

        {booking.checkInHorario && booking.checkOutHorario && (
          <div className="mt-2 flex flex-col gap-1 text-sm text-stone-700">
            <p>
              Chegou às{" "}
              {booking.checkInHorario.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              {booking.checkInAtrasado && " (fora do horário combinado)"}
            </p>
            <p>
              Concluído às{" "}
              {booking.checkOutHorario.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">Seu repasse</h2>
        <p className="mt-1 text-xs text-stone-500">
          Valor do orçamento: R$ {budget.valor.toFixed(2)} · liberado em 3 parcelas.
        </p>

        {erro && (
          <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {MENSAGENS_ERRO[erro] ?? "Não foi possível concluir a ação."}
          </p>
        )}

        <ul className="mt-3 flex flex-col gap-2">
          {repasses.map((repasse) => {
            const conclusaoOverride =
              repasse.tipo === "CONCLUSAO" && repasse.status !== "LIBERADO"
                ? statusConclusaoOverride(booking.statusConclusao, booking.conclusaoMarcadaEm)
                : null;

            return (
            <li
              key={repasse.id}
              className="rounded-md border border-stone-200 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-700">{REPASSE_TIPO_LABEL[repasse.tipo]}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-stone-900">
                    R$ {repasse.valor.toFixed(2)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      conclusaoOverride?.classe ?? REPASSE_STATUS_CLASSE[repasse.status]
                    }`}
                  >
                    {conclusaoOverride?.label ?? REPASSE_STATUS_LABEL[repasse.status]}
                  </span>
                </div>
              </div>

              {conclusaoOverride && (
                <p className="mt-2 text-xs text-stone-500">{conclusaoOverride.detalhe}</p>
              )}

              {repasse.tipo === "PONTUALIDADE" && repasse.status === "PENDENTE" && (
                <>
                  {repasse.justificativaTexto ? (
                    <p className="mt-2 text-xs text-stone-500">
                      Sua justificativa: &ldquo;{repasse.justificativaTexto}&rdquo;
                    </p>
                  ) : podeJustificar ? (
                    <form action={justificativaAtrasoAction} className="mt-2 flex flex-col gap-2">
                      <input type="hidden" name="repasseId" value={repasse.id} />
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <textarea
                        name="texto"
                        required
                        rows={2}
                        placeholder="Por que o check-in ficou fora do horário combinado?"
                        className="w-full rounded-md border border-stone-300 px-3 py-2 text-xs"
                      />
                      <button
                        type="submit"
                        className="self-start rounded-md border border-stone-300 px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100"
                      >
                        Enviar justificativa
                      </button>
                    </form>
                  ) : (
                    <p className="mt-2 text-xs text-stone-400">
                      Sem justificativa — libera automaticamente junto com a parcela de conclusão.
                    </p>
                  )}
                </>
              )}
              {repasse.tipo === "PONTUALIDADE" && repasse.status === "EM_ANALISE" && (
                <p className="mt-2 text-xs text-amber-700">
                  Justificativa enviada, aguardando decisão do admin.
                </p>
              )}
            </li>
            );
          })}
        </ul>

        <p className="mt-3 text-sm font-medium text-stone-900">
          Já liberado: R${" "}
          {repasses
            .filter((r) => r.status === "LIBERADO")
            .reduce((soma, r) => soma + r.valor, 0)
            .toFixed(2)}
        </p>
      </section>

      {review && (
        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-stone-900">Avaliação do cliente</h2>

          {erro && (
            <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {MENSAGENS_ERRO[erro] ?? "Não foi possível enviar a contestação."}
            </p>
          )}

          <p className="mt-2 text-lg font-semibold text-amber-600">★ {review.nota}</p>
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

          {review.statusContestacao === "NENHUMA" &&
            (dentroDoPrazoContestacao ? (
              <form action={contestarAvaliacaoAction} className="mt-4 flex flex-col gap-3">
                <input type="hidden" name="bookingId" value={booking.id} />
                <div>
                  <label className="block text-sm font-medium text-stone-700" htmlFor="texto">
                    Contestar essa nota
                  </label>
                  <textarea
                    id="texto"
                    name="texto"
                    required
                    rows={3}
                    placeholder="Explique por que você discorda da avaliação..."
                    className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600" htmlFor="foto">
                    Foto de evidência (opcional)
                  </label>
                  <input id="foto" name="foto" type="file" accept="image/*" className="mt-1 text-sm" />
                </div>
                <button
                  type="submit"
                  className="self-start rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
                >
                  Enviar contestação
                </button>
                <p className="text-xs text-stone-400">
                  Você tem até {JANELA_CARENCIA_TOKENS_DIAS} dias após a avaliação para contestar.
                </p>
              </form>
            ) : (
              <p className="mt-3 text-xs text-stone-400">
                O prazo de {JANELA_CARENCIA_TOKENS_DIAS} dias para contestar essa avaliação já
                passou.
              </p>
            ))}
        </section>
      )}

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">Cliente</h2>
        <p className="mt-2 text-sm text-stone-700">{cliente.nome}</p>
        <p className="text-sm text-stone-500">{cliente.email}</p>
        <p className="mt-1 text-xs text-stone-400">
          Prazo de entrega combinado: {budget.prazoEntrega.toLocaleDateString("pt-BR")}
        </p>
      </section>

      {booking.status === "CANCELADO" && (
        <section className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-sm font-semibold text-red-700">Serviço cancelado</h2>
          <p className="mt-1 text-sm text-red-700">
            Cancelado por {booking.canceladoPor === "WORKER" ? "você" : "o cliente"} em{" "}
            {booking.canceladoEm?.toLocaleDateString("pt-BR")}
            {booking.motivoCancelamento && <> — {booking.motivoCancelamento}</>}
          </p>
        </section>
      )}

      {(booking.status === "FECHADO" || booking.status === "EM_ANDAMENTO") && (
        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-stone-900">Cancelar serviço</h2>
          <p className="mt-1 text-xs text-stone-500">
            Cancelar depois de fechado gera um strike (Seção 3.6) proporcional à proximidade
            da data combinada — menos de 24h vira equivalente a no-show, com reembolso
            automático ao cliente.
          </p>
          <form action={cancelarBookingWorkerAction} className="mt-3 flex flex-col gap-2">
            <input type="hidden" name="bookingId" value={booking.id} />
            <textarea
              name="motivo"
              rows={2}
              placeholder="Motivo (opcional)"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="self-start rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Cancelar serviço
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
