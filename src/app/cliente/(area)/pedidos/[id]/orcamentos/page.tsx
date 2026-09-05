import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ORCAMENTO_PRAZO_EXPIRACAO_DIAS } from "@/lib/config";
import { expirarOrcamentosVencidos } from "@/lib/expiracaoOrcamento";
import {
  aceitarOrcamentoAction,
  recusarOrcamentoAction,
  enviarContrapropostaAction,
  simularExpiracaoOrcamentoAction,
} from "./actions";

const MENSAGENS_ERRO: Record<string, string> = {
  valor_invalido: "Informe um valor válido para a contra-proposta.",
};

// Só soma uma duração fixa a uma data já conhecida — não lê o relógio, então não
// viola a regra de pureza de render mesmo ficando dentro do componente.
function prazoExpiracao(criadoEm: Date): Date {
  return new Date(criadoEm.getTime() + ORCAMENTO_PRAZO_EXPIRACAO_DIAS * 24 * 60 * 60 * 1000);
}

export default async function OrcamentosRecebidosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuario = await exigirUsuario("CLIENTE");
  const { id } = await params;
  const { erro } = await searchParams;

  await expirarOrcamentosVencidos();

  const pedido = await prisma.serviceRequest.findFirst({
    where: { id, clientProfile: { userId: usuario.id } },
    include: {
      category: true,
      address: true,
      budgets: {
        include: { worker: { include: { user: true } }, booking: true },
        orderBy: { valor: "asc" },
      },
    },
  });

  if (!pedido) notFound();

  if (pedido.status === "FECHADO" || pedido.status === "EM_ANDAMENTO" || pedido.status === "CONCLUIDO") {
    const aceito = pedido.budgets.find((b) => b.status === "ACEITO" && b.booking);
    if (aceito?.booking) redirect(`/cliente/bookings/${aceito.booking.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/cliente/pedidos" className="text-sm text-stone-500 hover:underline">
        ← Meus pedidos
      </Link>

      <h1 className="mt-2 text-xl font-semibold text-stone-900">Orçamentos recebidos</h1>
      <p className="mt-1 text-sm text-stone-500">
        {pedido.category.nome} — {pedido.address.bairro}, {pedido.address.cidade}
      </p>
      <p className="font-mono text-xs text-stone-400">{pedido.numeroOS}</p>

      {erro && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {MENSAGENS_ERRO[erro] ?? "Não foi possível concluir a ação."}
        </p>
      )}

      {pedido.budgets.length === 0 ? (
        <p className="mt-6 text-stone-600">
          Nenhum orçamento recebido ainda.{" "}
          <Link href={`/cliente/pedidos/${pedido.id}/profissionais`} className="underline">
            Ver profissionais recomendados
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {pedido.budgets.map((budget) => {
            const podeAgir = budget.status === "PENDENTE";
            const contrapropostaPendente = budget.contrapropostaStatus === "PENDENTE_WORKER";
            const contrapropostaRecusada = budget.contrapropostaStatus === "RECUSADA_PELO_WORKER";
            const prazoFinal = prazoExpiracao(budget.criadoEm);

            return (
              <li
                key={budget.id}
                className="rounded-lg border border-stone-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-900">{budget.worker.user.nome}</span>
                  <span className="text-sm text-stone-600">
                    ★ {budget.worker.notaMediaRecente > 0 ? budget.worker.notaMediaRecente.toFixed(1) : "—"}
                  </span>
                </div>
                <p className="font-mono text-xs text-stone-400">{budget.numeroPO}</p>
                <p className="mt-1 text-sm text-stone-500">
                  Prazo de entrega: {budget.prazoEntrega.toLocaleDateString("pt-BR")}
                </p>
                <p className="mt-2 text-lg font-semibold text-stone-900">
                  R$ {budget.valor.toFixed(2)}
                </p>

                {budget.status === "PENDENTE" && !contrapropostaPendente && (
                  <p className="mt-1 text-xs text-stone-400">
                    Expira em {prazoFinal.toLocaleDateString("pt-BR")} se você não decidir.
                  </p>
                )}
                {budget.status === "RECUSADO" && (
                  <p className="mt-3 text-xs text-stone-400">Não selecionado.</p>
                )}
                {budget.status === "EXPIRADO" && (
                  <p className="mt-3 text-xs text-stone-400">
                    Expirou sem resposta em {ORCAMENTO_PRAZO_EXPIRACAO_DIAS} dias.
                  </p>
                )}

                {contrapropostaPendente && (
                  <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    Sua contra-proposta de R$ {budget.valorContraproposta?.toFixed(2)} está
                    aguardando resposta do profissional.
                  </p>
                )}
                {contrapropostaRecusada && (
                  <p className="mt-3 rounded-md bg-stone-50 px-3 py-2 text-xs text-stone-500">
                    O profissional recusou sua contra-proposta de R${" "}
                    {budget.valorContraproposta?.toFixed(2)} — o valor original (R${" "}
                    {budget.valor.toFixed(2)}) continua valendo.
                  </p>
                )}

                {podeAgir && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <form action={aceitarOrcamentoAction}>
                      <input type="hidden" name="budgetId" value={budget.id} />
                      <button
                        type="submit"
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                      >
                        Aceitar este orçamento
                      </button>
                    </form>
                    <form action={recusarOrcamentoAction}>
                      <input type="hidden" name="budgetId" value={budget.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Recusar
                      </button>
                    </form>
                  </div>
                )}

                {podeAgir && !contrapropostaPendente && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-stone-600 underline">
                      Fazer contra-proposta
                    </summary>
                    <form action={enviarContrapropostaAction} className="mt-2 flex flex-col gap-2">
                      <input type="hidden" name="budgetId" value={budget.id} />
                      <input type="hidden" name="pedidoId" value={pedido.id} />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-stone-600">
                            Seu valor (R$)
                          </label>
                          <input
                            name="valor"
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            placeholder={budget.valor.toFixed(2)}
                            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-600">
                            Prazo (opcional)
                          </label>
                          <input
                            name="prazoEntrega"
                            type="date"
                            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <textarea
                        name="mensagem"
                        rows={2}
                        placeholder="Mensagem para o profissional (opcional)"
                        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="self-start rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
                      >
                        Enviar contra-proposta
                      </button>
                    </form>
                  </details>
                )}

                {podeAgir && (
                  <form action={simularExpiracaoOrcamentoAction} className="mt-3">
                    <input type="hidden" name="budgetId" value={budget.id} />
                    <button type="submit" className="text-xs text-stone-400 underline">
                      (Teste) Simular passagem de tempo — expirar em {ORCAMENTO_PRAZO_EXPIRACAO_DIAS}{" "}
                      dias
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
