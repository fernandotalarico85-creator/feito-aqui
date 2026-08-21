import Link from "next/link";
import { listarCategorias } from "@/lib/triagem";
import { cadastrarWorkerAction } from "./actions";

const MENSAGENS_ERRO: Record<string, string> = {
  dados_invalidos: "Preencha nome, e-mail, senha (6+ caracteres), bio e região de atendimento.",
  sem_categoria: "Selecione pelo menos uma categoria que você atende.",
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
        Cadastre-se para receber pedidos compatíveis com suas categorias e agenda.
      </p>

      {params.erro && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {MENSAGENS_ERRO[params.erro] ?? "Não foi possível concluir o cadastro."}
        </p>
      )}

      <form action={cadastrarWorkerAction} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="nome">
            Nome
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
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
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
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
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="regiaoAtendimento">
            Região de atendimento
          </label>
          <input
            id="regiaoAtendimento"
            name="regiaoAtendimento"
            type="text"
            required
            placeholder="Ex.: São Paulo - Zona Sul"
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="bio">
            Sobre você
          </label>
          <textarea
            id="bio"
            name="bio"
            required
            rows={3}
            placeholder="Experiência, especialidades, tempo de atuação..."
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <p className="block text-sm font-medium text-stone-700">Categorias atendidas</p>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {categorias.map((categoria) => (
              <label key={categoria.id} className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" name="categoriaIds" value={categoria.id} />
                {categoria.nome}
              </label>
            ))}
          </div>
        </div>

        <p className="text-xs text-stone-400">
          Sua conta começa como &ldquo;pendente de verificação&rdquo; — um administrador precisa
          aprovar seu perfil antes que você apareça nos resultados dos clientes.
        </p>

        <button
          type="submit"
          className="mt-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
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
