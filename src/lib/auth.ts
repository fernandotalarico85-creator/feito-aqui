import "server-only";

import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import type { TipoUsuario } from "../generated/prisma/enums";

const COOKIE_NOME = "feito_aqui_session";
const SESSAO_DURACAO_DIAS = 7;

export async function hashSenha(senha: string) {
  return bcrypt.hash(senha, 10);
}

export async function verificarSenha(senha: string, hash: string) {
  return bcrypt.compare(senha, hash);
}

export async function criarSessao(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiraEm = new Date(
    Date.now() + SESSAO_DURACAO_DIAS * 24 * 60 * 60 * 1000,
  );

  await prisma.session.create({
    data: { userId, token, expiraEm },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NOME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiraEm,
    path: "/",
  });
}

export async function encerrarSessao() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NOME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(COOKIE_NOME);
}

export async function getUsuarioLogado() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NOME)?.value;
  if (!token) return null;

  const sessao = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!sessao || sessao.expiraEm < new Date()) {
    if (sessao) await prisma.session.delete({ where: { id: sessao.id } });
    return null;
  }

  return sessao.user;
}

/**
 * Garante que existe um usuário logado do `tipo` esperado; caso contrário redireciona
 * para a tela de login. Use no topo de layouts/páginas protegidas.
 */
export async function exigirUsuario(tipo: TipoUsuario) {
  const usuario = await getUsuarioLogado();
  if (!usuario || usuario.tipo !== tipo) {
    redirect(`/entrar?tipo=${tipo.toLowerCase()}`);
  }
  return usuario;
}
