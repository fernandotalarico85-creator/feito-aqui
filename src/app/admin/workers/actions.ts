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

/**
 * Decisão do admin sobre o documento de verificação de identidade enviado no
 * cadastro (Prompt 11) — sem OCR/validação automática, é uma revisão manual.
 */
export async function decidirDocumentoAction(formData: FormData) {
  await exigirUsuario("ADMIN");
  const workerProfileId = String(formData.get("workerProfileId") ?? "");
  const decisao = String(formData.get("decisao") ?? "");

  if (decisao !== "APROVADO" && decisao !== "REJEITADO") return;

  await prisma.workerProfile.update({
    where: { id: workerProfileId },
    data: { documentoStatus: decisao as "APROVADO" | "REJEITADO" },
  });

  revalidatePath("/admin/workers");
  revalidatePath("/admin");
}
