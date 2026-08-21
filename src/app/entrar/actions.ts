"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verificarSenha, criarSessao } from "@/lib/auth";

export async function entrarAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    redirect("/entrar?erro=credenciais");
  }

  const usuario = await prisma.user.findUnique({ where: { email } });
  if (!usuario || !(await verificarSenha(senha, usuario.senhaHash))) {
    redirect("/entrar?erro=credenciais");
  }

  await criarSessao(usuario.id);

  if (usuario.tipo === "CLIENTE") redirect("/cliente/pedidos");
  if (usuario.tipo === "WORKER") redirect("/worker");
  redirect("/admin");
}
