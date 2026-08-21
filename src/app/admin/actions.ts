"use server";

import { redirect } from "next/navigation";
import { encerrarSessao } from "@/lib/auth";

export async function sairAdminAction() {
  await encerrarSessao();
  redirect("/");
}
