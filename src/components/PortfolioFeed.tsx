import Image from "next/image";
import type { PortfolioFeedItem } from "@/lib/portfolio";

/**
 * Feed de portfólio estilo timeline (Instagram-like): cada post é ou um serviço
 * "externo" (descrição livre, sem verificação) ou um serviço "via Feito Aqui"
 * (vinculado a um Booking concluído — categoria, região e nota puxados automaticamente).
 *
 * Redação por privacidade (LGPD): posts vinculados à plataforma NUNCA mostram nome,
 * e-mail ou endereço exato do cliente — só categoria, bairro/cidade e a nota recebida.
 * Ajuste os campos exibidos aqui se as regras de privacidade mudarem.
 */
export default function PortfolioFeed({ items }: { items: PortfolioFeedItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-stone-500">Nenhuma publicação no portfólio ainda.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {items.map((item) => (
        <PortfolioPost key={item.id} item={item} />
      ))}
    </div>
  );
}

function PortfolioPost({ item }: { item: PortfolioFeedItem }) {
  const booking = item.booking;
  const endereco = booking?.budget.serviceRequest.address;
  const categoria = booking?.budget.serviceRequest.category;
  const review = booking?.review;

  return (
    <article className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="grid grid-cols-2">
        {item.fotoAntesUrl ? (
          <div className="relative aspect-square">
            <Image
              src={item.fotoAntesUrl}
              alt="Antes"
              fill
              unoptimized
              className="object-cover"
            />
            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
              Antes
            </span>
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center bg-stone-50 text-xs text-stone-400">
            Sem foto de &ldquo;antes&rdquo;
          </div>
        )}
        {item.fotoDepoisUrl ? (
          <div className="relative aspect-square">
            <Image
              src={item.fotoDepoisUrl}
              alt="Depois"
              fill
              unoptimized
              className="object-cover"
            />
            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
              Depois
            </span>
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center bg-stone-50 text-xs text-stone-400">
            Sem foto de &ldquo;depois&rdquo;
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              item.origem === "PLATAFORMA"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            {item.origem === "PLATAFORMA" ? "Via Feito Aqui" : "Serviço externo"}
          </span>
          <span className="text-xs text-stone-400">
            {item.criadoEm.toLocaleDateString("pt-BR")}
          </span>
        </div>

        {item.origem === "PLATAFORMA" && booking ? (
          <div className="mt-2">
            <p className="text-sm font-medium text-stone-900">{categoria?.nome}</p>
            <p className="text-sm text-stone-500">
              {endereco?.bairro}, {endereco?.cidade}
            </p>
            <p className="mt-1 text-sm">
              <NotaDoServico review={review ?? null} />
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-stone-700">
            {item.descricao || "Sem descrição."}
            <span className="ml-2 text-xs text-stone-400">(não verificado pela plataforma)</span>
          </p>
        )}
      </div>
    </article>
  );
}

function NotaDoServico({
  review,
}: {
  review: { nota: number; statusContestacao: string } | null;
}) {
  if (!review) {
    return <span className="text-stone-400">Aguardando avaliação do cliente</span>;
  }
  if (review.statusContestacao === "EM_ANALISE") {
    return <span className="text-stone-400">Avaliação em análise</span>;
  }
  if (review.statusContestacao === "REVERTIDA") {
    return <span className="text-stone-400">Avaliação contestada</span>;
  }
  return <span className="font-medium text-amber-600">★ {review.nota.toFixed(1)}</span>;
}
