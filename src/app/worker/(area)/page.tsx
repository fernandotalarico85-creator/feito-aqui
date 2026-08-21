import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { workerCompativelComAgenda } from "@/lib/agenda";

export default async function WorkerDashboardPage() {
  const usuario = await exigirUsuario("WORKER");
  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
    include: { categorias: true, budgets: true },
  });

  const pedidosCompativeis = await prisma.serviceRequest.findMany({
    where: {
      status: { in: ["AGUARDANDO_ORCAMENTO", "ORCADO"] },
      categoryId: { in: worker.categorias.map((c) => c.id) },
    },
  });

  const compatibilidade = await Promise.all(
    pedidosCompativeis.map((p) =>
      workerCompativelComAgenda(worker.id, p.janelaDataInicio, p.janelaDataFim),
    ),
  );
  const pedidosDisponiveis = pedidosCompativeis.filter((_, i) => compatibilidade[i]).length;

  const orcamentosPendentes = worker.budgets.filter((b) => b.status === "PENDENTE").length;

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Olá, {usuario.nome}</h1>

      {worker.statusVerificacao === "PENDENTE" && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Seu perfil ainda está pendente de verificação por um administrador — você só aparece
          nos resultados dos clientes depois de aprovado.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/worker/pedidos"
          className="rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400"
        >
          <p className="text-2xl font-semibold text-stone-900">{pedidosDisponiveis}</p>
          <p className="text-sm text-stone-500">pedidos compatíveis com você agora</p>
        </Link>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-2xl font-semibold text-stone-900">{orcamentosPendentes}</p>
          <p className="text-sm text-stone-500">orçamentos enviados aguardando resposta</p>
        </div>
        <Link
          href="/worker/agenda"
          className="rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400"
        >
          <p className="text-2xl font-semibold text-stone-900">Agenda</p>
          <p className="text-sm text-stone-500">gerenciar dias disponíveis</p>
        </Link>
      </div>
    </div>
  );
}
