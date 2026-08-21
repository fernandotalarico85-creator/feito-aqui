"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { fecharNegocio } from "@/lib/fecharOrcamento";

export async function aceitarOrcamentoAction(formData: FormData) {
  const usuario = await exigirUsuario("CLIENTE");
  const budgetId = String(formData.get("budgetId") ?? "");

  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, serviceRequest: { clientProfile: { userId: usuario.id } } },
    include: { serviceRequest: true },
  });

  if (!budget) redirect("/cliente/pedidos");

  // Idempotência: se o pedido já foi fechado (ex.: duplo clique), só redireciona.
  if (budget.serviceRequest.status === "FECHADO" || budget.status !== "PENDENTE") {
    const bookingExistente = await prisma.booking.findUnique({ where: { budgetId: budget.id } });
    redirect(
      bookingExistente
        ? `/cliente/bookings/${bookingExistente.id}`
        : `/cliente/pedidos/${budget.serviceRequestId}/orcamentos`,
    );
  }

  const booking = await fecharNegocio(budget.id, budget.valor, budget.prazoEntrega);

  redirect(`/cliente/bookings/${booking.id}`);
}

/**
 * Cliente recusa um orçamento (Prompt 10) — sem strike pra ninguém, o pedido
 * continua aberto para os outros orçamentos recebidos ou para novos workers.
 */
export async function recusarOrcamentoAction(formData: FormData) {
  const usuario = await exigirUsuario("CLIENTE");
  const budgetId = String(formData.get("budgetId") ?? "");

  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      status: "PENDENTE",
      serviceRequest: { clientProfile: { userId: usuario.id } },
    },
  });
  if (!budget) redirect("/cliente/pedidos");

  await prisma.budget.update({ where: { id: budget.id }, data: { status: "RECUSADO" } });

  revalidatePath(`/cliente/pedidos/${budget.serviceRequestId}/orcamentos`);
  revalidatePath("/worker/orcamentos");
}

/**
 * Cliente propõe um valor (e opcionalmente um prazo) diferente do orçamento enviado
 * pelo worker (Prompt 10) — fica pendente até o worker aceitar ou recusar. Recusar
 * um orçamento pendente do worker não some com ele: o orçamento original continua
 * valendo, o cliente pode aceitar como estava ou tentar outra contra-proposta.
 */
export async function enviarContrapropostaAction(formData: FormData) {
  const usuario = await exigirUsuario("CLIENTE");
  const budgetId = String(formData.get("budgetId") ?? "");
  const pedidoId = String(formData.get("pedidoId") ?? "");
  const valor = Number(formData.get("valor"));
  const prazoEntrega = String(formData.get("prazoEntrega") ?? "").trim();
  const mensagem = String(formData.get("mensagem") ?? "").trim() || null;

  if (!Number.isFinite(valor) || valor <= 0) {
    redirect(`/cliente/pedidos/${pedidoId}/orcamentos?erro=valor_invalido`);
  }

  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      status: "PENDENTE",
      contrapropostaStatus: { not: "PENDENTE_WORKER" },
      serviceRequest: { clientProfile: { userId: usuario.id } },
    },
  });
  if (!budget) redirect("/cliente/pedidos");

  await prisma.budget.update({
    where: { id: budget.id },
    data: {
      contrapropostaStatus: "PENDENTE_WORKER",
      valorContraproposta: valor,
      prazoEntregaContraproposta: prazoEntrega ? new Date(prazoEntrega) : budget.prazoEntrega,
      contrapropostaMensagem: mensagem,
      contrapropostaCriadaEm: new Date(),
    },
  });

  revalidatePath(`/cliente/pedidos/${budget.serviceRequestId}/orcamentos`);
  revalidatePath("/worker/orcamentos");
}

/**
 * Testing utility (mesmo padrão de simularPassagemDeTempoAction em outras telas):
 * adianta a data de criação do orçamento pra além do prazo de expiração, sem
 * precisar esperar os 5 dias de verdade. A expiração em si só acontece no próximo
 * sweep (expirarOrcamentosVencidos), chamado no topo desta mesma página.
 */
export async function simularExpiracaoOrcamentoAction(formData: FormData) {
  const usuario = await exigirUsuario("CLIENTE");
  const budgetId = String(formData.get("budgetId") ?? "");

  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      status: "PENDENTE",
      serviceRequest: { clientProfile: { userId: usuario.id } },
    },
  });
  if (!budget) redirect("/cliente/pedidos");

  const novaCriacao = new Date(budget.criadoEm.getTime() - 6 * 24 * 60 * 60 * 1000);
  await prisma.budget.update({ where: { id: budget.id }, data: { criadoEm: novaCriacao } });

  revalidatePath(`/cliente/pedidos/${budget.serviceRequestId}/orcamentos`);
}
