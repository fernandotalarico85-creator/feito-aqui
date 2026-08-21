import "server-only";
import { prisma } from "./db";

/**
 * Libera (CARENCIA → LIBERADO) os créditos cujo prazo de carência já passou —
 * exceto os ligados a uma review ainda em disputa (Seção 3.5: "nenhuma avaliação
 * sob disputa ativa libera token até resolução"). Chame antes de exibir a carteira.
 */
export async function liberarTokensVencidos(clientProfileId: string) {
  await prisma.walletTransaction.updateMany({
    where: {
      clientProfileId,
      status: "CARENCIA",
      liberadoEm: { lte: new Date() },
      OR: [{ reviewId: null }, { review: { statusContestacao: { not: "EM_ANALISE" } } }],
    },
    data: { status: "LIBERADO" },
  });
}

export async function listarTransacoesCarteira(clientProfileId: string) {
  await liberarTokensVencidos(clientProfileId);

  return prisma.walletTransaction.findMany({
    where: { clientProfileId },
    orderBy: { criadoEm: "desc" },
  });
}
