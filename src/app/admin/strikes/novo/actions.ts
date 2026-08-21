"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { TABELA_INFRACOES } from "@/lib/infracoes";
import { STRIKES_MEDIA_JANELA_MESES } from "@/lib/config";
import { reembolsarCliente } from "@/lib/reembolso";
import { recalcularEstatisticasWorker } from "@/lib/estatisticasWorker";

const GRAVIDADES_VALIDAS = ["MEDIA", "GRAVE", "GRAVISSIMA"] as const;
const TIPO_NO_SHOW = "No-show (sem check-in)";

export async function registrarStrikeAction(formData: FormData) {
  await exigirUsuario("ADMIN");

  const alvoTipo = String(formData.get("alvoTipo") ?? "");
  const alvoId = String(formData.get("alvoId") ?? "");
  const tipoInfracao = String(formData.get("tipoInfracao") ?? "");
  const gravidade = String(formData.get("gravidade") ?? "");
  const observacao = String(formData.get("observacao") ?? "").trim() || null;

  const infracaoValida = TABELA_INFRACOES.some((i) => i.tipo === tipoInfracao);
  const gravidadeValida = (GRAVIDADES_VALIDAS as readonly string[]).includes(gravidade);

  if (
    !alvoId ||
    (alvoTipo !== "WORKER" && alvoTipo !== "CLIENTE") ||
    !infracaoValida ||
    !gravidadeValida
  ) {
    redirect("/admin/strikes/novo?erro=dados_invalidos");
  }

  const dataOcorrencia = new Date();
  const expiraEm = new Date(dataOcorrencia);
  expiraEm.setMonth(expiraEm.getMonth() + STRIKES_MEDIA_JANELA_MESES);

  await prisma.strike.create({
    data: {
      workerId: alvoTipo === "WORKER" ? alvoId : null,
      clientProfileId: alvoTipo === "CLIENTE" ? alvoId : null,
      tipoInfracao,
      gravidade: gravidade as (typeof GRAVIDADES_VALIDAS)[number],
      dataOcorrencia,
      expiraEm,
      observacao,
    },
  });

  // No-show manual: se o admin escolheu um booking, dispara reembolso + cancela o
  // booking + recalcula comparecimento, igual ao fluxo automático (Seção 3.6).
  if (tipoInfracao === TIPO_NO_SHOW && alvoTipo === "WORKER") {
    const bookingId = String(formData.get("bookingId") ?? "");
    const booking = bookingId
      ? await prisma.booking.findFirst({
          where: {
            id: bookingId,
            checkInHorario: null,
            status: { in: ["FECHADO", "EM_ANDAMENTO"] },
            budget: { workerId: alvoId },
          },
          include: { budget: true },
        })
      : null;

    if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELADO",
          canceladoPor: "WORKER",
          canceladoEm: dataOcorrencia,
          motivoCancelamento: "No-show — registrado manualmente pelo admin",
          canceladoAntesDoDia: false,
        },
      });
      await prisma.serviceRequest.update({
        where: { id: booking.budget.serviceRequestId },
        data: { status: "CANCELADO" },
      });
      await reembolsarCliente(booking.id, "No-show do profissional (registrado pelo admin)");
      await prisma.repasseWorker.deleteMany({
        where: { bookingId: booking.id, status: "PENDENTE" },
      });
      await recalcularEstatisticasWorker(alvoId);

      revalidatePath(`/cliente/bookings/${booking.id}`);
      revalidatePath(`/worker/bookings/${booking.id}`);
      revalidatePath("/cliente/carteira");
    }
  }

  redirect("/admin/strikes");
}
