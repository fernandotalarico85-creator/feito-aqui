"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { salvarUpload } from "@/lib/upload";
import { ehUfValida } from "@/lib/uf";

export async function atualizarPerfilAction(formData: FormData) {
  const usuario = await exigirUsuario("WORKER");
  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  const bio = String(formData.get("bio") ?? "").trim();
  const regiaoAtendimento = String(formData.get("regiaoAtendimento") ?? "").trim();
  const categoriaIds = formData.getAll("categoriaIds").map(String).filter(Boolean);

  if (!bio || !regiaoAtendimento || categoriaIds.length === 0) {
    redirect("/worker/perfil?erro=dados_invalidos");
  }

  await prisma.workerProfile.update({
    where: { id: worker.id },
    data: {
      bio,
      regiaoAtendimento,
      categorias: { set: categoriaIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/worker/perfil");
}

/**
 * Edição de perfil do worker (Prompts 11 e 13) — nome, sobrenome, e-mail, endereço e
 * foto de perfil podem ser alterados a qualquer momento; só CPF e ID de cadastro ficam
 * permanentemente bloqueados, sem tela de edição no protótipo.
 */
export async function atualizarDadosEditaveisWorkerAction(formData: FormData) {
  const usuario = await exigirUsuario("WORKER");
  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  const nome = String(formData.get("nome") ?? "").trim();
  const sobrenome = String(formData.get("sobrenome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const logradouro = String(formData.get("logradouro") ?? "").trim();
  const numero = String(formData.get("numero") ?? "").trim();
  const complemento = String(formData.get("complemento") ?? "").trim() || null;
  const bairro = String(formData.get("bairro") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim();
  const estado = String(formData.get("estado") ?? "").trim().toUpperCase();
  const cep = String(formData.get("cep") ?? "").trim();
  const fotoPerfil = formData.get("fotoPerfil") as File | null;

  if (
    !nome ||
    !sobrenome ||
    !email ||
    !logradouro ||
    !numero ||
    !bairro ||
    !cidade ||
    !ehUfValida(estado) ||
    !cep
  ) {
    redirect("/worker/perfil?erro=dados_editaveis_invalidos");
  }

  if (email !== usuario.email) {
    const emailExistente = await prisma.user.findUnique({ where: { email } });
    if (emailExistente) redirect("/worker/perfil?erro=email_em_uso");
  }

  const fotoPerfilUrl = await salvarUpload(fotoPerfil);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: usuario.id },
      data: { nome, sobrenome, email, ...(fotoPerfilUrl ? { fotoPerfilUrl } : {}) },
    }),
    prisma.workerProfile.update({
      where: { id: worker.id },
      data: {
        enderecoLogradouro: logradouro,
        enderecoNumero: numero,
        enderecoComplemento: complemento,
        enderecoBairro: bairro,
        enderecoCidade: cidade,
        enderecoEstado: estado,
        enderecoCep: cep,
      },
    }),
  ]);

  revalidatePath("/worker/perfil");
}
