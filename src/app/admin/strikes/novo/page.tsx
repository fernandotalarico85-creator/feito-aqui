import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NovoStrikeForm from "./NovoStrikeForm";

const MENSAGENS_ERRO: Record<string, string> = {
  dados_invalidos: "Preencha o alvo, a infração e a gravidade corretamente.",
};

export default async function NovoStrikePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  await exigirUsuario("ADMIN");
  const { erro } = await searchParams;

  const [workers, clientes, bookingsSemCheckIn] = await Promise.all([
    prisma.workerProfile.findMany({
      include: { user: true },
      orderBy: { user: { nome: "asc" } },
    }),
    prisma.clientProfile.findMany({
      include: { user: true },
      orderBy: { user: { nome: "asc" } },
    }),
    prisma.booking.findMany({
      where: { status: { in: ["FECHADO", "EM_ANDAMENTO"] }, checkInHorario: null },
      include: {
        budget: { include: { serviceRequest: { include: { category: true } } } },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold text-stone-900">Registrar strike</h1>
      <p className="mt-1 text-sm text-stone-500">
        Escolha o tipo de infração — a gravidade e a ação sugerida da Seção 3.6 do contexto são
        preenchidas automaticamente.
      </p>

      {erro && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {MENSAGENS_ERRO[erro] ?? "Não foi possível registrar o strike."}
        </p>
      )}

      <NovoStrikeForm
        workers={workers.map((w) => ({ id: w.id, nome: w.user.nome }))}
        clientes={clientes.map((c) => ({ id: c.id, nome: c.user.nome }))}
        bookingsSemCheckIn={bookingsSemCheckIn.map((b) => ({
          id: b.id,
          workerId: b.budget.workerId,
          label: `${b.budget.serviceRequest.numeroOS} — ${b.budget.serviceRequest.category.nome} — fechado em ${b.criadoEm.toLocaleDateString("pt-BR")}`,
        }))}
      />
    </div>
  );
}
