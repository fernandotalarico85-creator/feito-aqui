"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { salvarUpload } from "@/lib/upload";
import { strikeEhContestavel } from "@/lib/strikes";

export async function contestarStrikeAction(formData: FormData) {
  const usuario = await exigirUsuario("WORKER");
  const strikeId = String(formData.get("strikeId") ?? "");
  const texto = String(formData.get("texto") ?? "").trim();
  const foto = formData.get("foto") as File | null;

  if (!texto) redirect("/worker/strikes?erro=texto_obrigatorio");

  const strike = await prisma.strike.findFirst({
    where: { id: strikeId, worker: { userId: usuario.id } },
  });
  if (!strike) redirect("/worker/strikes");

  // Gravíssima nunca contesta, e a checagem é feita aqui — não só escondendo o botão.
  if (!strikeEhContestavel(strike)) {
    redirect("/worker/strikes?erro=nao_contestavel");
  }

  const fotoUrl = await salvarUpload(foto);

  await prisma.strike.update({
    where: { id: strike.id },
    data: {
      replicaTexto: texto,
      replicaFotosJson: fotoUrl ? JSON.stringify([fotoUrl]) : null,
      replicaDataEnvio: new Date(),
      statusContestacao: "EM_ANALISE",
    },
  });

  revalidatePath("/worker/strikes");
  revalidatePath("/admin/disputas");
}
