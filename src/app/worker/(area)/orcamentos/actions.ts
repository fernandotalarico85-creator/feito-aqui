"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { fecharNegocio } from "@/lib/fecharOrcamento";

/**
 * Worker aceita a contra-proposta do cliente (Prompt 10) — fecha o negócio direto
 * no valor/prazo propostos, sem precisar que o cliente confirme de novo (os dois já
 * concordaram: o cliente propôs, o worker aceitou).
 */
export async function aceitarContrapropostaAction(formData: FormData) {
  const usuario = await exigirUsuario("WORKER");
  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });
  const budgetId = String(formData.get("budgetId") ?? "");

  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      workerId: worker.id,
      status: "PENDENTE",
      contrapropostaStatus: "PENDENTE_WORKER",
    },
  });
  if (!budget || budget.valorContraproposta == null) redirect("/worker/orcamentos");

  const booking = await fecharNegocio(
    budget.id,
    budget.valorContraproposta,
    budget.prazoEntregaContraproposta ?? budget.prazoEntrega,
  );

  redirect(`/worker/bookings/${booking.id}`);
}

/**
 * Worker recusa a contra-proposta — o orçamento original NÃO é cancelado, só a
 * negociação é encerrada; o cliente ainda pode aceitar o valor original ou tentar
 * outra contra-proposta.
 */
export async function recusarContrapropostaAction(formData: FormData) {
  const usuario = await exigirUsuario("WORKER");
  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });
  const budgetId = String(formData.get("budgetId") ?? "");

  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, workerId: worker.id, contrapropostaStatus: "PENDENTE_WORKER" },
  });
  if (!budget) redirect("/worker/orcamentos");

  await prisma.budget.update({
    where: { id: budget.id },
    data: { contrapropostaStatus: "RECUSADA_PELO_WORKER" },
  });

  revalidatePath("/worker/orcamentos");
  revalidatePath(`/cliente/pedidos/${budget.serviceRequestId}/orcamentos`);
}
