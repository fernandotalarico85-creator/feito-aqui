"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { salvarUpload } from "@/lib/upload";
import { recalcularNotaMediaWorker } from "@/lib/avaliacao";
import { recalcularEstatisticasWorker } from "@/lib/estatisticasWorker";
import { reembolsarCliente } from "@/lib/reembolso";
import { liberarTudoNaConclusao } from "@/lib/repasses";
import {
  TOKENS_POR_AVALIACAO,
  VALOR_REAIS_POR_AVALIACAO,
  JANELA_CARENCIA_TOKENS_DIAS,
  TOLERANCIA_CHECKIN_MINUTOS,
  CANCELAMENTO_CLIENTE_JANELA_DIAS,
  CANCELAMENTO_CLIENTE_LIMITE_REINCIDENCIA,
  STRIKES_MEDIA_JANELA_MESES,
  CONFIRMACAO_CONCLUSAO_PRAZO_HORAS,
} from "@/lib/config";

export async function avaliarAction(formData: FormData) {
  const usuario = await exigirUsuario("CLIENTE");
  const bookingId = String(formData.get("bookingId") ?? "");

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      status: "CONCLUIDO",
      // A avaliação só abre depois que a entrega foi confirmada (Seção 3.8) — checado
      // no servidor, não só escondido na UI.
      statusConclusao: "CONFIRMADO",
      budget: { serviceRequest: { clientProfile: { userId: usuario.id } } },
    },
    include: { budget: true, review: true },
  });
  if (!booking) redirect(`/cliente/bookings/${bookingId}`);
  if (booking.review) redirect(`/cliente/bookings/${bookingId}`);

  const nota = Number(formData.get("nota"));
  const depoimento = String(formData.get("depoimento") ?? "").trim() || null;

  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    redirect(`/cliente/bookings/${bookingId}?erro=nota_invalida`);
  }

  const fotos: string[] = [];
  for (const campo of ["foto1", "foto2", "foto3"]) {
    const url = await salvarUpload(formData.get(campo) as File | null);
    if (url) fotos.push(url);
  }

  const clientProfile = await prisma.clientProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  const agora = new Date();
  const liberadoEm = new Date(
    agora.getTime() + JANELA_CARENCIA_TOKENS_DIAS * 24 * 60 * 60 * 1000,
  );

  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      nota,
      depoimento,
      fotosJson: fotos.length > 0 ? JSON.stringify(fotos) : null,
      tokensGerados: TOKENS_POR_AVALIACAO,
    },
  });

  await prisma.walletTransaction.create({
    data: {
      clientProfileId: clientProfile.id,
      reviewId: review.id,
      tipo: "CREDITO_AVALIACAO",
      valorTokens: TOKENS_POR_AVALIACAO,
      valorReais: VALOR_REAIS_POR_AVALIACAO,
      status: "CARENCIA",
      liberadoEm,
    },
  });

  await recalcularNotaMediaWorker(booking.budget.workerId);

  revalidatePath(`/cliente/bookings/${bookingId}`);
  revalidatePath(`/worker/bookings/${bookingId}`);
  revalidatePath("/cliente/carteira");
}

/**
 * Cancelamento pós-fechamento pelo cliente (Prompt 9). Sem strike na primeira vez —
 * só se o cliente reincidir em cancelamento tardio dentro da janela de 90 dias
 * (princípio de confiança de mão dupla: o corte de qualidade não é só pro worker).
 */
export async function cancelarBookingClienteAction(formData: FormData) {
  const usuario = await exigirUsuario("CLIENTE");
  const bookingId = String(formData.get("bookingId") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      status: { in: ["FECHADO", "EM_ANDAMENTO"] },
      budget: { serviceRequest: { clientProfile: { userId: usuario.id } } },
    },
    include: { budget: { include: { serviceRequest: true } } },
  });
  if (!booking) redirect(`/cliente/bookings/${bookingId}`);

  const agora = new Date();
  const canceladoAntesDoDia = agora < booking.budget.serviceRequest.janelaDataInicio;
  const clientProfileId = booking.budget.serviceRequest.clientProfileId;

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELADO",
      canceladoPor: "CLIENTE",
      canceladoEm: agora,
      motivoCancelamento: motivo,
      canceladoAntesDoDia,
    },
  });
  await prisma.serviceRequest.update({
    where: { id: booking.budget.serviceRequestId },
    data: { status: "CANCELADO" },
  });

  if (!canceladoAntesDoDia) {
    await prisma.cancelamentoTardio.create({
      data: { clientProfileId, bookingId },
    });

    const desde = new Date(
      agora.getTime() - CANCELAMENTO_CLIENTE_JANELA_DIAS * 24 * 60 * 60 * 1000,
    );
    const reincidencias = await prisma.cancelamentoTardio.count({
      where: { clientProfileId, criadoEm: { gte: desde } },
    });

    if (reincidencias >= CANCELAMENTO_CLIENTE_LIMITE_REINCIDENCIA) {
      const expiraEm = new Date(agora);
      expiraEm.setMonth(expiraEm.getMonth() + STRIKES_MEDIA_JANELA_MESES);

      await prisma.strike.create({
        data: {
          clientProfileId,
          tipoInfracao: `Cancelamento tardio pelo cliente (reincidência — ${reincidencias}ª vez em ${CANCELAMENTO_CLIENTE_JANELA_DIAS} dias)`,
          gravidade: "MEDIA",
          dataOcorrencia: agora,
          expiraEm,
        },
      });
      revalidatePath("/admin/strikes");
      revalidatePath("/admin");
    }
  }

  // Serviço não vai acontecer — as parcelas de pontualidade/conclusão nunca chegam a
  // ser devidas (a de aceite já foi paga e fica com o worker).
  await prisma.repasseWorker.deleteMany({ where: { bookingId, status: "PENDENTE" } });
  await recalcularEstatisticasWorker(booking.budget.workerId);

  revalidatePath(`/cliente/bookings/${bookingId}`);
  revalidatePath(`/worker/bookings/${bookingId}`);
  revalidatePath("/cliente/pedidos");
}

/**
 * Cliente reporta que o profissional nunca fez check-in dentro da janela — gera o
 * strike de no-show e o reembolso automático "de verdade" (Seção 3.6), sem precisar
 * de um cron: o clique do cliente é o gatilho, mas a partir daí tudo é automático.
 */
export async function reportarNoShowAction(formData: FormData) {
  const usuario = await exigirUsuario("CLIENTE");
  const bookingId = String(formData.get("bookingId") ?? "");

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      status: "FECHADO",
      checkInHorario: null,
      budget: { serviceRequest: { clientProfile: { userId: usuario.id } } },
    },
    include: { budget: { include: { serviceRequest: true } } },
  });
  if (!booking) redirect(`/cliente/bookings/${bookingId}`);

  const agora = new Date();
  const prazoTolerancia = new Date(
    booking.budget.serviceRequest.janelaDataInicio.getTime() +
      TOLERANCIA_CHECKIN_MINUTOS * 60 * 1000,
  );
  if (agora < prazoTolerancia) {
    redirect(`/cliente/bookings/${bookingId}?erro=cedo_demais`);
  }

  const expiraEm = new Date(agora);
  expiraEm.setMonth(expiraEm.getMonth() + STRIKES_MEDIA_JANELA_MESES);

  await prisma.strike.create({
    data: {
      workerId: booking.budget.workerId,
      tipoInfracao: "No-show (sem check-in)",
      gravidade: "GRAVE",
      dataOcorrencia: agora,
      expiraEm,
    },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELADO",
      canceladoPor: "WORKER",
      canceladoEm: agora,
      motivoCancelamento: "No-show — check-in não realizado dentro da janela de tolerância",
      canceladoAntesDoDia: false,
    },
  });
  await prisma.serviceRequest.update({
    where: { id: booking.budget.serviceRequestId },
    data: { status: "CANCELADO" },
  });

  await reembolsarCliente(bookingId, "No-show do profissional");
  await prisma.repasseWorker.deleteMany({ where: { bookingId, status: "PENDENTE" } });
  await recalcularEstatisticasWorker(booking.budget.workerId);

  revalidatePath(`/cliente/bookings/${bookingId}`);
  revalidatePath(`/worker/bookings/${bookingId}`);
  revalidatePath("/cliente/carteira");
  revalidatePath("/admin/strikes");
  revalidatePath("/admin");
}

/**
 * Confirmação de entrega (Seção 3.8) — só agora a parcela final do repasse é
 * liberada de verdade; marcar conclusão no check-out não bastava sozinho.
 */
export async function confirmarConclusaoAction(formData: FormData) {
  const usuario = await exigirUsuario("CLIENTE");
  const bookingId = String(formData.get("bookingId") ?? "");

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      status: "CONCLUIDO",
      statusConclusao: "AGUARDANDO_CONFIRMACAO_CLIENTE",
      budget: { serviceRequest: { clientProfile: { userId: usuario.id } } },
    },
  });
  if (!booking) redirect(`/cliente/bookings/${bookingId}`);

  await prisma.booking.update({
    where: { id: bookingId },
    data: { statusConclusao: "CONFIRMADO", conclusaoConfirmadaEm: new Date() },
  });
  await liberarTudoNaConclusao(bookingId);

  revalidatePath(`/cliente/bookings/${bookingId}`);
  revalidatePath(`/worker/bookings/${bookingId}`);
  revalidatePath("/worker/ganhos");
  revalidatePath("/cliente/pedidos");
}

/**
 * Contestação de entrega (Seção 3.8) — abre o mesmo fluxo de disputa do admin (Seção
 * 3.6) em vez de liberar a parcela final; a decisão fica com o admin.
 */
export async function contestarConclusaoAction(formData: FormData) {
  const usuario = await exigirUsuario("CLIENTE");
  const bookingId = String(formData.get("bookingId") ?? "");
  const texto = String(formData.get("texto") ?? "").trim();

  if (!texto) redirect(`/cliente/bookings/${bookingId}?erro=texto_obrigatorio`);

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      status: "CONCLUIDO",
      statusConclusao: "AGUARDANDO_CONFIRMACAO_CLIENTE",
      budget: { serviceRequest: { clientProfile: { userId: usuario.id } } },
    },
  });
  if (!booking) redirect(`/cliente/bookings/${bookingId}`);

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      statusConclusao: "CONTESTADO",
      contestacaoConclusaoTexto: texto,
      contestacaoConclusaoDataEnvio: new Date(),
    },
  });

  await prisma.dispute.create({
    data: { bookingId, evidenciasJson: JSON.stringify({ texto }) },
  });

  revalidatePath(`/cliente/bookings/${bookingId}`);
  revalidatePath(`/worker/bookings/${bookingId}`);
  revalidatePath("/admin/disputas");
  revalidatePath("/admin");
}

/**
 * Testing utility (mesmo padrão de src/app/worker/(area)/bookings/[id]/actions.ts
 * `simularPassagemDeTempoAction`): adianta a marcação de conclusão pra além do prazo
 * de confirmação automática, sem precisar esperar 72h de verdade. A confirmação em
 * si só acontece no próximo sweep (confirmarConclusoesVencidas), chamado no topo
 * desta mesma página — é o mecanismo real, só o relógio que é adiantado.
 */
export async function simularPassagemDeTempoConfirmacaoAction(formData: FormData) {
  const usuario = await exigirUsuario("CLIENTE");
  const bookingId = String(formData.get("bookingId") ?? "");

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      statusConclusao: "AGUARDANDO_CONFIRMACAO_CLIENTE",
      budget: { serviceRequest: { clientProfile: { userId: usuario.id } } },
    },
  });
  if (!booking || !booking.conclusaoMarcadaEm) redirect(`/cliente/bookings/${bookingId}`);

  const novaMarcacao = new Date(
    booking.conclusaoMarcadaEm.getTime() - (CONFIRMACAO_CONCLUSAO_PRAZO_HORAS + 1) * 60 * 60 * 1000,
  );
  await prisma.booking.update({
    where: { id: bookingId },
    data: { conclusaoMarcadaEm: novaMarcacao },
  });

  revalidatePath(`/cliente/bookings/${bookingId}`);
}
