"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashSenha, criarSessao } from "@/lib/auth";

export async function cadastrarClienteAction(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!nome || !email || senha.length < 6) {
    redirect("/cliente/cadastro?erro=dados_invalidos");
  }

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    redirect("/cliente/cadastro?erro=email_em_uso");
  }

  const senhaHash = await hashSenha(senha);

  const usuario = await prisma.user.create({
    data: {
      nome,
      email,
      senhaHash,
      tipo: "CLIENTE",
      clientProfile: { create: {} },
    },
  });

  await criarSessao(usuario.id);
  redirect("/cliente/pedidos");
}
