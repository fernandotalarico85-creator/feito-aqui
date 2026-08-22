"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashSenha, criarSessao } from "@/lib/auth";
import { salvarUpload } from "@/lib/upload";
import { gerarIdCadastro } from "@/lib/numeracao";
import { cpfValido, limparCpf } from "@/lib/cpf";
import { ehUfValida } from "@/lib/uf";

export async function cadastrarClienteAction(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const sobrenome = String(formData.get("sobrenome") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

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
    !cpf ||
    !email ||
    senha.length < 6 ||
    !logradouro ||
    !numero ||
    !bairro ||
    !cidade ||
    !ehUfValida(estado) ||
    !cep
  ) {
    redirect("/cliente/cadastro?erro=dados_invalidos");
  }

  if (!cpfValido(cpf)) {
    redirect("/cliente/cadastro?erro=cpf_invalido");
  }
  const cpfLimpo = limparCpf(cpf);

  const [emailExistente, cpfExistente] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { cpf: cpfLimpo } }),
  ]);
  if (emailExistente) redirect("/cliente/cadastro?erro=email_em_uso");
  if (cpfExistente) redirect("/cliente/cadastro?erro=cpf_em_uso");

  const senhaHash = await hashSenha(senha);
  const fotoPerfilUrl = await salvarUpload(fotoPerfil);
  const idCadastro = await gerarIdCadastro("C");

  const usuario = await prisma.user.create({
    data: {
      idCadastro,
      nome,
      sobrenome,
      cpf: cpfLimpo,
      fotoPerfilUrl,
      email,
      senhaHash,
      tipo: "CLIENTE",
      clientProfile: {
        create: {
          enderecoLogradouro: logradouro,
          enderecoNumero: numero,
          enderecoComplemento: complemento,
          enderecoBairro: bairro,
          enderecoCidade: cidade,
          enderecoEstado: estado,
          enderecoCep: cep,
        },
      },
    },
  });

  await criarSessao(usuario.id);
  redirect("/cliente/pedidos");
}
