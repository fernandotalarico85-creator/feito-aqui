"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { gerarNumeroDocumento } from "@/lib/numeracao";

export async function enviarOrcamentoAction(formData: FormData) {
  const usuario = await exigirUsuario("WORKER");
  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  const serviceRequestId = String(formData.get("serviceRequestId") ?? "");
  const valor = Number(formData.get("valor"));
  const prazoEntrega = String(formData.get("prazoEntrega") ?? "");

  if (!serviceRequestId || !valor || valor <= 0 || !prazoEntrega) {
    redirect(`/worker/pedidos/${serviceRequestId}?erro=dados_invalidos`);
  }

  const pedido = await prisma.serviceRequest.findUnique({ where: { id: serviceRequestId } });
  if (!pedido) redirect("/worker/pedidos");

  const jaExiste = await prisma.budget.findFirst({
    where: { serviceRequestId, workerId: worker.id },
  });
  if (jaExiste) redirect(`/worker/pedidos/${serviceRequestId}`);

  const numeroPO = await gerarNumeroDocumento("PO");

  await prisma.budget.create({
    data: {
      numeroPO,
      serviceRequestId,
      workerId: worker.id,
      valor,
      prazoEntrega: new Date(prazoEntrega),
      status: "PENDENTE",
    },
  });

  if (pedido.status === "AGUARDANDO_ORCAMENTO") {
    await prisma.serviceRequest.update({
      where: { id: pedido.id },
      data: { status: "ORCADO" },
    });
  }

  redirect("/worker/pedidos?enviado=1");
}

/** Worker recusa/retira um orçamento já enviado (Prompt 9) — sem strike, o pedido
 * continua aberto para outros workers responderem. */
export async function retirarOrcamentoAction(formData: FormData) {
  const usuario = await exigirUsuario("WORKER");
  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });
  const budgetId = String(formData.get("budgetId") ?? "");

  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, workerId: worker.id, status: "PENDENTE" },
  });
  if (!budget) redirect("/worker/pedidos");

  await prisma.budget.update({ where: { id: budget.id }, data: { status: "RECUSADO" } });

  redirect(`/worker/pedidos/${budget.serviceRequestId}`);
}
