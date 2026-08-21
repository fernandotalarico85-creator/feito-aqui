import "server-only";
import { prisma } from "./db";
import { ORCAMENTO_PRAZO_EXPIRACAO_DIAS } from "./config";

/**
 * Sweep preguiçoso (mesmo padrão de src/lib/repasses.ts e
 * src/lib/confirmacaoConclusao.ts): expira orçamentos que ficaram PENDENTE além do
 * prazo sem o cliente decidir. Chamado no topo das telas relevantes em vez de um
 * scheduler real.
 *
 * Não expira um orçamento com contra-proposta aguardando o worker
 * (`contrapropostaStatus: PENDENTE_WORKER`) — nesse caso o cliente já agiu (propôs
 * um valor) e quem está devendo resposta é o worker, não faria sentido punir o
 * cliente por inatividade que não é dele.
 */
export async function expirarOrcamentosVencidos() {
  const limite = new Date(Date.now() - ORCAMENTO_PRAZO_EXPIRACAO_DIAS * 24 * 60 * 60 * 1000);

  await prisma.budget.updateMany({
    where: {
      status: "PENDENTE",
      contrapropostaStatus: { not: "PENDENTE_WORKER" },
      criadoEm: { lte: limite },
    },
    data: { status: "EXPIRADO" },
  });
}
