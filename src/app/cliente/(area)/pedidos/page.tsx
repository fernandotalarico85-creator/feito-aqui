import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { confirmarConclusoesVencidas } from "@/lib/confirmacaoConclusao";
import { cancelarPedidoAction } from "./actions";

const STATUS_CANCELAVEL = ["TRIAGEM", "AGUARDANDO_ORCAMENTO", "ORCADO"];

const STATUS_LABEL: Record<string, string> = {
  TRIAGEM: "Em triagem",
  AGUARDANDO_ORCAMENTO: "Aguardando orçamentos",
  ORCADO: "Orçamento recebido",
  FECHADO: "Fechado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export default async function MeusPedidosPage() {
  const usuario = await exigirUsuario("CLIENTE");

  await confirmarConclusoesVencidas();

  const pedidos = await prisma.serviceRequest.findMany({
    where: { clientProfile: { userId: usuario.id } },
    include: { category: true, address: true, budgets: { include: { booking: true } } },
    orderBy: { criadoEm: "desc" },
  });

  function linkDoPedido(pedido: (typeof pedidos)[number]) {
    const aceito = pedido.budgets.find((b) => b.status === "ACEITO" && b.booking);
    if (aceito?.booking) return `/cliente/bookings/${aceito.booking.id}`;
    if (pedido.budgets.length > 0) return `/cliente/pedidos/${pedido.id}/orcamentos`;
    return `/cliente/pedidos/${pedido.id}/profissionais`;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Meus pedidos</h1>

      {pedidos.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center">
          <p className="text-stone-600">Você ainda não fez nenhum pedido.</p>
          <Link
            href="/cliente/pedidos/novo"
            className="mt-4 inline-block rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            Criar meu primeiro pedido
          </Link>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {pedidos.map((pedido) => {
            const aceito = pedido.budgets.find((b) => b.status === "ACEITO" && b.booking);
            const aguardandoConfirmacao =
              aceito?.booking?.status === "CONCLUIDO" &&
              aceito.booking.statusConclusao === "AGUARDANDO_CONFIRMACAO_CLIENTE";

            return (
            <li
              key={pedido.id}
              className="rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400"
            >
              <Link href={linkDoPedido(pedido)} className="block">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-900">{pedido.category.nome}</span>
                  <div className="flex items-center gap-2">
                    {aguardandoConfirmacao && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        Confirme a conclusão
                      </span>
                    )}
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                      {STATUS_LABEL[pedido.status] ?? pedido.status}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-stone-500">
                  {pedido.address.bairro}, {pedido.address.cidade} · {pedido.budgets.length}{" "}
                  orçamento(s) recebido(s)
                </p>
              </Link>
              {STATUS_CANCELAVEL.includes(pedido.status) && (
                <form action={cancelarPedidoAction} className="mt-2">
                  <input type="hidden" name="pedidoId" value={pedido.id} />
                  <button type="submit" className="text-xs text-red-600 underline">
                    Cancelar pedido
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
