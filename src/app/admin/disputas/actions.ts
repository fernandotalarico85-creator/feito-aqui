"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { recalcularNotaMediaWorker } from "@/lib/avaliacao";
import { liberarTudoNaConclusao } from "@/lib/repasses";

export async function resolverDisputaAction(formData: FormData) {
  const admin = await exigirUsuario("ADMIN");
  const reviewId = String(formData.get("reviewId") ?? "");
  const decisao = String(formData.get("decisao") ?? "");

  if (decisao !== "MANTIDA" && decisao !== "REVERTIDA") {
    redirect("/admin/disputas");
  }

  const review = await prisma.review.findFirst({
    where: { id: reviewId, statusContestacao: "EM_ANALISE" },
    include: { booking: { include: { budget: true } } },
  });
  if (!review) redirect("/admin/disputas");

  await prisma.review.update({
    where: { id: review.id },
    data: { statusContestacao: decisao },
  });

  await prisma.dispute.create({
    data: {
      reviewId: review.id,
      bookingId: review.bookingId,
      decisao:
        decisao === "MANTIDA"
          ? "Nota mantida — contestação do worker não procede."
          : "Nota revertida — contestação do worker aceita, tokens estornados.",
      decididoPorId: admin.id,
      dataDecisao: new Date(),
    },
  });

  if (decisao === "REVERTIDA") {
    // Estorna os créditos gerados por essa avaliação (Seção 3.5).
    await prisma.walletTransaction.updateMany({
      where: { reviewId: review.id, status: { in: ["CARENCIA", "LIBERADO"] } },
      data: { status: "ESTORNADO" },
    });
  }

  // Nota revertida/mantida muda o que conta no ranking — recalcula.
  await recalcularNotaMediaWorker(review.booking.budget.workerId);

  revalidatePath("/admin/disputas");
  revalidatePath("/admin");
  revalidatePath(`/cliente/bookings/${review.bookingId}`);
  revalidatePath(`/worker/bookings/${review.bookingId}`);
  revalidatePath("/cliente/carteira");
}

export async function resolverContestacaoStrikeAction(formData: FormData) {
  const admin = await exigirUsuario("ADMIN");
  const strikeId = String(formData.get("strikeId") ?? "");
  const decisao = String(formData.get("decisao") ?? "");

  if (decisao !== "MANTIDA" && decisao !== "REVERTIDA") {
    redirect("/admin/disputas");
  }

  const strike = await prisma.strike.findFirst({
    where: { id: strikeId, statusContestacao: "EM_ANALISE" },
  });
  if (!strike) redirect("/admin/disputas");

  await prisma.strike.update({
    where: { id: strike.id },
    data: { statusContestacao: decisao },
  });

  await prisma.dispute.create({
    data: {
      strikeId: strike.id,
      decisao:
        decisao === "MANTIDA"
          ? "Strike mantido — contestação não procede."
          : "Strike revogado — contestação aceita.",
      decididoPorId: admin.id,
      dataDecisao: new Date(),
    },
  });

  revalidatePath("/admin/disputas");
  revalidatePath("/admin");
  revalidatePath("/admin/strikes");
  revalidatePath("/worker/strikes");
}

/**
 * Decisão do admin sobre uma entrega contestada pelo cliente (Seção 3.8) — mesmo
 * padrão de resolverDisputaAction/resolverContestacaoStrikeAction: confirmar libera a
 * parcela final do repasse (como se o cliente tivesse confirmado), manter a
 * contestação deixa o valor retido — resolução fora do fluxo automático (ex.:
 * reembolso manual) fica a critério do admin.
 */
export async function resolverContestacaoConclusaoAction(formData: FormData) {
  const admin = await exigirUsuario("ADMIN");
  const bookingId = String(formData.get("bookingId") ?? "");
  const decisao = String(formData.get("decisao") ?? "");

  if (decisao !== "CONFIRMAR_ENTREGA" && decisao !== "MANTER_CONTESTACAO") {
    redirect("/admin/disputas");
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, statusConclusao: "CONTESTADO" },
  });
  if (!booking) redirect("/admin/disputas");

  if (decisao === "CONFIRMAR_ENTREGA") {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { statusConclusao: "CONFIRMADO", conclusaoConfirmadaEm: new Date() },
    });
    await liberarTudoNaConclusao(bookingId);
  }

  await prisma.dispute.create({
    data: {
      bookingId,
      decisao:
        decisao === "CONFIRMAR_ENTREGA"
          ? "Entrega confirmada pelo admin — parcela final do repasse liberada."
          : "Contestação mantida — parcela final segue retida.",
      decididoPorId: admin.id,
      dataDecisao: new Date(),
    },
  });

  revalidatePath("/admin/disputas");
  revalidatePath("/admin");
  revalidatePath(`/cliente/bookings/${bookingId}`);
  revalidatePath(`/worker/bookings/${bookingId}`);
  revalidatePath("/worker/ganhos");
}
