import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { workerCompativelComAgenda } from "@/lib/agenda";

export default async function PedidosRecebidosPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string }>;
}) {
  const usuario = await exigirUsuario("WORKER");
  const { enviado } = await searchParams;

  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
    include: { categorias: true },
  });

  const pedidos = await prisma.serviceRequest.findMany({
    where: {
      status: { in: ["AGUARDANDO_ORCAMENTO", "ORCADO"] },
      categoryId: { in: worker.categorias.map((c) => c.id) },
    },
    include: {
      category: true,
      address: true,
      budgets: { where: { workerId: worker.id } },
    },
    orderBy: { criadoEm: "desc" },
  });

  const pedidosCompativeis = (
    await Promise.all(
      pedidos.map(async (pedido) => ({
        pedido,
        compativel: await workerCompativelComAgenda(
          worker.id,
          pedido.janelaDataInicio,
          pedido.janelaDataFim,
        ),
      })),
    )
  ).filter((p) => p.compativel);

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Pedidos recebidos</h1>
      <p className="mt-1 text-sm text-stone-500">
        Pedidos compatíveis com suas categorias e agenda. Os dados de contato do cliente só
        são liberados depois que um orçamento seu for aceito.
      </p>

      {enviado && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Orçamento enviado com sucesso!
        </p>
      )}

      {pedidosCompativeis.length === 0 ? (
        <p className="mt-6 text-stone-600">Nenhum pedido compatível no momento.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {pedidosCompativeis.map(({ pedido }) => {
            const jaOrcado = pedido.budgets.length > 0;
            return (
              <li key={pedido.id}>
                <Link
                  href={`/worker/pedidos/${pedido.id}`}
                  className="block rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-stone-900">{pedido.category.nome}</span>
                    {jaOrcado ? (
                      <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                        Orçamento enviado
                      </span>
                    ) : (
                      <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                        Novo
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-stone-400">{pedido.numeroOS}</p>
                  <p className="mt-1 text-sm text-stone-500">
                    {pedido.address.bairro}, {pedido.address.cidade} ·{" "}
                    {pedido.janelaDataInicio.toLocaleDateString("pt-BR")} a{" "}
                    {pedido.janelaDataFim.toLocaleDateString("pt-BR")}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
