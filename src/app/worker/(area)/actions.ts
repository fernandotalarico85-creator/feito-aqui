"use server";

import { redirect } from "next/navigation";
import { encerrarSessao } from "@/lib/auth";

export async function sairWorkerAction() {
  await encerrarSessao();
  redirect("/");
}
