import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listarTransacoesCarteira } from "@/lib/carteira";
import { VALOR_REAIS_POR_AVALIACAO, TOKENS_POR_AVALIACAO } from "@/lib/config";
import { simularLiberacaoAction } from "./actions";

const TIPO_LABEL: Record<string, string> = {
  CREDITO_AVALIACAO: "Crédito por avaliação",
  ESTORNO: "Estorno",
  USO_EM_SERVICO: "Uso em serviço",
  REEMBOLSO_NO_SHOW: "Reembolso",
};

const STATUS_LABEL: Record<string, string> = {
  CARENCIA: "Em carência",
  LIBERADO: "Liberado",
  USADO: "Usado",
  ESTORNADO: "Estornado",
};

const STATUS_CLASSE: Record<string, string> = {
  CARENCIA: "bg-amber-100 text-amber-700",
  LIBERADO: "bg-emerald-100 text-emerald-700",
  USADO: "bg-stone-100 text-stone-600",
  ESTORNADO: "bg-red-100 text-red-700",
};

const VALOR_REAL_POR_TOKEN = VALOR_REAIS_POR_AVALIACAO / TOKENS_POR_AVALIACAO;

export default async function CarteiraPage() {
  const usuario = await exigirUsuario("CLIENTE");
  const clientProfile = await prisma.clientProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  const transacoes = await listarTransacoesCarteira(clientProfile.id);

  const saldoDisponivel = transacoes
    .filter((t) => t.status === "LIBERADO")
    .reduce((soma, t) => soma + t.valorTokens, 0);
  const saldoCarencia = transacoes
    .filter((t) => t.status === "CARENCIA")
    .reduce((soma, t) => soma + t.valorTokens, 0);
  const totalReembolsado = transacoes
    .filter((t) => t.tipo === "REEMBOLSO_NO_SHOW")
    .reduce((soma, t) => soma + t.valorReais, 0);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-stone-900">Minha carteira</h1>

      <div className={`mt-6 grid gap-4 ${totalReembolsado > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-2xl font-semibold text-stone-900">{saldoDisponivel} tokens</p>
          <p className="text-sm text-stone-500">
            disponível · R$ {(saldoDisponivel * VALOR_REAL_POR_TOKEN).toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-2xl font-semibold text-amber-600">{saldoCarencia} tokens</p>
          <p className="text-sm text-stone-500">
            em carência · R$ {(saldoCarencia * VALOR_REAL_POR_TOKEN).toFixed(2)}
          </p>
        </div>
        {totalReembolsado > 0 && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-2xl font-semibold text-emerald-700">
              R$ {totalReembolsado.toFixed(2)}
            </p>
            <p className="text-sm text-emerald-700">reembolsados (no-show / cancelamento)</p>
          </div>
        )}
      </div>

      <h2 className="mt-8 text-sm font-semibold text-stone-900">Histórico</h2>

      {transacoes.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">
          Nenhum crédito ainda — avalie um serviço concluído para ganhar tokens.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {transacoes.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3"
            >
              <div>
                <p className="text-sm font-medium text-stone-900">
                  {t.descricao || TIPO_LABEL[t.tipo] || t.tipo}
                </p>
                <p className="text-xs text-stone-500">
                  {t.valorTokens > 0 && <>{t.valorTokens} tokens · </>}R${" "}
                  {t.valorReais.toFixed(2)} · {t.criadoEm.toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSE[t.status]}`}
                >
                  {STATUS_LABEL[t.status]}
                </span>
                {t.status === "CARENCIA" && (
                  <form action={simularLiberacaoAction}>
                    <input type="hidden" name="transacaoId" value={t.id} />
                    <button type="submit" className="text-xs text-stone-400 underline">
                      (Teste) simular fim da carência
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
