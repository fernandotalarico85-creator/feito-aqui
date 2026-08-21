"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";

/**
 * "Verificação de antecedentes / KYC completo" está fora de escopo da v0.1 (contexto,
 * Seção 4) — só existe esse campo de status manual que o admin aprova.
 */
export async function alternarVerificacaoAction(formData: FormData) {
  await exigirUsuario("ADMIN");
  const workerProfileId = String(formData.get("workerProfileId") ?? "");
  const statusAtual = String(formData.get("statusAtual") ?? "");

  await prisma.workerProfile.update({
    where: { id: workerProfileId },
    data: { statusVerificacao: statusAtual === "VERIFICADO" ? "PENDENTE" : "VERIFICADO" },
  });

  revalidatePath("/admin/workers");
  revalidatePath("/admin");
}
