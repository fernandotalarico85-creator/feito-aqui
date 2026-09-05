import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listarPortfolioFeed } from "@/lib/portfolio";
import PortfolioFeed from "@/components/PortfolioFeed";
import { solicitarOrcamentoAction } from "./actions";

export default async function PerfilWorkerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pedido?: string }>;
}) {
  const usuario = await exigirUsuario("CLIENTE");
  const { id } = await params;
  const { pedido: pedidoId } = await searchParams;

  const worker = await prisma.workerProfile.findUnique({
    where: { id },
    include: { user: true, categorias: true },
  });

  if (!worker) notFound();

  const portfolioFeed = await listarPortfolioFeed(worker.id);

  const [reviews, pedido] = await Promise.all([
    prisma.review.findMany({
      where: { booking: { budget: { workerId: worker.id } } },
      orderBy: { criadoEm: "desc" },
    }),
    pedidoId
      ? prisma.serviceRequest.findFirst({
          where: { id: pedidoId, clientProfile: { userId: usuario.id } },
          include: { category: true },
        })
      : null,
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={pedido ? `/cliente/pedidos/${pedido.id}/profissionais` : "/cliente/pedidos"}
        className="text-sm text-stone-500 hover:underline"
      >
        ← Voltar
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">{worker.user.nome}</h1>
          <p className="text-sm text-stone-500">{worker.regiaoAtendimento}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {worker.categorias.map((c) => (
              <span
                key={c.id}
                className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600"
              >
                {c.nome}
              </span>
            ))}
            {worker.destaquePago && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                Destaque
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-semibold text-stone-900">
            {worker.notaMediaRecente > 0 ? worker.notaMediaRecente.toFixed(1) : "—"}
            <span className="text-base text-amber-500"> ★</span>
          </p>
          <p className="text-xs text-stone-500">{worker.volumeConcluidos} serviços concluídos</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-stone-700">{worker.bio}</p>

      {pedido && (
        <form action={solicitarOrcamentoAction} className="mt-6">
          <input type="hidden" name="workerId" value={worker.id} />
          <input type="hidden" name="pedidoId" value={pedido.id} />
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Solicitar orçamento para &ldquo;{pedido.category.nome}&rdquo;
          </button>
        </form>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-stone-900">Portfólio</h2>
        <div className="mt-3">
          <PortfolioFeed items={portfolioFeed} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-stone-900">Avaliações</h2>
        {reviews.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Ainda não há avaliações para este profissional.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-lg border border-stone-200 bg-white p-3">
                <p className="text-sm font-medium text-stone-900">★ {review.nota}</p>
                {review.depoimento && (
                  <p className="mt-1 text-sm text-stone-600">{review.depoimento}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
