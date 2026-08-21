import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listarWorkersParaSuspensao } from "@/lib/penalidades";
import { confirmarConclusoesVencidas } from "@/lib/confirmacaoConclusao";

export default async function AdminHomePage() {
  const usuario = await exigirUsuario("ADMIN");

  // Sweep de confirmação automática (Seção 3.8) — protótipo não tem scheduler real,
  // então roda a cada carregamento do dashboard admin (mínimo pedido pelo usuário).
  await confirmarConclusoesVencidas();

  const [
    reviewsContestadas,
    strikesContestados,
    conclusoesContestadas,
    totalStrikes,
    workersParaSuspensao,
    workersPendentes,
    repassesPendentes,
  ] = await Promise.all([
    prisma.review.count({ where: { statusContestacao: "EM_ANALISE" } }),
    prisma.strike.count({ where: { statusContestacao: "EM_ANALISE" } }),
    prisma.booking.count({ where: { statusConclusao: "CONTESTADO" } }),
    prisma.strike.count(),
    listarWorkersParaSuspensao(),
    prisma.workerProfile.count({ where: { statusVerificacao: "PENDENTE" } }),
    prisma.repasseWorker.count({ where: { status: "EM_ANALISE" } }),
  ]);
  const disputasPendentes = reviewsContestadas + strikesContestados + conclusoesContestadas;

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Olá, {usuario.nome}</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/workers"
          className="rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400"
        >
          <p className="text-2xl font-semibold text-stone-900">{workersPendentes}</p>
          <p className="text-sm text-stone-500">workers pendentes de verificação</p>
        </Link>
        <Link
          href="/admin/disputas"
          className="rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400"
        >
          <p className="text-2xl font-semibold text-stone-900">{disputasPendentes}</p>
          <p className="text-sm text-stone-500">disputas aguardando decisão</p>
        </Link>
        <Link
          href="/admin/strikes"
          className="rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400"
        >
          <p className="text-2xl font-semibold text-stone-900">{totalStrikes}</p>
          <p className="text-sm text-stone-500">strikes registrados</p>
        </Link>
        <Link
          href="/admin/repasses"
          className="rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400"
        >
          <p className="text-2xl font-semibold text-stone-900">{repassesPendentes}</p>
          <p className="text-sm text-stone-500">justificativas de atraso pendentes</p>
        </Link>
        <div
          className={`rounded-lg border p-4 ${
            workersParaSuspensao.length > 0
              ? "border-red-300 bg-red-50"
              : "border-stone-200 bg-white"
          }`}
        >
          <p
            className={`text-2xl font-semibold ${
              workersParaSuspensao.length > 0 ? "text-red-700" : "text-stone-900"
            }`}
          >
            {workersParaSuspensao.length}
          </p>
          <p className="text-sm text-stone-500">
            worker(s) com 3+ strikes médios nos últimos 6 meses
          </p>
        </div>
      </div>
    </div>
  );
}
