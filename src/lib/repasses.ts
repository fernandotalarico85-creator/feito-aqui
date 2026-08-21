import "server-only";
import { prisma } from "./db";
import { calcularComissao } from "./comissao";

/**
 * Cria as 3 parcelas do repasse do worker ao aceitar o orçamento — a de ACEITE já
 * nasce liberada (o dinheiro entra na hora que o cliente paga), as outras duas ficam
 * pendentes até o check-in dentro da tolerância e a conclusão do serviço.
 */
export async function criarRepassesAoAceitar(
  bookingId: string,
  workerProfileId: string,
  valorOrcamento: number,
) {
  const comissao = calcularComissao(valorOrcamento);
  const agora = new Date();

  await prisma.repasseWorker.createMany({
    data: [
      {
        bookingId,
        workerProfileId,
        tipo: "ACEITE",
        valor: comissao.parcelaAceite,
        status: "LIBERADO",
        liberadoEm: agora,
      },
      {
        bookingId,
        workerProfileId,
        tipo: "PONTUALIDADE",
        valor: comissao.parcelaPontualidade,
        status: "PENDENTE",
      },
      {
        bookingId,
        workerProfileId,
        tipo: "CONCLUSAO",
        valor: comissao.parcelaConclusao,
        status: "PENDENTE",
      },
    ],
  });
}

/** Check-in dentro da tolerância — libera a parcela de pontualidade na hora. */
export async function liberarPontualidadeNoCheckin(bookingId: string) {
  await prisma.repasseWorker.updateMany({
    where: { bookingId, tipo: "PONTUALIDADE", status: "PENDENTE" },
    data: { status: "LIBERADO", liberadoEm: new Date() },
  });
}

/** Libera parcelas em CARENCIA cujo prazo já venceu — mesmo padrão de
 * src/lib/carteira.ts, chamado antes de exibir os ganhos do worker. */
export async function liberarRepassesVencidos(workerProfileId: string) {
  await prisma.repasseWorker.updateMany({
    where: { workerProfileId, status: "CARENCIA", liberadoEm: { lte: new Date() } },
    data: { status: "LIBERADO" },
  });
}

/**
 * Fallback pedido pelo usuário: se ninguém decidiu nada sobre uma parcela de
 * pontualidade pendente/em análise/agendada até a conclusão do serviço, ela é
 * liberada junto com a parcela de conclusão — o worker nunca perde o dinheiro, só
 * pode receber mais tarde do que gostaria.
 */
export async function liberarTudoNaConclusao(bookingId: string) {
  await prisma.repasseWorker.updateMany({
    where: { bookingId, status: { not: "LIBERADO" } },
    data: { status: "LIBERADO", liberadoEm: new Date() },
  });
}
