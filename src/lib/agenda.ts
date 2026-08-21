import "server-only";
import { prisma } from "./db";

/**
 * Um worker é considerado incompatível com a janela de um pedido só quando ele marcou
 * explicitamente TODOS os dias da janela como indisponíveis. Dias sem marcação nenhuma
 * são tratados como disponíveis por padrão — evita que pedidos com janelas fora dos dias
 * já cadastrados na agenda (Prompt 1 semeia só 14 dias) pareçam "incompatíveis" à toa.
 */
export async function workerCompativelComAgenda(
  workerProfileId: string,
  janelaDataInicio: Date,
  janelaDataFim: Date,
): Promise<boolean> {
  const dias = await prisma.agendaDia.findMany({
    where: {
      workerProfileId,
      data: { gte: janelaDataInicio, lte: janelaDataFim },
    },
  });

  if (dias.length === 0) return true;
  return dias.some((dia) => dia.disponivel);
}
