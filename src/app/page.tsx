import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center bg-stone-50 px-6 py-16">
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Feito Aqui</h1>
        <p className="mx-auto mt-3 max-w-xl text-stone-600">
          Protótipo de demonstração (v0.1) de um marketplace de serviços sob demanda,
          começando pela vertical de reforma/construção civil. O cliente descreve o
          serviço, é recomendada uma lista de profissionais rankeados, os dois fecham um
          orçamento dentro do app e acompanham o serviço até a conclusão e avaliação.
        </p>
      </div>

      <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-stone-200 bg-white p-5 text-left">
          <h2 className="text-sm font-semibold text-stone-900">Cliente</h2>
          <p className="mt-1.5 text-sm text-stone-500">
            Descreve o que precisa, recebe orçamentos, fecha o serviço, acompanha o
            check-in/check-out e avalia ao final.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/entrar?tipo=cliente"
              className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
            >
              Entrar
            </Link>
            <Link
              href="/cliente/cadastro"
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              Criar conta
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-5 text-left">
          <h2 className="text-sm font-semibold text-stone-900">Profissional</h2>
          <p className="mt-1.5 text-sm text-stone-500">
            Gerencia agenda e portfólio, responde pedidos compatíveis com orçamentos e
            faz o check-in/check-out do serviço.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/entrar?tipo=worker"
              className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
            >
              Entrar
            </Link>
            <Link
              href="/worker/cadastro"
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              Criar conta
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-5 text-left">
          <h2 className="text-sm font-semibold text-stone-900">Admin</h2>
          <p className="mt-1.5 text-sm text-stone-500">
            Verifica profissionais, resolve disputas de avaliação e registra
            penalidades (strikes).
          </p>
          <div className="mt-4">
            <Link
              href="/entrar?tipo=admin"
              className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
            >
              Entrar
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-10 text-xs text-stone-400">
        Protótipo local — as credenciais de teste ficam na própria tela de login.
      </p>
    </main>
  );
}
