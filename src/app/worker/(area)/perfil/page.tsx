import Image from "next/image";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listarCategorias } from "@/lib/triagem";
import EnderecoCadastroFields from "@/components/EnderecoCadastroFields";
import { atualizarPerfilAction, atualizarDadosEditaveisWorkerAction } from "./actions";

const DOCUMENTO_STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Em análise",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
};

const DOCUMENTO_STATUS_CLASSE: Record<string, string> = {
  PENDENTE: "bg-amber-100 text-amber-700",
  APROVADO: "bg-emerald-100 text-emerald-700",
  REJEITADO: "bg-red-100 text-red-700",
};

const MENSAGENS_ERRO: Record<string, string> = {
  dados_invalidos: "Preencha bio, região de atendimento e selecione ao menos uma categoria.",
  dados_editaveis_invalidos: "Preencha nome, sobrenome, e-mail e todos os campos obrigatórios do endereço.",
  email_em_uso: "Esse e-mail já está sendo usado por outra conta.",
};

export default async function PerfilWorkerPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuario = await exigirUsuario("WORKER");
  const params = await searchParams;

  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
    include: { categorias: true },
  });

  const categorias = await listarCategorias();
  const categoriaIdsAtuais = new Set(worker.categorias.map((c) => c.id));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-stone-900">Meu Perfil</h1>

      {params.erro && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {MENSAGENS_ERRO[params.erro] ?? "Não foi possível salvar."}
        </p>
      )}

      {worker.statusVerificacao === "PENDENTE" && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Perfil pendente de verificação por um administrador.
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
          <dt className="text-stone-500">Documento de verificação</dt>
          <dd className="text-right">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${DOCUMENTO_STATUS_CLASSE[worker.documentoStatus]}`}
            >
              {DOCUMENTO_STATUS_LABEL[worker.documentoStatus]}
            </span>
          </dd>
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

        <form action={atualizarDadosEditaveisWorkerAction} className="mt-3 flex flex-col gap-4">
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
              logradouro: worker.enderecoLogradouro,
              numero: worker.enderecoNumero,
              complemento: worker.enderecoComplemento ?? "",
              bairro: worker.enderecoBairro,
              cidade: worker.enderecoCidade,
              estado: worker.enderecoEstado,
              cep: worker.enderecoCep,
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

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-stone-900">Dados do perfil</h2>
        <form action={atualizarPerfilAction} className="mt-3 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="regiaoAtendimento">
              Região de atendimento
            </label>
            <input
              id="regiaoAtendimento"
              name="regiaoAtendimento"
              defaultValue={worker.regiaoAtendimento}
              required
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
              defaultValue={worker.bio}
              required
              rows={3}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <p className="block text-sm font-medium text-stone-700">Categorias atendidas</p>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {categorias.map((categoria) => (
                <label key={categoria.id} className="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    name="categoriaIds"
                    value={categoria.id}
                    defaultChecked={categoriaIdsAtuais.has(categoria.id)}
                  />
                  {categoria.nome}
                </label>
              ))}
            </div>
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
