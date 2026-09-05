import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { confirmarConclusoesVencidas } from "@/lib/confirmacaoConclusao";
import StatusBadge from "@/components/ui/StatusBadge";
import { cancelarPedidoAction } from "./actions";

const STATUS_CANCELAVEL = ["TRIAGEM", "AGUARDANDO_ORCAMENTO", "ORCADO"];
const FECHADOS = ["FECHADO", "EM_ANDAMENTO", "CONCLUIDO"];

const STATUS_LABEL: Record<string, string> = {
  TRIAGEM: "Em triagem",
  AGUARDANDO_ORCAMENTO: "Aguardando orçamentos",
  ORCADO: "Orçamento recebido",
  FECHADO: "Fechado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const STATUS_TONE: Record<string, "success" | "alert" | "secondary" | "neutral"> = {
  TRIAGEM: "alert",
  AGUARDANDO_ORCAMENTO: "alert",
  ORCADO: "alert",
  FECHADO: "secondary",
  EM_ANDAMENTO: "secondary",
  CONCLUIDO: "success",
  CANCELADO: "neutral",
};

export default async function MeusPedidosPage() {
  const usuario = await exigirUsuario("CLIENTE");

  await confirmarConclusoesVencidas();

  const pedidos = await prisma.serviceRequest.findMany({
    where: { clientProfile: { userId: usuario.id } },
    include: { category: true, address: true, budgets: { include: { booking: true } }, project: true },
    orderBy: { criadoEm: "desc" },
  });

  function linkDoPedido(pedido: (typeof pedidos)[number]) {
    const aceito = pedido.budgets.find((b) => b.status === "ACEITO" && b.booking);
    if (aceito?.booking) return `/cliente/bookings/${aceito.booking.id}`;
    if (pedido.budgets.length > 0) return `/cliente/pedidos/${pedido.id}/orcamentos`;
    return `/cliente/pedidos/${pedido.id}/profissionais`;
  }

  // Pedidos com Project (Prompt 22, categoria multi-sub-serviço) agrupam sob um único
  // cabeçalho na lista; pedidos avulsos continuam um card cada, como sempre.
  type Pedido = (typeof pedidos)[number];
  type Cartao =
    | { tipo: "avulso"; pedido: Pedido }
    | { tipo: "projeto"; projetoId: string; categoriaNome: string; itens: Pedido[] };

  const cartoes: Cartao[] = [];
  const indicePorProjeto = new Map<string, number>();

  for (const pedido of pedidos) {
    if (!pedido.project) {
      cartoes.push({ tipo: "avulso", pedido });
      continue;
    }
    const idx = indicePorProjeto.get(pedido.project.id);
    if (idx === undefined) {
      indicePorProjeto.set(pedido.project.id, cartoes.length);
      cartoes.push({
        tipo: "projeto",
        projetoId: pedido.project.id,
        categoriaNome: pedido.category.nome,
        itens: [pedido],
      });
    } else {
      const cartao = cartoes[idx];
      if (cartao.tipo === "projeto") cartao.itens.push(pedido);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Meus pedidos</h1>

      {pedidos.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center">
          <p className="text-stone-600">Você ainda não fez nenhum pedido.</p>
          <Link
            href="/cliente/pedidos/novo"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Criar meu primeiro pedido
          </Link>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {cartoes.map((cartao) => {
            if (cartao.tipo === "projeto") {
              const total = cartao.itens.length;
              const fechados = cartao.itens.filter((sr) => FECHADOS.includes(sr.status)).length;
              return (
                <li
                  key={cartao.projetoId}
                  className="rounded-lg border border-stone-200 bg-card p-4 shadow-sm hover:border-stone-400"
                >
                  <Link href={`/cliente/projetos/${cartao.projetoId}`} className="block">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-stone-900">{cartao.categoriaNome}</span>
                      <StatusBadge
                        label={`${fechados} de ${total} fechados`}
                        tone={fechados === total ? "success" : "secondary"}
                      />
                    </div>
                    <p className="mt-1 text-sm text-stone-500">{total} sub-serviços neste pedido</p>
                  </Link>
                </li>
              );
            }

            const pedido = cartao.pedido;
            const aceito = pedido.budgets.find((b) => b.status === "ACEITO" && b.booking);
            const aguardandoConfirmacao =
              aceito?.booking?.status === "CONCLUIDO" &&
              aceito.booking.statusConclusao === "AGUARDANDO_CONFIRMACAO_CLIENTE";

            return (
            <li
              key={pedido.id}
              className="rounded-lg border border-stone-200 bg-card p-4 shadow-sm hover:border-stone-400"
            >
              <Link href={linkDoPedido(pedido)} className="block">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-900">{pedido.category.nome}</span>
                  <div className="flex items-center gap-2">
                    {aguardandoConfirmacao && <StatusBadge label="Confirme a conclusão" tone="alert" />}
                    <StatusBadge
                      label={STATUS_LABEL[pedido.status] ?? pedido.status}
                      tone={STATUS_TONE[pedido.status] ?? "neutral"}
                    />
                  </div>
                </div>
                <p className="mt-0.5 font-mono text-xs text-stone-400">{pedido.numeroOS}</p>
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
