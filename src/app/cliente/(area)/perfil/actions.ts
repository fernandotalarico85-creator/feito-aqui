"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { salvarUpload } from "@/lib/upload";
import { ehUfValida } from "@/lib/uf";

/**
 * Edição de perfil do cliente (Prompt 11) — só endereço e foto de perfil podem ser
 * alterados depois do cadastro; nome/sobrenome/CPF/e-mail ficam somente leitura,
 * sem tela de alteração no protótipo.
 */
export async function atualizarPerfilClienteAction(formData: FormData) {
  const usuario = await exigirUsuario("CLIENTE");
  const cliente = await prisma.clientProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  const logradouro = String(formData.get("logradouro") ?? "").trim();
  const numero = String(formData.get("numero") ?? "").trim();
  const complemento = String(formData.get("complemento") ?? "").trim() || null;
  const bairro = String(formData.get("bairro") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim();
  const estado = String(formData.get("estado") ?? "").trim().toUpperCase();
  const cep = String(formData.get("cep") ?? "").trim();
  const fotoPerfil = formData.get("fotoPerfil") as File | null;

  if (!logradouro || !numero || !bairro || !cidade || !ehUfValida(estado) || !cep) {
    redirect("/cliente/perfil?erro=dados_invalidos");
  }

  const fotoPerfilUrl = await salvarUpload(fotoPerfil);

  await prisma.$transaction([
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
    ...(fotoPerfilUrl
      ? [prisma.user.update({ where: { id: usuario.id }, data: { fotoPerfilUrl } })]
      : []),
  ]);

  revalidatePath("/cliente/perfil");
}
