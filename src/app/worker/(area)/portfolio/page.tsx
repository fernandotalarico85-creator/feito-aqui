import Image from "next/image";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  listarPortfolioFeed,
  listarBookingsElegiveisParaPortfolio,
  listarFotosServicoNaoPublicadas,
} from "@/lib/portfolio";
import PortfolioFeed from "@/components/PortfolioFeed";
import { adicionarPortfolioAction, publicarFotoServicoAction } from "./actions";
import AdicionarPortfolioForm from "./AdicionarPortfolioForm";

const MENSAGENS_ERRO: Record<string, string> = {
  sem_foto: "Selecione ao menos a foto \"antes\" para adicionar ao portfólio.",
  obra_invalida: "Selecione uma obra concluída sua que ainda não esteja no portfólio.",
};

export default async function PortfolioWorkerPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuario = await exigirUsuario("WORKER");
  const params = await searchParams;

  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  const [portfolioFeed, bookingsElegiveis, fotosNaoPublicadas] = await Promise.all([
    listarPortfolioFeed(worker.id),
    listarBookingsElegiveisParaPortfolio(worker.id),
    listarFotosServicoNaoPublicadas(worker.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-stone-900">Portfólio</h1>
      <p className="mt-1 text-sm text-stone-500">
        Galeria pública de fotos antes/depois dos seus trabalhos — é o que o cliente vê ao
        avaliar seu perfil.
      </p>

      {params.erro && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {MENSAGENS_ERRO[params.erro] ?? "Não foi possível salvar."}
        </p>
      )}

      <section className="mt-6">
        <p className="text-xs text-stone-500">
          Upload local — os arquivos ficam salvos em public/uploads neste protótipo.
        </p>

        {fotosNaoPublicadas.length > 0 && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-800">
              Fotos de serviços concluídos ainda não publicadas
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Enviadas na conclusão do serviço (Seção 3.8) — publique quando quiser, sem
              precisar reenviar nada.
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {fotosNaoPublicadas.map((foto) => (
                <li key={foto.id} className="overflow-hidden rounded-md border border-stone-200 bg-white">
                  <div className="relative aspect-square">
                    <Image src={foto.url} alt="Foto do resultado" fill unoptimized className="object-cover" />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-stone-700">
                      {foto.booking.budget.serviceRequest.category.nome}
                    </p>
                    <p className="text-xs text-stone-400">
                      {foto.booking.budget.serviceRequest.address.bairro}
                    </p>
                    <form action={publicarFotoServicoAction} className="mt-2">
                      <input type="hidden" name="servicePhotoId" value={foto.id} />
                      <button
                        type="submit"
                        className="w-full rounded-md bg-stone-900 px-2 py-1 text-xs font-medium text-white hover:bg-stone-700"
                      >
                        Publicar no portfólio
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <AdicionarPortfolioForm action={adicionarPortfolioAction} bookingsElegiveis={bookingsElegiveis} />

        <div className="mt-5">
          <PortfolioFeed items={portfolioFeed} />
        </div>
      </section>
    </div>
  );
}
