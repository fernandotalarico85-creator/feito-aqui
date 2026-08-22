"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { distanciaMetros } from "@/lib/geo";
import { salvarUpload } from "@/lib/upload";
import { recalcularNotaMediaWorker } from "@/lib/avaliacao";
import { recalcularEstatisticasWorker } from "@/lib/estatisticasWorker";
import { reembolsarCliente } from "@/lib/reembolso";
import { liberarPontualidadeNoCheckin } from "@/lib/repasses";
import {
  GEOFENCE_RAIO_METROS,
  TOLERANCIA_CHECKIN_MINUTOS,
  ALERTA_SAIDA_PROLONGADA_MINUTOS,
  JANELA_CARENCIA_TOKENS_DIAS,
  JUSTIFICATIVA_ATRASO_PRAZO_HORAS,
  CANCELAMENTO_WORKER_JANELA_GRAVE_HORAS,
  CANCELAMENTO_WORKER_JANELA_MEDIA_HORAS,
  STRIKES_MEDIA_JANELA_MESES,
} from "@/lib/config";

async function getBookingDoWorker(bookingId: string, userId: string) {
  return prisma.booking.findFirst({
    where: { id: bookingId, budget: { worker: { userId } } },
    include: {
      budget: { include: { serviceRequest: { include: { address: true } } } },
    },
  });
}

export async function fazerCheckInAction(formData: FormData) {
  const usuario = await exigirUsuario("WORKER");
  const bookingId = String(formData.get("bookingId") ?? "");
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));

  const booking = await getBookingDoWorker(bookingId, usuario.id);
  if (!booking) redirect("/worker/orcamentos");
  if (booking.checkInHorario || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    redirect(`/worker/bookings/${bookingId}`);
  }

  const endereco = booking.budget.serviceRequest.address;
  const distancia = distanciaMetros(latitude, longitude, endereco.latitude, endereco.longitude);
  const dentroDaGeofence = distancia <= GEOFENCE_RAIO_METROS;

  const agora = new Date();
  // "Horário combinado" = início da janela desejada pelo cliente no pedido
  // (Seção 3.4 — protótipo não tem agenda por hora, então reaproveita esse campo).
  // Tolerância agora é simétrica (±30min) — mesma regra pro flag de atraso
  // (strikes/ranking) e pra liberar a parcela de pontualidade do repasse.
  const horarioCombinado = booking.budget.serviceRequest.janelaDataInicio;
  const diferencaMinutos = Math.abs(agora.getTime() - horarioCombinado.getTime()) / 60000;
  const atrasado = diferencaMinutos > TOLERANCIA_CHECKIN_MINUTOS;

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      checkInHorario: agora,
      checkInLatitude: latitude,
      checkInLongitude: longitude,
      checkInDentroGeofence: dentroDaGeofence,
      checkInAtrasado: atrasado,
      status: "EM_ANDAMENTO",
    },
  });
  await prisma.serviceRequest.update({
    where: { id: booking.budget.serviceRequestId },
    data: { status: "EM_ANDAMENTO" },
  });

  // Check-in dentro da tolerância libera a parcela de pontualidade (30%) na hora;
  // fora da tolerância, fica pendente até o worker justificar ou o serviço concluir.
  if (!atrasado) {
    await liberarPontualidadeNoCheckin(bookingId);
  }

  revalidatePath(`/worker/bookings/${bookingId}`);
  revalidatePath(`/cliente/bookings/${bookingId}`);
}

/**
 * Testing utility exigida pelo Prompt 5: como o protótipo não tem rastreamento
 * contínuo real, adianta artificialmente o horário do check-in para além da janela
 * de saída prolongada (40min), permitindo demonstrar o alerta sem esperar de verdade.
 */
export async function simularPassagemDeTempoAction(formData: FormData) {
  const usuario = await exigirUsuario("WORKER");
  const bookingId = String(formData.get("bookingId") ?? "");

  const booking = await getBookingDoWorker(bookingId, usuario.id);
  if (!booking || !booking.checkInHorario || booking.checkOutHorario) {
    redirect(`/worker/bookings/${bookingId}`);
  }

  const novoCheckIn = new Date(
    booking.checkInHorario!.getTime() - (ALERTA_SAIDA_PROLONGADA_MINUTOS + 5) * 60 * 1000,
  );

  await prisma.booking.update({
    where: { id: bookingId },
    data: { checkInHorario: novoCheckIn, alertaSaidaProlongada: true },
  });

  revalidatePath(`/worker/bookings/${bookingId}`);
  revalidatePath(`/cliente/bookings/${bookingId}`);
}

/**
 * Marcar conclusão (Seção 3.8): exige pelo menos 1 foto do "depois" — sem ela, o
 * status não avança e a parcela final do repasse nunca chega a ficar em jogo. A foto
 * pode ser publicada no portfólio na hora (checkbox) ou depois, a qualquer momento, na
 * tela "Portfólio". Marcar conclusão NÃO libera a parcela final sozinho:
 * fica "aguardando confirmação do cliente" até ele confirmar, contestar, ou o prazo
 * de confirmação automática se esgotar (ver src/lib/confirmacaoConclusao.ts).
 */
export async function fazerCheckOutAction(formData: FormData) {
  const usuario = await exigirUsuario("WORKER");
  const bookingId = String(formData.get("bookingId") ?? "");
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const publicarPortfolio = formData.get("publicarPortfolio") === "true";

  const booking = await getBookingDoWorker(bookingId, usuario.id);
  if (!booking || !booking.checkInHorario || booking.checkOutHorario) {
    redirect(`/worker/bookings/${bookingId}`);
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    redirect(`/worker/bookings/${bookingId}`);
  }

  const arquivos = formData.getAll("fotos") as File[];
  const urls: string[] = [];
  for (const arquivo of arquivos) {
    const url = await salvarUpload(arquivo);
    if (url) urls.push(url);
  }
  if (urls.length === 0) {
    redirect(`/worker/bookings/${bookingId}?erro=sem_foto`);
  }

  const agora = new Date();
  const minutosDesdeCheckIn = (agora.getTime() - booking.checkInHorario!.getTime()) / 60000;
  const alertaSaidaProlongada =
    booking.alertaSaidaProlongada || minutosDesdeCheckIn > ALERTA_SAIDA_PROLONGADA_MINUTOS;

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      checkOutHorario: agora,
      checkOutLatitude: latitude,
      checkOutLongitude: longitude,
      alertaSaidaProlongada,
      status: "CONCLUIDO",
      statusConclusao: "AGUARDANDO_CONFIRMACAO_CLIENTE",
      conclusaoMarcadaEm: agora,
      servicePhotos: { create: urls.map((url) => ({ url })) },
    },
  });
  await prisma.serviceRequest.update({
    where: { id: booking.budget.serviceRequestId },
    data: { status: "CONCLUIDO" },
  });
  // Conta pro "Volume de serviços concluídos" do ranking (Seção 3.3) — independe de o
  // cliente confirmar a entrega ou deixar avaliação.
  await prisma.workerProfile.update({
    where: { id: booking.budget.workerId },
    data: { volumeConcluidos: { increment: 1 } },
  });
  await recalcularEstatisticasWorker(booking.budget.workerId);

  if (publicarPortfolio) {
    await prisma.portfolioItem.create({
      data: {
        workerProfileId: booking.budget.workerId,
        origem: "PLATAFORMA",
        bookingId,
        fotoDepoisUrl: urls[0],
      },
    });
  }

  // A parcela final do repasse NÃO libera aqui — só depois que o cliente confirmar a
  // entrega, ou o prazo de confirmação automática (Seção 3.8) se esgotar.

  revalidatePath(`/worker/bookings/${bookingId}`);
  revalidatePath(`/cliente/bookings/${bookingId}`);
  revalidatePath("/cliente/pedidos");
  revalidatePath("/worker/ganhos");
  revalidatePath("/worker/portfolio");
}

/**
 * Worker envia uma justificativa pro check-in ter ficado fora da tolerância — a
 * decisão de liberar a parcela de pontualidade na hora, agendar pra depois, ou
 * deixar cair no fallback (libera na conclusão) fica com o admin.
 */
export async function justificativaAtrasoAction(formData: FormData) {
  const usuario = await exigirUsuario("WORKER");
  const repasseId = String(formData.get("repasseId") ?? "");
  const texto = String(formData.get("texto") ?? "").trim();

  if (!texto) redirect(`/worker/bookings/${String(formData.get("bookingId") ?? "")}?erro=texto_obrigatorio`);

  const repasse = await prisma.repasseWorker.findFirst({
    where: {
      id: repasseId,
      tipo: "PONTUALIDADE",
      status: "PENDENTE",
      workerProfile: { userId: usuario.id },
    },
  });
  if (!repasse) redirect(`/worker/bookings/${String(formData.get("bookingId") ?? "")}`);

  const prazoFinal = repasse.criadoEm.getTime() + JUSTIFICATIVA_ATRASO_PRAZO_HORAS * 60 * 60 * 1000;
  if (Date.now() > prazoFinal) {
    redirect(`/worker/bookings/${String(formData.get("bookingId") ?? "")}?erro=prazo_expirado`);
  }

  await prisma.repasseWorker.update({
    where: { id: repasse.id },
    data: {
      justificativaTexto: texto,
      justificativaDataEnvio: new Date(),
      status: "EM_ANALISE",
    },
  });

  revalidatePath(`/worker/bookings/${repasse.bookingId}`);
  revalidatePath("/admin/repasses");
}

/**
 * Cancelamento pós-fechamento pelo worker (Prompt 9 / Seção 3.6 — "Cancelamento
 * tardio pelo worker"). Gravidade e reembolso dependem da proximidade da data
 * combinada: quanto mais em cima da hora, mais próximo de um no-show.
 */
export async function cancelarBookingWorkerAction(formData: FormData) {
  const usuario = await exigirUsuario("WORKER");
  const bookingId = String(formData.get("bookingId") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      budget: { worker: { userId: usuario.id } },
      status: { in: ["FECHADO", "EM_ANDAMENTO"] },
    },
    include: { budget: { include: { serviceRequest: true } } },
  });
  if (!booking) redirect(`/worker/bookings/${bookingId}`);

  const agora = new Date();
  const horasAteServico =
    (booking.budget.serviceRequest.janelaDataInicio.getTime() - agora.getTime()) / 3_600_000;

  let gravidade: "GRAVE" | "MEDIA";
  let tipoInfracao: string;
  let reembolsar: boolean;

  if (horasAteServico < CANCELAMENTO_WORKER_JANELA_GRAVE_HORAS) {
    gravidade = "GRAVE";
    tipoInfracao = "Cancelamento tardio pelo worker (menos de 24h — equivalente a no-show)";
    reembolsar = true;
  } else if (horasAteServico < CANCELAMENTO_WORKER_JANELA_MEDIA_HORAS) {
    gravidade = "GRAVE";
    tipoInfracao = "Cancelamento tardio pelo worker (menos de 72h)";
    reembolsar = false;
  } else {
    gravidade = "MEDIA";
    tipoInfracao = "Cancelamento tardio pelo worker (mais de 72h)";
    reembolsar = false;
  }

  const expiraEm = new Date(agora);
  expiraEm.setMonth(expiraEm.getMonth() + STRIKES_MEDIA_JANELA_MESES);

  await prisma.strike.create({
    data: {
      workerId: booking.budget.workerId,
      tipoInfracao,
      gravidade,
      dataOcorrencia: agora,
      expiraEm,
      observacao: motivo,
    },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELADO",
      canceladoPor: "WORKER",
      canceladoEm: agora,
      motivoCancelamento: motivo,
      canceladoAntesDoDia: false, // sempre pós-fechamento tardio nesse fluxo do worker
    },
  });
  await prisma.serviceRequest.update({
    where: { id: booking.budget.serviceRequestId },
    data: { status: "CANCELADO" },
  });

  if (reembolsar) {
    await reembolsarCliente(bookingId, "Cancelamento do profissional em cima da hora");
  }

  // A parcela de aceite (2%) já foi paga e fica com o worker; o resto nunca chega a
  // ser devido, já que o serviço não vai acontecer.
  await prisma.repasseWorker.deleteMany({ where: { bookingId, status: "PENDENTE" } });
  await recalcularEstatisticasWorker(booking.budget.workerId);

  revalidatePath(`/worker/bookings/${bookingId}`);
  revalidatePath(`/cliente/bookings/${bookingId}`);
  revalidatePath("/cliente/carteira");
  revalidatePath("/admin/strikes");
  revalidatePath("/admin");
}

/**
 * Réplica do worker contestando a nota (Seção 3.5) — só dentro da janela de
 * carência do crédito, e só se ainda não houver contestação em andamento.
 */
export async function contestarAvaliacaoAction(formData: FormData) {
  const usuario = await exigirUsuario("WORKER");
  const bookingId = String(formData.get("bookingId") ?? "");
  const texto = String(formData.get("texto") ?? "").trim();
  const foto = formData.get("foto") as File | null;

  if (!texto) redirect(`/worker/bookings/${bookingId}?erro=texto_obrigatorio`);

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, budget: { worker: { userId: usuario.id } } },
    include: { review: true, budget: true },
  });
  if (!booking || !booking.review || booking.review.statusContestacao !== "NENHUMA") {
    redirect(`/worker/bookings/${bookingId}`);
  }

  const review = booking.review;
  const prazoFinal =
    review.criadoEm.getTime() + JANELA_CARENCIA_TOKENS_DIAS * 24 * 60 * 60 * 1000;
  if (Date.now() > prazoFinal) {
    redirect(`/worker/bookings/${bookingId}?erro=prazo_expirado`);
  }

  const fotoUrl = await salvarUpload(foto);

  await prisma.review.update({
    where: { id: review.id },
    data: {
      replicaWorkerTexto: texto,
      replicaWorkerFotosJson: fotoUrl ? JSON.stringify([fotoUrl]) : null,
      replicaWorkerDataEnvio: new Date(),
      statusContestacao: "EM_ANALISE",
    },
  });

  // Enquanto em análise, a nota não conta no ranking (Seção 3.5).
  await recalcularNotaMediaWorker(booking.budget.workerId);

  revalidatePath(`/worker/bookings/${bookingId}`);
  revalidatePath(`/cliente/bookings/${bookingId}`);
}
