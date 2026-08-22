"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashSenha, criarSessao } from "@/lib/auth";
import { salvarUpload } from "@/lib/upload";
import { gerarIdCadastro } from "@/lib/numeracao";
import { cpfValido, limparCpf } from "@/lib/cpf";
import { ehUfValida } from "@/lib/uf";

export async function cadastrarWorkerAction(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const sobrenome = String(formData.get("sobrenome") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const bio = String(formData.get("bio") ?? "").trim();
  const regiaoAtendimento = String(formData.get("regiaoAtendimento") ?? "").trim();
  const categoriaIds = formData.getAll("categoriaIds").map(String).filter(Boolean);

  const logradouro = String(formData.get("logradouro") ?? "").trim();
  const numero = String(formData.get("numero") ?? "").trim();
  const complemento = String(formData.get("complemento") ?? "").trim() || null;
  const bairro = String(formData.get("bairro") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim();
  const estado = String(formData.get("estado") ?? "").trim().toUpperCase();
  const cep = String(formData.get("cep") ?? "").trim();

  const fotoPerfil = formData.get("fotoPerfil") as File | null;

  const tipoDocumento = String(formData.get("tipoDocumento") ?? "");
  const documento1 = formData.get("documento1") as File | null;
  const documento2 = formData.get("documento2") as File | null;

  if (
    !nome ||
    !sobrenome ||
    !cpf ||
    !email ||
    senha.length < 6 ||
    !bio ||
    !regiaoAtendimento ||
    !logradouro ||
    !numero ||
    !bairro ||
    !cidade ||
    !ehUfValida(estado) ||
    !cep
  ) {
    redirect("/worker/cadastro?erro=dados_invalidos");
  }
  if (categoriaIds.length === 0) {
    redirect("/worker/cadastro?erro=sem_categoria");
  }
  if (!cpfValido(cpf)) {
    redirect("/worker/cadastro?erro=cpf_invalido");
  }
  if (
    (tipoDocumento !== "CNH" &&
      tipoDocumento !== "RG_COM_CPF" &&
      tipoDocumento !== "RG_E_CPF_SEPARADOS") ||
    !documento1 ||
    documento1.size === 0 ||
    (tipoDocumento === "RG_E_CPF_SEPARADOS" && (!documento2 || documento2.size === 0))
  ) {
    redirect("/worker/cadastro?erro=sem_documento");
  }
  const cpfLimpo = limparCpf(cpf);

  const [emailExistente, cpfExistente] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { cpf: cpfLimpo } }),
  ]);
  if (emailExistente) redirect("/worker/cadastro?erro=email_em_uso");
  if (cpfExistente) redirect("/worker/cadastro?erro=cpf_em_uso");

  const senhaHash = await hashSenha(senha);
  const fotoPerfilUrl = await salvarUpload(fotoPerfil);
  const documentoUrl1 = await salvarUpload(documento1);
  const documentoUrl2 = tipoDocumento === "RG_E_CPF_SEPARADOS" ? await salvarUpload(documento2) : null;
  const idCadastro = await gerarIdCadastro("W");

  const usuario = await prisma.user.create({
    data: {
      idCadastro,
      nome,
      sobrenome,
      cpf: cpfLimpo,
      fotoPerfilUrl,
      email,
      senhaHash,
      tipo: "WORKER",
      workerProfile: {
        create: {
          bio,
          regiaoAtendimento,
          // Verificação manual pelo admin (Seção 3.7) — worker começa pendente e só
          // aparece no ranking do cliente depois de verificado.
          statusVerificacao: "PENDENTE",
          categorias: { connect: categoriaIds.map((id) => ({ id })) },
          enderecoLogradouro: logradouro,
          enderecoNumero: numero,
          enderecoComplemento: complemento,
          enderecoBairro: bairro,
          enderecoCidade: cidade,
          enderecoEstado: estado,
          enderecoCep: cep,
          tipoDocumento: tipoDocumento as "CNH" | "RG_COM_CPF" | "RG_E_CPF_SEPARADOS",
          documentoUrl1: documentoUrl1!,
          documentoUrl2,
          documentoStatus: "PENDENTE",
        },
      },
    },
  });

  await criarSessao(usuario.id);
  redirect("/worker");
}
