import "server-only";
import { prisma } from "./db";

/**
 * Reembolso automático — Seção 3.6 (no-show) e Prompt 9 (cancelamento tardio do worker
 * equivalente a no-show). Credita o valor total pago pelo cliente naquele booking,
 * disponível na hora (sem carência — não é o mesmo mecanismo dos tokens de avaliação),
 * e marca o pagamento do booking como reembolsado.
 */
export async function reembolsarCliente(bookingId: string, descricao: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { budget: { include: { serviceRequest: true } } },
  });

  await prisma.walletTransaction.create({
    data: {
      clientProfileId: booking.budget.serviceRequest.clientProfileId,
      bookingId: booking.id,
      tipo: "REEMBOLSO_NO_SHOW",
      valorTokens: 0,
      valorReais: booking.valorTotal,
      status: "LIBERADO",
      liberadoEm: new Date(),
      descricao,
    },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: { pagamentoStatus: "reembolsado" },
  });
}
