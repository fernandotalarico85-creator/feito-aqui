import "server-only";
import { prisma } from "./db";

/**
 * Recalcula a nota média recente de um worker (Seção 3.3 — "últimos 10 serviços"),
 * ignorando reviews em disputa (EM_ANALISE) ou revertidas (Seção 3.5 — "enquanto
 * em_analise, a nota não conta no ranking"; nota revertida também não conta).
 * Chame sempre que uma review for criada ou tiver o status de contestação alterado.
 */
export async function recalcularNotaMediaWorker(workerProfileId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      booking: { budget: { workerId: workerProfileId } },
      statusContestacao: { in: ["NENHUMA", "MANTIDA"] },
    },
    orderBy: { criadoEm: "desc" },
    take: 10,
    select: { nota: true },
  });

  const media =
    reviews.length > 0 ? reviews.reduce((soma, r) => soma + r.nota, 0) / reviews.length : 0;

  await prisma.workerProfile.update({
    where: { id: workerProfileId },
    data: { notaMediaRecente: media },
  });
}
