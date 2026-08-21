import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STRIKE_JANELA_CONTESTACAO_HORAS } from "@/lib/config";
import { strikeEhContestavel } from "@/lib/strikes";
import { contestarStrikeAction } from "./actions";

const GRAVIDADE_LABEL: Record<string, string> = {
  MEDIA: "Média",
  GRAVE: "Grave",
  GRAVISSIMA: "Gravíssima",
};

const GRAVIDADE_CLASSE: Record<string, string> = {
  MEDIA: "bg-amber-100 text-amber-700",
  GRAVE: "bg-orange-100 text-orange-700",
  GRAVISSIMA: "bg-red-100 text-red-700",
};

const CONTESTACAO_LABEL: Record<string, string> = {
  NENHUMA: "",
  EM_ANALISE: "Contestação em análise pelo admin",
  MANTIDA: "Contestação analisada — strike mantido",
  REVERTIDA: "Contestação aceita — strike revogado",
};

const MENSAGENS_ERRO: Record<string, string> = {
  texto_obrigatorio: "Escreva o texto da sua contestação.",
  nao_contestavel: "Esse strike não pode mais ser contestado (prazo, gravidade ou já em análise).",
};

export default async function MeusStrikesPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuario = await exigirUsuario("WORKER");
  const { erro } = await searchParams;

  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  const strikes = await prisma.strike.findMany({
    where: { workerId: worker.id },
    orderBy: { dataOcorrencia: "desc" },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Meus strikes</h1>
      <p className="mt-1 text-sm text-stone-500">
        Você pode contestar um strike até {STRIKE_JANELA_CONTESTACAO_HORAS}h depois do registro
        — exceto strikes de gravidade gravíssima (fraude/segurança), que não têm direito a
        contestação.
      </p>

      {erro && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {MENSAGENS_ERRO[erro] ?? "Não foi possível enviar a contestação."}
        </p>
      )}

      {strikes.length === 0 ? (
        <p className="mt-6 text-stone-600">Nenhum strike registrado. 🎉</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {strikes.map((strike) => (
            <li key={strike.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-stone-900">{strike.tipoInfracao}</p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${GRAVIDADE_CLASSE[strike.gravidade]}`}
                >
                  {GRAVIDADE_LABEL[strike.gravidade]}
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                {strike.dataOcorrencia.toLocaleDateString("pt-BR")}
                {strike.observacao && <> — {strike.observacao}</>}
              </p>

              {strike.statusContestacao !== "NENHUMA" ? (
                <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {CONTESTACAO_LABEL[strike.statusContestacao]}
                </p>
              ) : strikeEhContestavel(strike) ? (
                <form action={contestarStrikeAction} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="strikeId" value={strike.id} />
                  <textarea
                    name="texto"
                    required
                    rows={2}
                    placeholder="Por que você discorda desse strike?"
                    className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  />
                  <input name="foto" type="file" accept="image/*" className="text-xs" />
                  <button
                    type="submit"
                    className="self-start rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
                  >
                    Contestar
                  </button>
                </form>
              ) : (
                <p className="mt-2 text-xs text-stone-400">
                  {strike.gravidade === "GRAVISSIMA"
                    ? "Strikes gravíssimos não têm direito a contestação."
                    : `O prazo de ${STRIKE_JANELA_CONTESTACAO_HORAS}h pra contestar esse strike já passou.`}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
