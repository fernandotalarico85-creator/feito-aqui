"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";

/**
 * Cancelamento ANTES do fechamento (Prompt 9) — cliente pode cancelar livremente,
 * sem strike, enquanto o pedido ainda não virou Booking.
 */
export async function cancelarPedidoAction(formData: FormData) {
  const usuario = await exigirUsuario("CLIENTE");
  const pedidoId = String(formData.get("pedidoId") ?? "");

  const pedido = await prisma.serviceRequest.findFirst({
    where: {
      id: pedidoId,
      clientProfile: { userId: usuario.id },
      status: { in: ["TRIAGEM", "AGUARDANDO_ORCAMENTO", "ORCADO"] },
    },
  });
  if (!pedido) redirect("/cliente/pedidos");

  await prisma.$transaction([
    prisma.serviceRequest.update({ where: { id: pedidoId }, data: { status: "CANCELADO" } }),
    prisma.budget.updateMany({
      where: { serviceRequestId: pedidoId, status: "PENDENTE" },
      data: { status: "RECUSADO" },
    }),
  ]);

  revalidatePath("/cliente/pedidos");
  revalidatePath("/worker/pedidos");
}
