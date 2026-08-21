"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";

export async function solicitarOrcamentoAction(formData: FormData) {
  const usuario = await exigirUsuario("CLIENTE");
  const workerId = String(formData.get("workerId") ?? "");
  const pedidoId = String(formData.get("pedidoId") ?? "");

  const pedido = await prisma.serviceRequest.findFirst({
    where: { id: pedidoId, clientProfile: { userId: usuario.id } },
  });
  if (!pedido) redirect("/cliente/pedidos");

  // A "solicitação" confirma o pedido como pronto para orçamentos — o worker já o vê
  // na tela de "pedidos recebidos" por compatibilidade de categoria/agenda.
  if (pedido.status === "TRIAGEM") {
    await prisma.serviceRequest.update({
      where: { id: pedido.id },
      data: { status: "AGUARDANDO_ORCAMENTO" },
    });
  }

  redirect(`/cliente/pedidos/${pedido.id}/profissionais?solicitado=${workerId}`);
}
