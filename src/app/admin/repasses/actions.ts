"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";

/**
 * Decisão do admin sobre uma justificativa de atraso no check-in (Prompt 9 —
 * ajuste pedido pelo usuário): libera a parcela de pontualidade na hora, agenda a
 * liberação pra daqui a X dias, ou — se o admin não fizer nada — ela cai no fallback
 * e libera sozinha junto com a parcela de conclusão (ver src/lib/repasses.ts).
 */
export async function decidirRepasseAction(formData: FormData) {
  const admin = await exigirUsuario("ADMIN");
  const repasseId = String(formData.get("repasseId") ?? "");
  const modo = String(formData.get("modo") ?? "");
  const dias = Number(formData.get("dias") ?? "0");

  const repasse = await prisma.repasseWorker.findFirst({
    where: { id: repasseId, status: "EM_ANALISE" },
  });
  if (!repasse) redirect("/admin/repasses");

  const agora = new Date();

  if (modo === "AGORA") {
    await prisma.repasseWorker.update({
      where: { id: repasse.id },
      data: { status: "LIBERADO", liberadoEm: agora },
    });
  } else if (modo === "DIAS" && Number.isFinite(dias) && dias > 0) {
    const liberadoEm = new Date(agora.getTime() + dias * 24 * 60 * 60 * 1000);
    await prisma.repasseWorker.update({
      where: { id: repasse.id },
      data: { status: "CARENCIA", liberadoEm },
    });
  } else {
    redirect("/admin/repasses?erro=dados_invalidos");
  }

  await prisma.dispute.create({
    data: {
      repasseId: repasse.id,
      decisao:
        modo === "AGORA"
          ? "Parcela de pontualidade liberada imediatamente."
          : `Parcela de pontualidade agendada para liberar em ${dias} dia(s).`,
      decididoPorId: admin.id,
      dataDecisao: agora,
    },
  });

  revalidatePath("/admin/repasses");
  revalidatePath(`/worker/bookings/${repasse.bookingId}`);
  revalidatePath("/worker/ganhos");

  redirect("/admin/repasses");
}
