"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { NOTA_MINIMA_PARA_DESTAQUE, DESTAQUE_DURACAO_DIAS } from "@/lib/config";

/**
 * "Comprar" destaque — Seção 3.1: worker com nota abaixo do piso não pode comprar.
 * Pagamento simulado, igual ao fechamento de serviço (sem gateway real).
 */
export async function comprarDestaqueAction() {
  const usuario = await exigirUsuario("WORKER");
  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  if (worker.notaMediaRecente < NOTA_MINIMA_PARA_DESTAQUE) {
    redirect("/worker/destaque?erro=nota_insuficiente");
  }

  const agora = new Date();
  // Se já tem destaque ativo, estende a partir do vencimento atual; senão, a partir de agora.
  const baseValidade =
    worker.destaquePago && worker.destaquePagoValidoAte && worker.destaquePagoValidoAte > agora
      ? worker.destaquePagoValidoAte
      : agora;
  const novaValidade = new Date(
    baseValidade.getTime() + DESTAQUE_DURACAO_DIAS * 24 * 60 * 60 * 1000,
  );

  await prisma.workerProfile.update({
    where: { id: worker.id },
    data: { destaquePago: true, destaquePagoValidoAte: novaValidade },
  });

  revalidatePath("/worker/destaque");
}
