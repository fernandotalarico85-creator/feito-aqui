import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { alternarVerificacaoAction, decidirDocumentoAction } from "./actions";

const TIPO_DOCUMENTO_LABEL: Record<string, string> = {
  CNH: "CNH",
  RG_COM_CPF: "RG (com CPF)",
  RG_E_CPF_SEPARADOS: "RG + CPF (separados)",
};

const DOCUMENTO_STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Documento em análise",
  APROVADO: "Documento aprovado",
  REJEITADO: "Documento rejeitado",
};

const DOCUMENTO_STATUS_CLASSE: Record<string, string> = {
  PENDENTE: "bg-amber-100 text-amber-700",
  APROVADO: "bg-emerald-100 text-emerald-700",
  REJEITADO: "bg-red-100 text-red-700",
};

export default async function AdminWorkersPage() {
  await exigirUsuario("ADMIN");

  const workers = await prisma.workerProfile.findMany({
    include: { user: true, categorias: true },
    orderBy: [{ statusVerificacao: "asc" }, { user: { nome: "asc" } }],
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Aprovar Workers</h1>
      <p className="mt-1 text-sm text-stone-500">
        Verificação manual (Seção 4 do contexto — sem KYC real na v0.1): aprove um worker para
        que ele passe a aparecer nos resultados de ranking dos clientes. O documento de
        identidade (Seção 3.9) é uma revisão separada, também manual.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {workers.map((worker) => (
          <li key={worker.id} className="rounded-lg border border-stone-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-900">
                  {worker.user.nome} {worker.user.sobrenome}
                </p>
                <p className="font-mono text-xs text-stone-400">{worker.user.idCadastro}</p>
                <p className="text-xs text-stone-500">
                  {worker.user.email} · {worker.categorias.map((c) => c.nome).join(", ") || "sem categoria"}
                </p>
                <p className="text-xs text-stone-400">
                  Nota {worker.notaMediaRecente > 0 ? worker.notaMediaRecente.toFixed(1) : "—"} ·{" "}
                  {worker.volumeConcluidos} serviços concluídos
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    worker.statusVerificacao === "VERIFICADO"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {worker.statusVerificacao === "VERIFICADO" ? "Verificado" : "Pendente"}
                </span>
                <form action={alternarVerificacaoAction}>
                  <input type="hidden" name="workerProfileId" value={worker.id} />
                  <input type="hidden" name="statusAtual" value={worker.statusVerificacao} />
                  <button
                    type="submit"
                    className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
                  >
                    {worker.statusVerificacao === "VERIFICADO" ? "Revogar" : "Aprovar"}
                  </button>
                </form>
              </div>
            </div>

            <div className="mt-3 rounded-md bg-stone-50 p-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${DOCUMENTO_STATUS_CLASSE[worker.documentoStatus]}`}
                  >
                    {DOCUMENTO_STATUS_LABEL[worker.documentoStatus]}
                  </span>
                  <span className="ml-2 text-xs text-stone-500">
                    {TIPO_DOCUMENTO_LABEL[worker.tipoDocumento]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <a
                    href={worker.documentoUrl1}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-600 underline"
                  >
                    Ver documento 1
                  </a>
                  {worker.documentoUrl2 && (
                    <a
                      href={worker.documentoUrl2}
                      target="_blank"
                      rel="noreferrer"
                      className="text-stone-600 underline"
                    >
                      Ver documento 2
                    </a>
                  )}
                </div>
              </div>
              <form action={decidirDocumentoAction} className="mt-2 flex gap-2">
                <input type="hidden" name="workerProfileId" value={worker.id} />
                <button
                  type="submit"
                  name="decisao"
                  value="APROVADO"
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
                >
                  Aprovar documento
                </button>
                <button
                  type="submit"
                  name="decisao"
                  value="REJEITADO"
                  className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  Rejeitar documento
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
