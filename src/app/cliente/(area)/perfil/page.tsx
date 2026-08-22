import Image from "next/image";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import EnderecoCadastroFields from "@/components/EnderecoCadastroFields";
import { atualizarPerfilClienteAction } from "./actions";

const MENSAGENS_ERRO: Record<string, string> = {
  dados_invalidos: "Preencha nome, sobrenome, e-mail e todos os campos obrigatórios do endereço.",
  email_em_uso: "Esse e-mail já está sendo usado por outra conta.",
};

export default async function PerfilClientePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuario = await exigirUsuario("CLIENTE");
  const params = await searchParams;

  const cliente = await prisma.clientProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-stone-900">Meu perfil</h1>

      {params.erro && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {MENSAGENS_ERRO[params.erro] ?? "Não foi possível salvar."}
        </p>
      )}

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">Dados de cadastro</h2>
        <p className="mt-1 text-xs text-stone-400">
          Esses dados não podem ser alterados no protótipo — fale com um administrador se
          precisar corrigir algo.
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-stone-500">ID de cadastro</dt>
          <dd className="text-right font-mono text-stone-900">{usuario.idCadastro}</dd>
          <dt className="text-stone-500">CPF</dt>
          <dd className="text-right text-stone-900">{usuario.cpf}</dd>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">Dados editáveis</h2>
        <p className="mt-1 text-xs text-stone-500">
          Nome, sobrenome, e-mail, endereço e foto de perfil você pode atualizar quando quiser.
        </p>

        {usuario.fotoPerfilUrl && (
          <div className="relative mt-3 h-20 w-20 overflow-hidden rounded-full">
            <Image src={usuario.fotoPerfilUrl} alt="Foto de perfil" fill unoptimized className="object-cover" />
          </div>
        )}

        <form action={atualizarPerfilClienteAction} className="mt-3 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700" htmlFor="nome">
                Nome
              </label>
              <input
                id="nome"
                name="nome"
                defaultValue={usuario.nome}
                required
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700" htmlFor="sobrenome">
                Sobrenome
              </label>
              <input
                id="sobrenome"
                name="sobrenome"
                defaultValue={usuario.sobrenome}
                required
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={usuario.email}
              required
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>

          <EnderecoCadastroFields
            defaultValues={{
              logradouro: cliente.enderecoLogradouro,
              numero: cliente.enderecoNumero,
              complemento: cliente.enderecoComplemento ?? "",
              bairro: cliente.enderecoBairro,
              cidade: cliente.enderecoCidade,
              estado: cliente.enderecoEstado,
              cep: cliente.enderecoCep,
            }}
          />
          <div>
            <label className="block text-xs font-medium text-stone-600" htmlFor="fotoPerfil">
              Trocar foto de perfil (opcional)
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
            className="self-start rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            Salvar alterações
          </button>
        </form>
      </section>
    </div>
  );
}
