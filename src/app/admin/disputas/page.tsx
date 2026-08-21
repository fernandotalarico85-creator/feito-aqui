import Image from "next/image";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  resolverDisputaAction,
  resolverContestacaoStrikeAction,
  resolverContestacaoConclusaoAction,
} from "./actions";

const GRAVIDADE_LABEL: Record<string, string> = {
  MEDIA: "Média",
  GRAVE: "Grave",
  GRAVISSIMA: "Gravíssima",
};

export default async function DisputasPage() {
  await exigirUsuario("ADMIN");

  const [reviews, strikes, conclusoes] = await Promise.all([
    prisma.review.findMany({
      where: { statusContestacao: "EM_ANALISE" },
      include: {
        booking: {
          include: {
            budget: {
              include: {
                worker: { include: { user: true } },
                serviceRequest: {
                  include: { category: true, clientProfile: { include: { user: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { criadoEm: "asc" },
    }),
    prisma.strike.findMany({
      where: { statusContestacao: "EM_ANALISE" },
      include: { worker: { include: { user: true } }, clientProfile: { include: { user: true } } },
      orderBy: { dataOcorrencia: "asc" },
    }),
    prisma.booking.findMany({
      where: { statusConclusao: "CONTESTADO" },
      include: {
        budget: {
          include: {
            worker: { include: { user: true } },
            serviceRequest: {
              include: { category: true, clientProfile: { include: { user: true } } },
            },
          },
        },
        servicePhotos: true,
      },
      orderBy: { contestacaoConclusaoDataEnvio: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Disputas</h1>
      <p className="mt-1 text-sm text-stone-500">
        Avaliações contestadas pelo profissional — decida se a nota fica como está ou se a
        contestação procede.
      </p>

      {reviews.length === 0 ? (
        <p className="mt-6 text-stone-600">Nenhuma disputa pendente no momento.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {reviews.map((review) => {
            const worker = review.booking.budget.worker.user;
            const cliente = review.booking.budget.serviceRequest.clientProfile.user;
            const categoria = review.booking.budget.serviceRequest.category.nome;
            const fotosReview: string[] = review.fotosJson ? JSON.parse(review.fotosJson) : [];
            const fotosReplica: string[] = review.replicaWorkerFotosJson
              ? JSON.parse(review.replicaWorkerFotosJson)
              : [];

            return (
              <li key={review.id} className="rounded-lg border border-stone-200 bg-white p-4">
                <p className="text-xs text-stone-400">
                  {categoria} · Cliente: {cliente.nome} · Worker: {worker.nome}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div className="rounded-md bg-stone-50 p-3">
                    <p className="text-xs font-semibold text-stone-500">Avaliação do cliente</p>
                    <p className="mt-1 text-lg font-semibold text-amber-600">★ {review.nota}</p>
                    {review.depoimento && (
                      <p className="mt-1 text-sm text-stone-700">{review.depoimento}</p>
                    )}
                    {fotosReview.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {fotosReview.map((url) => (
                          <div key={url} className="relative h-14 w-14 overflow-hidden rounded-md">
                            <Image src={url} alt="Foto" fill unoptimized className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-md bg-stone-50 p-3">
                    <p className="text-xs font-semibold text-stone-500">Réplica do worker</p>
                    <p className="mt-1 text-sm text-stone-700">{review.replicaWorkerTexto}</p>
                    {fotosReplica.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {fotosReplica.map((url) => (
                          <div key={url} className="relative h-14 w-14 overflow-hidden rounded-md">
                            <Image src={url} alt="Foto" fill unoptimized className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    {review.replicaWorkerDataEnvio && (
                      <p className="mt-2 text-xs text-stone-400">
                        Enviada em {review.replicaWorkerDataEnvio.toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                </div>

                <form action={resolverDisputaAction} className="mt-3 flex gap-2">
                  <input type="hidden" name="reviewId" value={review.id} />
                  <button
                    type="submit"
                    name="decisao"
                    value="MANTIDA"
                    className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
                  >
                    Manter nota
                  </button>
                  <button
                    type="submit"
                    name="decisao"
                    value="REVERTIDA"
                    className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
                  >
                    Reverter nota (estorna tokens)
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mt-10 text-lg font-semibold text-stone-900">Strikes contestados</h2>
      <p className="mt-1 text-sm text-stone-500">
        Strikes contestados pelo alvo (worker ou cliente) — gravíssimos nunca chegam aqui, não
        têm direito a contestação.
      </p>

      {strikes.length === 0 ? (
        <p className="mt-4 text-stone-600">Nenhuma contestação de strike pendente.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {strikes.map((strike) => {
            const fotosReplica: string[] = strike.replicaFotosJson
              ? JSON.parse(strike.replicaFotosJson)
              : [];
            const alvo = strike.worker?.user.nome ?? strike.clientProfile?.user.nome ?? "—";

            return (
              <li key={strike.id} className="rounded-lg border border-stone-200 bg-white p-4">
                <p className="text-xs text-stone-400">
                  {alvo} ({strike.worker ? "worker" : "cliente"}) ·{" "}
                  {GRAVIDADE_LABEL[strike.gravidade]}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div className="rounded-md bg-stone-50 p-3">
                    <p className="text-xs font-semibold text-stone-500">Strike registrado</p>
                    <p className="mt-1 text-sm text-stone-700">{strike.tipoInfracao}</p>
                    {strike.observacao && (
                      <p className="mt-1 text-xs text-stone-500">{strike.observacao}</p>
                    )}
                    <p className="mt-1 text-xs text-stone-400">
                      {strike.dataOcorrencia.toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <div className="rounded-md bg-stone-50 p-3">
                    <p className="text-xs font-semibold text-stone-500">Contestação</p>
                    <p className="mt-1 text-sm text-stone-700">{strike.replicaTexto}</p>
                    {fotosReplica.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {fotosReplica.map((url) => (
                          <div key={url} className="relative h-14 w-14 overflow-hidden rounded-md">
                            <Image src={url} alt="Foto" fill unoptimized className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <form action={resolverContestacaoStrikeAction} className="mt-3 flex gap-2">
                  <input type="hidden" name="strikeId" value={strike.id} />
                  <button
                    type="submit"
                    name="decisao"
                    value="MANTIDA"
                    className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
                  >
                    Manter strike
                  </button>
                  <button
                    type="submit"
                    name="decisao"
                    value="REVERTIDA"
                    className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
                  >
                    Revogar strike
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mt-10 text-lg font-semibold text-stone-900">Conclusões contestadas</h2>
      <p className="mt-1 text-sm text-stone-500">
        Cliente contestou a entrega em vez de confirmar (Seção 3.8) — a parcela final do
        repasse fica retida até essa decisão.
      </p>

      {conclusoes.length === 0 ? (
        <p className="mt-4 text-stone-600">Nenhuma conclusão contestada no momento.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {conclusoes.map((booking) => {
            const worker = booking.budget.worker.user;
            const cliente = booking.budget.serviceRequest.clientProfile.user;
            const categoria = booking.budget.serviceRequest.category.nome;

            return (
              <li key={booking.id} className="rounded-lg border border-stone-200 bg-white p-4">
                <p className="text-xs text-stone-400">
                  {categoria} · Cliente: {cliente.nome} · Worker: {worker.nome}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div className="rounded-md bg-stone-50 p-3">
                    <p className="text-xs font-semibold text-stone-500">
                      Foto(s) enviada(s) pelo worker
                    </p>
                    {booking.servicePhotos.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {booking.servicePhotos.map((foto) => (
                          <div key={foto.id} className="relative h-14 w-14 overflow-hidden rounded-md">
                            <Image src={foto.url} alt="Foto" fill unoptimized className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-md bg-stone-50 p-3">
                    <p className="text-xs font-semibold text-stone-500">Contestação do cliente</p>
                    <p className="mt-1 text-sm text-stone-700">
                      {booking.contestacaoConclusaoTexto}
                    </p>
                    {booking.contestacaoConclusaoDataEnvio && (
                      <p className="mt-2 text-xs text-stone-400">
                        Enviada em{" "}
                        {booking.contestacaoConclusaoDataEnvio.toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                </div>

                <form action={resolverContestacaoConclusaoAction} className="mt-3 flex gap-2">
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <button
                    type="submit"
                    name="decisao"
                    value="MANTER_CONTESTACAO"
                    className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
                  >
                    Manter contestação
                  </button>
                  <button
                    type="submit"
                    name="decisao"
                    value="CONFIRMAR_ENTREGA"
                    className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
                  >
                    Confirmar entrega (libera repasse)
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
