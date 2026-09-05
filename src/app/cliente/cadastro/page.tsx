import Link from "next/link";
import { cadastrarClienteAction } from "./actions";
import EnderecoCadastroFields from "@/components/EnderecoCadastroFields";

const MENSAGENS_ERRO: Record<string, string> = {
  dados_invalidos: "Preencha todos os campos obrigatórios (todos exceto a foto de perfil).",
  cpf_invalido: "Informe um CPF válido (11 dígitos).",
  cpf_em_uso: "Já existe uma conta com esse CPF.",
  email_em_uso: "Já existe uma conta com esse e-mail.",
};

export default async function CadastroClientePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 text-sm text-stone-500 hover:underline">
        ← Feito Aqui
      </Link>

      <h1 className="text-2xl font-semibold text-stone-900">Criar conta de cliente</h1>
      <p className="mt-1 text-sm text-stone-500">
        Cadastre-se para descrever seu serviço e receber orçamentos. Todos os campos são
        obrigatórios, exceto a foto de perfil.
      </p>

      {params.erro && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {MENSAGENS_ERRO[params.erro] ?? "Não foi possível concluir o cadastro."}
        </p>
      )}

      <form action={cadastrarClienteAction} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="nome">
              Nome
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              required
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="sobrenome">
              Sobrenome
            </label>
            <input
              id="sobrenome"
              name="sobrenome"
              type="text"
              required
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="cpf">
            CPF
          </label>
          <input
            id="cpf"
            name="cpf"
            type="text"
            required
            placeholder="000.000.000-00"
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-stone-700">Endereço</p>
          <div className="mt-1">
            <EnderecoCadastroFields />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="fotoPerfil">
            Foto de perfil (opcional)
          </label>
          <input
            id="fotoPerfil"
            name="fotoPerfil"
            type="file"
            accept="image/*"
            className="mt-1 text-sm"
          />
        </div>

        <button
          type="submit"
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Criar conta
        </button>
      </form>

      <p className="mt-6 text-sm text-stone-500">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-medium text-stone-900 underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
