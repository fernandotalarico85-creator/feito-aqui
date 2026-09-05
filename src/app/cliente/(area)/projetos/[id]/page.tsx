import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";

const FECHADOS: string[] = ["FECHADO", "EM_ANDAMENTO", "CONCLUIDO"];

const STATUS_LABEL: Record<string, string> = {
  TRIAGEM: "Em triagem",
  AGUARDANDO_ORCAMENTO: "Aguardando orçamentos",
  ORCADO: "Orçamento recebido",
  FECHADO: "Fechado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

/** Pedido "guarda-chuva" com um sub-serviço por card — cada um independente
 * (Prompt 22): aceitar/cancelar/avaliar um não afeta os demais. */
export default async function ProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await exigirUsuario("CLIENTE");
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, clientProfile: { userId: usuario.id } },
    include: {
      category: true,
      serviceRequests: {
        include: { address: true, budgets: { include: { booking: true } } },
        orderBy: { criadoEm: "asc" },
      },
    },
  });
  if (!project) notFound();

  const servicos = project.serviceRequests;
  const total = servicos.length;
  const fechados = servicos.filter((sr) => FECHADOS.includes(sr.status)).length;

  function linkDoServico(servico: (typeof servicos)[number]) {
    const aceito = servico.budgets.find((b) => b.status === "ACEITO" && b.booking);
    if (aceito?.booking) return `/cliente/bookings/${aceito.booking.id}`;
    if (servico.budgets.length > 0) return `/cliente/pedidos/${servico.id}/orcamentos`;
    return `/cliente/pedidos/${servico.id}/profissionais`;
  }

  return (
    <div>
      <Link href="/cliente/pedidos" className="text-sm text-stone-500 hover:underline">
        ← Meus pedidos
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-stone-900">{project.category.nome}</h1>
      <p className="mt-1 text-sm text-stone-500">{project.descricaoLivre}</p>
      <p className="mt-2 text-sm font-medium text-stone-700">
        {fechados} de {total} serviços fechados
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {servicos.map((servico) => {
          const subServico = JSON.parse(servico.subServicosJson)[0]?.nome ?? project.category.nome;
          return (
            <li
              key={servico.id}
              className="rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400"
            >
              <Link href={linkDoServico(servico)} className="block">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-900">{subServico}</span>
                  <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                    {STATUS_LABEL[servico.status] ?? servico.status}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-xs text-stone-400">{servico.numeroOS}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {servico.address.bairro}, {servico.address.cidade} · {servico.budgets.length}{" "}
                  orçamento(s) recebido(s)
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
