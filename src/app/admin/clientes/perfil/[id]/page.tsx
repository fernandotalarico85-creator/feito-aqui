import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import StatusBadge from "@/components/ui/StatusBadge";

const STATUS_LABEL: Record<string, string> = {
  TRIAGEM: "Em triagem",
  AGUARDANDO_ORCAMENTO: "Aguardando orçamentos",
  ORCADO: "Orçamento recebido",
  FECHADO: "Fechado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const STATUS_TONE: Record<string, "success" | "alert" | "secondary" | "neutral"> = {
  TRIAGEM: "alert",
  AGUARDANDO_ORCAMENTO: "alert",
  ORCADO: "alert",
  FECHADO: "secondary",
  EM_ANDAMENTO: "secondary",
  CONCLUIDO: "success",
  CANCELADO: "neutral",
};

const GRAVIDADE_LABEL: Record<string, string> = { MEDIA: "Média", GRAVE: "Grave", GRAVISSIMA: "Gravíssima" };
const GRAVIDADE_CLASSE: Record<string, string> = {
  MEDIA: "bg-amber-100 text-amber-700",
  GRAVE: "bg-amber-200 text-amber-800",
  GRAVISSIMA: "bg-red-100 text-red-700",
};

/** Detalhe somente-leitura de um cliente (Prompt 24) — sem nenhuma ação de editar. */
export default async function AdminClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirUsuario("ADMIN");
  const { id } = await params;

  const cliente = await prisma.clientProfile.findUnique({
    where: { id },
    include: {
      user: true,
      serviceRequests: { orderBy: { criadoEm: "desc" } },
      strikes: { orderBy: { dataOcorrencia: "desc" } },
      cancelamentosTardios: { orderBy: { criadoEm: "desc" } },
    },
  });
  if (!cliente) notFound();

  return (
    <div>
      <Link href="/admin/clientes/perfil" className="text-sm text-stone-500 hover:underline">
        ← Clientes cadastrados
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-stone-900">
        {cliente.user.nome} {cliente.user.sobrenome}
      </h1>
      <p className="font-mono text-sm text-stone-500">{cliente.user.idCadastro}</p>

      <section className="mt-6 rounded-lg border border-stone-200 bg-card p-4 shadow-sm">
        <h2 className="text-base font-extrabold text-primary">Identificação</h2>
        <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-stone-500">CPF</dt>
          <dd className="text-right text-stone-900">{cliente.user.cpf}</dd>
          <dt className="text-stone-500">E-mail</dt>
          <dd className="text-right text-stone-900">{cliente.user.email}</dd>
          <dt className="text-stone-500">Cadastrado em</dt>
          <dd className="text-right text-stone-900">
            {cliente.user.criadoEm.toLocaleDateString("pt-BR")}
          </dd>
        </dl>
      </section>

      <section className="mt-4 rounded-lg border border-stone-200 bg-card p-4 shadow-sm">
        <h2 className="text-base font-extrabold text-primary">Endereço</h2>
        <p className="mt-2 text-sm text-stone-900">
          {cliente.enderecoLogradouro}, {cliente.enderecoNumero}
          {cliente.enderecoComplemento ? ` — ${cliente.enderecoComplemento}` : ""} ·{" "}
          {cliente.enderecoBairro}, {cliente.enderecoCidade}/{cliente.enderecoEstado} · CEP{" "}
          {cliente.enderecoCep}
        </p>
      </section>

      <section className="mt-4 rounded-lg border border-stone-200 bg-card p-4 shadow-sm">
        <h2 className="text-base font-extrabold text-primary">Pedidos ({cliente.serviceRequests.length})</h2>
        {cliente.serviceRequests.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Nenhum pedido.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {cliente.serviceRequests.map((sr) => (
              <li key={sr.id} className="flex items-center justify-between">
                <span className="font-mono text-xs text-stone-500">{sr.numeroOS}</span>
                <StatusBadge label={STATUS_LABEL[sr.status] ?? sr.status} tone={STATUS_TONE[sr.status] ?? "neutral"} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-lg border border-stone-200 bg-card p-4 shadow-sm">
        <h2 className="text-base font-extrabold text-primary">Strikes ({cliente.strikes.length})</h2>
        {cliente.strikes.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Nenhum strike.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {cliente.strikes.map((s) => (
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

      {cliente.cancelamentosTardios.length > 0 && (
        <section className="mt-4 rounded-lg border border-stone-200 bg-card p-4 shadow-sm">
          <h2 className="text-base font-extrabold text-primary">
            Cancelamentos tardios ({cliente.cancelamentosTardios.length})
          </h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-stone-700">
            {cliente.cancelamentosTardios.map((c) => (
              <li key={c.id}>{c.criadoEm.toLocaleDateString("pt-BR")}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
