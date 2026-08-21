import "server-only";
import { prisma } from "./db";

/**
 * Recalcula taxaConclusaoPrazo e taxaComparecimento a partir do histórico real de
 * Bookings do worker — Prompt 9 (antes eram valores estáticos do seed).
 *
 * Abordagem escolhida: campo salvo em WorkerProfile, recalculado por evento (chamado
 * sempre que um Booking vira CONCLUIDO ou CANCELADO), em vez de calcular sob demanda
 * dentro de calcularScoreRanking(). Motivo: mantém consistência com notaMediaRecente e
 * volumeConcluidos, que já seguem esse padrão (recalculados no momento do evento); evita
 * transformar a função de ranking — hoje pura e síncrona — numa função assíncrona com
 * agregações no banco por worker a cada render da lista de profissionais recomendados
 * (N+1 query se computado sob demanda ali); e mantém os números visíveis/consistentes
 * em qualquer tela que leia WorkerProfile diretamente (ex.: /admin/workers), não só na
 * página de ranking.
 */
export async function recalcularEstatisticasWorker(workerProfileId: string) {
  const bookingsTerminal = await prisma.booking.findMany({
    where: {
      budget: { workerId: workerProfileId },
      status: { in: ["CONCLUIDO", "CANCELADO"] },
    },
    include: { budget: true },
  });

  // Comparecimento: todo booking fechado conta, exceto os cancelados ANTES do dia do
  // serviço chegar (não é falta de comparecimento) e os cancelados tardiamente pelo
  // CLIENTE (não é o worker que faltou — não é justo penalizar a taxa dele por isso).
  const bookingsComparecimento = bookingsTerminal.filter((b) => {
    if (b.status !== "CANCELADO") return true;
    if (b.canceladoAntesDoDia === true) return false;
    if (b.canceladoPor === "CLIENTE") return false;
    return true;
  });
  // Comparecimento é sobre no-show (compareceu ou não), não pontualidade — atraso no
  // check-in é uma métrica separada (ver taxaConclusaoPrazo e a infração "Atraso não
  // justificado" na Seção 3.6). Um check-in fora da tolerância ainda conta como presença.
  const taxaComparecimento =
    bookingsComparecimento.length > 0
      ? bookingsComparecimento.filter((b) => b.checkInHorario !== null).length /
        bookingsComparecimento.length
      : 0;

  // Conclusão no prazo: só bookings efetivamente concluídos contam.
  const bookingsConcluidos = bookingsTerminal.filter((b) => b.status === "CONCLUIDO");
  const taxaConclusaoPrazo =
    bookingsConcluidos.length > 0
      ? bookingsConcluidos.filter(
          (b) => b.checkOutHorario && b.checkOutHorario <= b.budget.prazoEntrega,
        ).length / bookingsConcluidos.length
      : 0;

  await prisma.workerProfile.update({
    where: { id: workerProfileId },
    data: { taxaConclusaoPrazo, taxaComparecimento },
  });
}
