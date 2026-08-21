import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { alternarVerificacaoAction } from "./actions";

export default async function AdminWorkersPage() {
  await exigirUsuario("ADMIN");

  const workers = await prisma.workerProfile.findMany({
    include: { user: true, categorias: true },
    orderBy: [{ statusVerificacao: "asc" }, { user: { nome: "asc" } }],
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Workers</h1>
      <p className="mt-1 text-sm text-stone-500">
        Verificação manual (Seção 4 do contexto — sem KYC real na v0.1): aprove um worker para
        que ele passe a aparecer nos resultados de ranking dos clientes.
      </p>

      <ul className="mt-6 flex flex-col gap-2">
        {workers.map((worker) => (
          <li
            key={worker.id}
            className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3"
          >
            <div>
              <p className="text-sm font-medium text-stone-900">{worker.user.nome}</p>
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
          </li>
        ))}
      </ul>
    </div>
  );
}
