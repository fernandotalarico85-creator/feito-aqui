"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { liberarTokensVencidos } from "@/lib/carteira";

/**
 * Testing utility (mesmo padrão do Prompt 5): adianta artificialmente o fim da
 * janela de carência de um crédito específico, para demonstrar a liberação sem
 * esperar os 4 dias de verdade. Respeita a regra de "não libera se em disputa"
 * porque delega para liberarTokensVencidos().
 */
export async function simularLiberacaoAction(formData: FormData) {
  const usuario = await exigirUsuario("CLIENTE");
  const transacaoId = String(formData.get("transacaoId") ?? "");

  const clientProfile = await prisma.clientProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  await prisma.walletTransaction.updateMany({
    where: { id: transacaoId, clientProfileId: clientProfile.id, status: "CARENCIA" },
    data: { liberadoEm: new Date() },
  });

  await liberarTokensVencidos(clientProfile.id);

  revalidatePath("/cliente/carteira");
}
