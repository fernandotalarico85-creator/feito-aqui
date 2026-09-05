import Link from "next/link";
import { entrarAction } from "./actions";

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; erro?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 text-sm text-stone-500 hover:underline">
        ← Feito Aqui
      </Link>

      <h1 className="text-2xl font-semibold text-stone-900">Entrar</h1>
      <p className="mt-1 text-sm text-stone-500">
        {params.tipo
          ? `Faça login como ${params.tipo} para continuar.`
          : "Use um dos usuários de teste criados pelo seed."}
      </p>

      {params.erro && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          E-mail ou senha inválidos.
        </p>
      )}

      <form action={entrarAction} className="mt-6 flex flex-col gap-4">
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
            placeholder="cliente1@feitoaqui.com"
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
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
            placeholder="senha123"
          />
        </div>
        <button
          type="submit"
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Entrar
        </button>
      </form>

      <p className="mt-6 text-sm text-stone-500">
        Ainda não tem conta?{" "}
        <Link href="/cliente/cadastro" className="font-medium text-stone-900 underline">
          Cliente
        </Link>{" "}
        ·{" "}
        <Link href="/worker/cadastro" className="font-medium text-stone-900 underline">
          Profissional
        </Link>
      </p>

      <details className="mt-8 rounded-md border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
        <summary className="cursor-pointer font-medium text-stone-700">
          Credenciais de teste (protótipo local)
        </summary>
        <p className="mt-2 text-stone-500">Senha para todos: senha123</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="font-medium text-stone-700">Clientes</p>
            <ul className="mt-1 space-y-0.5">
              <li>cliente1@feitoaqui.com</li>
              <li>cliente2@feitoaqui.com</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-stone-700">Workers</p>
            <ul className="mt-1 space-y-0.5">
              <li>worker1@feitoaqui.com (verificado, nota 4.8)</li>
              <li>worker2@feitoaqui.com (destaque pago)</li>
              <li>worker3@feitoaqui.com (verificado)</li>
              <li>worker4@feitoaqui.com (pendente verificação)</li>
              <li>worker5@feitoaqui.com (novo, cold start)</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-stone-700">Admin</p>
            <ul className="mt-1 space-y-0.5">
              <li>admin@feitoaqui.com</li>
            </ul>
          </div>
        </div>
      </details>
    </main>
  );
}
