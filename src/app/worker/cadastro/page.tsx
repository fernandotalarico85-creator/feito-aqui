import Link from "next/link";
import { listarCategorias } from "@/lib/triagem";
import { cadastrarWorkerAction } from "./actions";
import WorkerCadastroForm from "./WorkerCadastroForm";

const MENSAGENS_ERRO: Record<string, string> = {
  dados_invalidos: "Preencha todos os campos obrigatórios (todos exceto a foto de perfil).",
  cpf_invalido: "Informe um CPF válido (11 dígitos).",
  cpf_em_uso: "Já existe uma conta com esse CPF.",
  sem_categoria: "Selecione pelo menos uma categoria que você atende.",
  sem_documento: "Envie o(s) documento(s) de verificação de identidade.",
  email_em_uso: "Já existe uma conta com esse e-mail.",
};

export default async function CadastroWorkerPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const [params, categorias] = await Promise.all([searchParams, listarCategorias()]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 text-sm text-stone-500 hover:underline">
        ← Feito Aqui
      </Link>

      <h1 className="text-2xl font-semibold text-stone-900">Criar conta de profissional</h1>
      <p className="mt-1 text-sm text-stone-500">
        Cadastre-se para receber pedidos compatíveis com suas categorias e agenda. Todos os
        campos são obrigatórios, exceto a foto de perfil.
      </p>

      {params.erro && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {MENSAGENS_ERRO[params.erro] ?? "Não foi possível concluir o cadastro."}
        </p>
      )}

      <WorkerCadastroForm action={cadastrarWorkerAction} categorias={categorias} />

      <p className="mt-6 text-sm text-stone-500">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-medium text-stone-900 underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
