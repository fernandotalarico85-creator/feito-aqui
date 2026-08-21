import "server-only";
import { prisma } from "./db";
import { calcularComissao } from "./comissao";
import { criarRepassesAoAceitar } from "./repasses";
import { COMISSAO_PERCENTUAL_TOTAL } from "./config";

/**
 * Fecha o negócio a partir de um Budget já validado pelo chamador — usado tanto
 * quando o cliente aceita um orçamento diretamente quanto quando o worker aceita a
 * contra-proposta do cliente (nesse caso `valorFinal`/`prazoFinalEntrega` vêm dos
 * campos de contraproposta, não do valor original do worker). Recusa
 * automaticamente os demais orçamentos do mesmo pedido, exatamente como o aceite
 * direto já fazia.
 */
export async function fecharNegocio(budgetId: string, valorFinal: number, prazoFinalEntrega: Date) {
  const budget = await prisma.budget.findUniqueOrThrow({ where: { id: budgetId } });

  const comissao = calcularComissao(valorFinal);

  await prisma.$transaction([
    prisma.budget.update({
      where: { id: budget.id },
      data: {
        status: "ACEITO",
        valor: valorFinal,
        prazoEntrega: prazoFinalEntrega,
        contrapropostaStatus: "NENHUMA",
      },
    }),
    prisma.budget.updateMany({
      where: { serviceRequestId: budget.serviceRequestId, id: { not: budget.id } },
      data: { status: "RECUSADO" },
    }),
    prisma.serviceRequest.update({
      where: { id: budget.serviceRequestId },
      data: { status: "FECHADO" },
    }),
  ]);

  const booking = await prisma.booking.create({
    data: {
      budgetId: budget.id,
      // Cliente paga exatamente o valor final combinado — sem taxa visível (Prompt 9).
      valorTotal: comissao.totalPagoPeloCliente,
      comissaoValor: comissao.comissaoPlataforma,
      comissaoPercentual: COMISSAO_PERCENTUAL_TOTAL,
      pagamentoStatus: "simulado_aprovado",
      status: "FECHADO",
    },
  });

  // Repasse ao worker em 3 parcelas, calculado sobre o valor final combinado.
  await criarRepassesAoAceitar(booking.id, budget.workerId, valorFinal);

  return booking;
}
