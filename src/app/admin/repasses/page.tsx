import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decidirRepasseAction } from "./actions";

const MENSAGENS_ERRO: Record<string, string> = {
  dados_invalidos: "Informe um número de dias válido (maior que zero).",
};

export default async function RepassesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  await exigirUsuario("ADMIN");
  const { erro } = await searchParams;

  const repasses = await prisma.repasseWorker.findMany({
    where: { status: "EM_ANALISE" },
    include: {
      workerProfile: { include: { user: true } },
      booking: {
        include: { budget: { include: { serviceRequest: { include: { category: true } } } } },
      },
    },
    orderBy: { justificativaDataEnvio: "asc" },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Justificativas de atraso</h1>
      <p className="mt-1 text-sm text-stone-500">
        Check-ins fora da tolerância de 30min com justificativa enviada — decida se libera a
        parcela de pontualidade (30%) na hora, agenda pra daqui a alguns dias, ou deixa cair no
        fallback (libera sozinha junto com a conclusão do serviço).
      </p>

      {erro && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {MENSAGENS_ERRO[erro] ?? "Não foi possível concluir a decisão."}
        </p>
      )}

      {repasses.length === 0 ? (
        <p className="mt-6 text-stone-600">Nenhuma justificativa pendente no momento.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {repasses.map((r) => (
            <li key={r.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <p className="text-xs text-stone-400">
                {r.workerProfile.user.nome} · {r.booking.budget.serviceRequest.category.nome} · R${" "}
                {r.valor.toFixed(2)}
              </p>
              <p className="mt-2 text-sm text-stone-700">&ldquo;{r.justificativaTexto}&rdquo;</p>
              {r.justificativaDataEnvio && (
                <p className="mt-1 text-xs text-stone-400">
                  Enviada em {r.justificativaDataEnvio.toLocaleDateString("pt-BR")}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <form action={decidirRepasseAction}>
                  <input type="hidden" name="repasseId" value={r.id} />
                  <input type="hidden" name="modo" value="AGORA" />
                  <button
                    type="submit"
                    className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
                  >
                    Liberar agora
                  </button>
                </form>
                <form action={decidirRepasseAction} className="flex items-center gap-1.5">
                  <input type="hidden" name="repasseId" value={r.id} />
                  <input type="hidden" name="modo" value="DIAS" />
                  <input
                    type="number"
                    name="dias"
                    min="1"
                    placeholder="dias"
                    required
                    className="w-16 rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
                  >
                    Liberar em X dias
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
