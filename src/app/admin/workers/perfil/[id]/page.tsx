import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import StatusBadge from "@/components/ui/StatusBadge";

const TIPO_DOCUMENTO_LABEL: Record<string, string> = {
  CNH: "CNH",
  RG_COM_CPF: "RG (com CPF)",
  RG_E_CPF_SEPARADOS: "RG + CPF (separados)",
};

const GRAVIDADE_LABEL: Record<string, string> = { MEDIA: "Média", GRAVE: "Grave", GRAVISSIMA: "Gravíssima" };
const GRAVIDADE_CLASSE: Record<string, string> = {
  MEDIA: "bg-amber-100 text-amber-700",
  GRAVE: "bg-amber-200 text-amber-800",
  GRAVISSIMA: "bg-red-100 text-red-700",
};

/** Detalhe somente-leitura de um worker (Prompt 24) — sem os botões de
 * aprovar/rejeitar, que continuam exclusivos de "Aprovar Workers" (/admin/workers). */
export default async function AdminWorkerDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirUsuario("ADMIN");
  const { id } = await params;

  const worker = await prisma.workerProfile.findUnique({
    where: { id },
    include: {
      user: true,
      categorias: true,
      strikes: { orderBy: { dataOcorrencia: "desc" } },
    },
  });
  if (!worker) notFound();

  return (
    <div>
      <Link href="/admin/workers/perfil" className="text-sm text-stone-500 hover:underline">
        ← Workers cadastrados
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-stone-900">
          {worker.user.nome} {worker.user.sobrenome}
        </h1>
        <StatusBadge
          label={worker.statusVerificacao === "VERIFICADO" ? "Verificado" : "Pendente"}
          tone={worker.statusVerificacao === "VERIFICADO" ? "success" : "alert"}
        />
      </div>
      <p className="font-mono text-sm text-stone-500">{worker.user.idCadastro}</p>

      <section className="mt-6 rounded-lg border border-stone-200 bg-card p-4">
        <h2 className="text-base font-extrabold text-primary">Identificação</h2>
        <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-stone-500">CPF</dt>
          <dd className="text-right text-stone-900">{worker.user.cpf}</dd>
          <dt className="text-stone-500">E-mail</dt>
          <dd className="text-right text-stone-900">{worker.user.email}</dd>
          <dt className="text-stone-500">Categorias</dt>
          <dd className="text-right text-stone-900">
            {worker.categorias.map((c) => c.nome).join(", ") || "—"}
          </dd>
        </dl>
      </section>

      <section className="mt-4 rounded-lg border border-stone-200 bg-card p-4">
        <h2 className="text-base font-extrabold text-primary">Endereço</h2>
        <p className="mt-2 text-sm text-stone-900">
          {worker.enderecoLogradouro}, {worker.enderecoNumero}
          {worker.enderecoComplemento ? ` — ${worker.enderecoComplemento}` : ""} ·{" "}
          {worker.enderecoBairro}, {worker.enderecoCidade}/{worker.enderecoEstado} · CEP{" "}
          {worker.enderecoCep}
        </p>
      </section>

      <section className="mt-4 rounded-lg border border-stone-200 bg-card p-4">
        <h2 className="text-base font-extrabold text-primary">Desempenho</h2>
        <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-stone-500">Nota média</dt>
          <dd className="text-right text-stone-900">
            {worker.notaMediaRecente > 0 ? worker.notaMediaRecente.toFixed(1) : "—"}
          </dd>
          <dt className="text-stone-500">Serviços concluídos</dt>
          <dd className="text-right text-stone-900">{worker.volumeConcluidos}</dd>
          <dt className="text-stone-500">Conclusão no prazo</dt>
          <dd className="text-right text-stone-900">{(worker.taxaConclusaoPrazo * 100).toFixed(0)}%</dd>
          <dt className="text-stone-500">Comparecimento</dt>
          <dd className="text-right text-stone-900">{(worker.taxaComparecimento * 100).toFixed(0)}%</dd>
          <dt className="text-stone-500">Tempo médio de resposta</dt>
          <dd className="text-right text-stone-900">{worker.tempoMedioRespostaMin}min</dd>
          <dt className="text-stone-500">Destaque pago</dt>
          <dd className="text-right text-stone-900">{worker.destaquePago ? "Ativo" : "Não"}</dd>
        </dl>
      </section>

      <section className="mt-4 rounded-lg border border-stone-200 bg-card p-4">
        <h2 className="text-base font-extrabold text-primary">Documento de verificação</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <StatusBadge
            label={
              worker.documentoStatus === "APROVADO"
                ? "Aprovado"
                : worker.documentoStatus === "REJEITADO"
                  ? "Rejeitado"
                  : "Em análise"
            }
            tone={
              worker.documentoStatus === "APROVADO"
                ? "success"
                : worker.documentoStatus === "REJEITADO"
                  ? "alert"
                  : "neutral"
            }
          />
          <span className="text-stone-500">{TIPO_DOCUMENTO_LABEL[worker.tipoDocumento]}</span>
          <a href={worker.documentoUrl1} target="_blank" rel="noreferrer" className="text-secondary underline">
            Ver documento 1
          </a>
          {worker.documentoUrl2 && (
            <a href={worker.documentoUrl2} target="_blank" rel="noreferrer" className="text-secondary underline">
              Ver documento 2
            </a>
          )}
        </div>
        <p className="mt-2 text-xs text-stone-400">
          Aprovar/rejeitar continua em{" "}
          <Link href="/admin/workers" className="underline">
            Aprovar Workers
          </Link>
          .
        </p>
      </section>

      <section className="mt-4 rounded-lg border border-stone-200 bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-primary">Portfólio</h2>
          <Link href="/admin/workers/portfolio" className="text-xs text-secondary underline">
            Ver portfólios
          </Link>
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-stone-200 bg-card p-4">
        <h2 className="text-base font-extrabold text-primary">Strikes ({worker.strikes.length})</h2>
        {worker.strikes.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Nenhum strike.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {worker.strikes.map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <span className="text-stone-700">
                  {s.tipoInfracao} · {s.dataOcorrencia.toLocaleDateString("pt-BR")}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${GRAVIDADE_CLASSE[s.gravidade]}`}
                >
                  {GRAVIDADE_LABEL[s.gravidade]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
