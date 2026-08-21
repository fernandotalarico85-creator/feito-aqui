"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashSenha, criarSessao } from "@/lib/auth";

export async function cadastrarWorkerAction(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const bio = String(formData.get("bio") ?? "").trim();
  const regiaoAtendimento = String(formData.get("regiaoAtendimento") ?? "").trim();
  const categoriaIds = formData.getAll("categoriaIds").map(String).filter(Boolean);

  if (!nome || !email || senha.length < 6 || !bio || !regiaoAtendimento) {
    redirect("/worker/cadastro?erro=dados_invalidos");
  }
  if (categoriaIds.length === 0) {
    redirect("/worker/cadastro?erro=sem_categoria");
  }

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    redirect("/worker/cadastro?erro=email_em_uso");
  }

  const senhaHash = await hashSenha(senha);

  const usuario = await prisma.user.create({
    data: {
      nome,
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
        },
      },
    },
  });

  await criarSessao(usuario.id);
  redirect("/worker");
}
