"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { salvarUpload } from "@/lib/upload";
import { ehUfValida } from "@/lib/uf";

/**
 * Edição de perfil do cliente (Prompts 11 e 13) — nome, sobrenome, e-mail, endereço e
 * foto de perfil podem ser alterados a qualquer momento; só CPF e ID de cadastro ficam
 * permanentemente bloqueados, sem tela de edição no protótipo.
 */
export async function atualizarPerfilClienteAction(formData: FormData) {
  const usuario = await exigirUsuario("CLIENTE");
  const cliente = await prisma.clientProfile.findUniqueOrThrow({
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
    redirect("/cliente/perfil?erro=dados_invalidos");
  }

  if (email !== usuario.email) {
    const emailExistente = await prisma.user.findUnique({ where: { email } });
    if (emailExistente) redirect("/cliente/perfil?erro=email_em_uso");
  }

  const fotoPerfilUrl = await salvarUpload(fotoPerfil);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: usuario.id },
      data: { nome, sobrenome, email, ...(fotoPerfilUrl ? { fotoPerfilUrl } : {}) },
    }),
    prisma.clientProfile.update({
      where: { id: cliente.id },
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

  revalidatePath("/cliente/perfil");
}
