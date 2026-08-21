"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";

export async function alternarDisponibilidadeAction(formData: FormData) {
  const usuario = await exigirUsuario("WORKER");
  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  const data = new Date(String(formData.get("data")));
  const disponivelAtual = formData.get("disponivelAtual") === "true";

  await prisma.agendaDia.upsert({
    where: { workerProfileId_data: { workerProfileId: worker.id, data } },
    update: { disponivel: !disponivelAtual },
    create: { workerProfileId: worker.id, data, disponivel: !disponivelAtual },
  });

  revalidatePath("/worker/agenda");
}
