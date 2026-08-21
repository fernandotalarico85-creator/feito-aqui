import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { retirarOrcamentoAction } from "./actions";
import EnviarOrcamentoForm from "./EnviarOrcamentoForm";

const MENSAGENS_ERRO: Record<string, string> = {
  dados_invalidos: "Informe um valor válido e o prazo de entrega.",
};

export default async function DetalhePedidoWorkerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuario = await exigirUsuario("WORKER");
  const { id } = await params;
  const { erro } = await searchParams;

  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  const pedido = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      category: true,
      address: true,
      budgets: { where: { workerId: worker.id } },
    },
  });

  if (!pedido) notFound();

  const subServicos: { nome: string }[] = JSON.parse(pedido.subServicosJson);
  const meuOrcamento = pedido.budgets[0];

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/worker/pedidos" className="text-sm text-stone-500 hover:underline">
        ← Pedidos recebidos
      </Link>

      <h1 className="mt-2 text-xl font-semibold text-stone-900">{pedido.category.nome}</h1>
      <p className="mt-1 text-sm text-stone-500">
        {pedido.address.bairro}, {pedido.address.cidade} — endereço completo e dados de
        contato do cliente são liberados só após o orçamento ser aceito.
      </p>

      <div className="mt-4 rounded-md bg-stone-100 p-3">
        <p className="text-xs font-medium text-stone-500">Sub-serviços envolvidos:</p>
        <p className="mt-1 text-sm text-stone-700">
          {subServicos.map((s) => s.nome).join(" → ")}
        </p>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-stone-700">{pedido.descricaoLivre}</p>

      <p className="mt-3 text-sm text-stone-600">
        Janela desejada: {pedido.janelaDataInicio.toLocaleDateString("pt-BR")} a{" "}
        {pedido.janelaDataFim.toLocaleDateString("pt-BR")}
      </p>

      {erro && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {MENSAGENS_ERRO[erro] ?? "Não foi possível enviar o orçamento."}
        </p>
      )}

      {meuOrcamento ? (
        <div className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-sm font-medium text-stone-900">Seu orçamento já foi enviado</p>
          <p className="mt-1 text-sm text-stone-600">
            Valor: R$ {meuOrcamento.valor.toFixed(2)} · Meu prazo de entrega:{" "}
            {meuOrcamento.prazoEntrega.toLocaleDateString("pt-BR")}
          </p>
          <p className="mt-1 text-xs text-stone-400">Status: {meuOrcamento.status}</p>
          {meuOrcamento.status === "PENDENTE" && (
            <form action={retirarOrcamentoAction} className="mt-3">
              <input type="hidden" name="budgetId" value={meuOrcamento.id} />
              <button type="submit" className="text-xs text-red-600 underline">
                Retirar orçamento
              </button>
            </form>
          )}
        </div>
      ) : (
        <EnviarOrcamentoForm serviceRequestId={pedido.id} />
      )}
    </div>
  );
}
