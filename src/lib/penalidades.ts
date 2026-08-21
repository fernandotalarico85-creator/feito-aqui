import "server-only";
import { prisma } from "./db";
import { STRIKES_MEDIA_LIMITE_SUSPENSAO, STRIKES_MEDIA_JANELA_MESES } from "./config";

/** Workers com 3+ strikes de gravidade média nos últimos 6 meses — suspensão para
 * revisão manual (Seção 3.6). Só conta strikes ainda não contestados com sucesso. */
export async function listarWorkersParaSuspensao() {
  const desde = new Date();
  desde.setMonth(desde.getMonth() - STRIKES_MEDIA_JANELA_MESES);

  const strikes = await prisma.strike.findMany({
    where: {
      gravidade: "MEDIA",
      dataOcorrencia: { gte: desde },
      workerId: { not: null },
      statusContestacao: { not: "REVERTIDA" },
    },
    include: { worker: { include: { user: true } } },
  });

  const porWorker = new Map<string, { nome: string; count: number }>();
  for (const strike of strikes) {
    if (!strike.worker) continue;
    const atual = porWorker.get(strike.workerId!) ?? { nome: strike.worker.user.nome, count: 0 };
    atual.count += 1;
    porWorker.set(strike.workerId!, atual);
  }

  return Array.from(porWorker.entries())
    .filter(([, v]) => v.count >= STRIKES_MEDIA_LIMITE_SUSPENSAO)
    .map(([workerId, v]) => ({ workerId, nome: v.nome, count: v.count }));
}
