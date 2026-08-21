import "server-only";
import { prisma } from "./db";
import { CONFIRMACAO_CONCLUSAO_PRAZO_HORAS } from "./config";
import { liberarTudoNaConclusao } from "./repasses";

/**
 * Sweep preguiçoso (mesmo padrão de src/lib/repasses.ts `liberarRepassesVencidos` e
 * src/lib/carteira.ts): confirma automaticamente conclusões cujo prazo de confirmação
 * se esgotou sem o cliente confirmar nem contestar (Seção 3.8). Chamado no topo das
 * telas relevantes em vez de um scheduler real, que o protótipo não precisa ter.
 */
export async function confirmarConclusoesVencidas() {
  const limite = new Date(Date.now() - CONFIRMACAO_CONCLUSAO_PRAZO_HORAS * 60 * 60 * 1000);

  const vencidas = await prisma.booking.findMany({
    where: { statusConclusao: "AGUARDANDO_CONFIRMACAO_CLIENTE", conclusaoMarcadaEm: { lte: limite } },
    select: { id: true },
  });

  for (const booking of vencidas) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        statusConclusao: "CONFIRMADO",
        conclusaoConfirmadaEm: new Date(),
        conclusaoAutoConfirmada: true,
      },
    });
    await liberarTudoNaConclusao(booking.id);
  }
}
