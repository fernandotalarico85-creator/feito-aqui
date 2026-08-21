import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { expirarOrcamentosVencidos } from "@/lib/expiracaoOrcamento";
import { aceitarContrapropostaAction, recusarContrapropostaAction } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Aguardando resposta",
  ACEITO: "Aceito",
  RECUSADO: "Não selecionado",
  EXPIRADO: "Expirou sem resposta do cliente",
};

const STATUS_CLASSE: Record<string, string> = {
  PENDENTE: "bg-sky-100 text-sky-700",
  ACEITO: "bg-emerald-100 text-emerald-700",
  RECUSADO: "bg-stone-100 text-stone-500",
  EXPIRADO: "bg-stone-100 text-stone-500",
};

export default async function MeusOrcamentosPage() {
  const usuario = await exigirUsuario("WORKER");
  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  await expirarOrcamentosVencidos();

  const orcamentos = await prisma.budget.findMany({
    where: { workerId: worker.id },
    include: { serviceRequest: { include: { category: true, address: true } }, booking: true },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Meus orçamentos</h1>

      {orcamentos.length === 0 ? (
        <p className="mt-6 text-stone-600">Você ainda não enviou nenhum orçamento.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {orcamentos.map((orcamento) => (
            <li
              key={orcamento.id}
              className="rounded-lg border border-stone-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-stone-900">
                  {orcamento.serviceRequest.category.nome}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSE[orcamento.status]}`}
                >
                  {STATUS_LABEL[orcamento.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-stone-500">
                {orcamento.serviceRequest.address.bairro}, {orcamento.serviceRequest.address.cidade}{" "}
                · R$ {orcamento.valor.toFixed(2)}
              </p>
              {orcamento.status === "ACEITO" && orcamento.booking && (
                <Link
                  href={`/worker/bookings/${orcamento.booking.id}`}
                  className="mt-2 inline-block text-sm font-medium text-stone-900 underline"
                >
                  Ver acompanhamento do serviço →
                </Link>
              )}

              {orcamento.contrapropostaStatus === "PENDENTE_WORKER" && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-800">
                    Contra-proposta do cliente: R$ {orcamento.valorContraproposta?.toFixed(2)}
                    {orcamento.prazoEntregaContraproposta && (
                      <> · prazo {orcamento.prazoEntregaContraproposta.toLocaleDateString("pt-BR")}</>
                    )}
                  </p>
                  {orcamento.contrapropostaMensagem && (
                    <p className="mt-1 text-xs text-amber-700">
                      &ldquo;{orcamento.contrapropostaMensagem}&rdquo;
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <form action={aceitarContrapropostaAction}>
                      <input type="hidden" name="budgetId" value={orcamento.id} />
                      <button
                        type="submit"
                        className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700"
                      >
                        Aceitar contra-proposta
                      </button>
                    </form>
                    <form action={recusarContrapropostaAction}>
                      <input type="hidden" name="budgetId" value={orcamento.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
                      >
                        Recusar contra-proposta
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
