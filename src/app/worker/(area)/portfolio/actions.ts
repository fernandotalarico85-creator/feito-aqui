"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { salvarUpload } from "@/lib/upload";

export async function adicionarPortfolioAction(formData: FormData) {
  const usuario = await exigirUsuario("WORKER");
  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  const origem = String(formData.get("origem") ?? "EXTERNO") === "PLATAFORMA" ? "PLATAFORMA" : "EXTERNO";
  const fotoAntes = formData.get("fotoAntes") as File | null;
  const fotoDepois = formData.get("fotoDepois") as File | null;

  const fotoAntesUrl = await salvarUpload(fotoAntes);
  if (!fotoAntesUrl) {
    redirect("/worker/portfolio?erro=sem_foto");
  }
  const fotoDepoisUrl = await salvarUpload(fotoDepois);

  if (origem === "PLATAFORMA") {
    const bookingId = String(formData.get("bookingId") ?? "");
    // Só aceita bookings concluídos, do próprio worker, ainda sem post vinculado —
    // evita que ele "empreste" a nota de uma obra de outro profissional.
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        status: "CONCLUIDO",
        budget: { workerId: worker.id },
        portfolioItem: null,
      },
    });
    if (!booking) {
      redirect("/worker/portfolio?erro=obra_invalida");
    }

    await prisma.portfolioItem.create({
      data: {
        workerProfileId: worker.id,
        origem: "PLATAFORMA",
        bookingId: booking.id,
        fotoAntesUrl,
        fotoDepoisUrl,
      },
    });
  } else {
    const descricao = String(formData.get("descricao") ?? "").trim() || null;

    await prisma.portfolioItem.create({
      data: {
        workerProfileId: worker.id,
        origem: "EXTERNO",
        fotoAntesUrl,
        fotoDepoisUrl,
        descricao,
      },
    });
  }

  revalidatePath("/worker/portfolio");
}

/**
 * Promove uma foto de serviço (enviada no check-out, Seção 3.8) direto pro portfólio
 * — sem re-upload, já que a foto já está salva. Cobre a opção "publicar depois" do
 * momento da conclusão.
 */
export async function publicarFotoServicoAction(formData: FormData) {
  const usuario = await exigirUsuario("WORKER");
  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  const servicePhotoId = String(formData.get("servicePhotoId") ?? "");

  const foto = await prisma.servicePhoto.findFirst({
    where: {
      id: servicePhotoId,
      booking: { status: "CONCLUIDO", budget: { workerId: worker.id }, portfolioItem: null },
    },
  });
  if (!foto) redirect("/worker/portfolio?erro=obra_invalida");

  await prisma.portfolioItem.create({
    data: {
      workerProfileId: worker.id,
      origem: "PLATAFORMA",
      bookingId: foto.bookingId,
      fotoDepoisUrl: foto.url,
    },
  });

  revalidatePath("/worker/portfolio");
}
