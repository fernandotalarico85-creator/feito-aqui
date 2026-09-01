import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listarCategorias } from "@/lib/triagem";
import PerfilCard from "@/components/PerfilCard";
import { manropePerfil, interPerfil } from "@/lib/fontsPerfil";
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
    <div className="mx-auto max-w-3xl">
      <h1 className={`${manropePerfil.className} text-2xl font-extrabold text-[#243138]`}>
        Meu Perfil
      </h1>

      {params.erro && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {MENSAGENS_ERRO[params.erro] ?? "Não foi possível salvar."}
        </p>
      )}

      {worker.statusVerificacao === "PENDENTE" && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Perfil pendente de verificação por um administrador.
        </p>
      )}

      <div className="mt-6">
        <PerfilCard
          tipo="WORKER"
          idCadastro={usuario.idCadastro}
          nome={usuario.nome}
          sobrenome={usuario.sobrenome}
          email={usuario.email}
          cpf={usuario.cpf}
          fotoPerfilUrl={usuario.fotoPerfilUrl}
          categorias={worker.categorias.map((c) => c.nome)}
          documentoStatusLabel={DOCUMENTO_STATUS_LABEL[worker.documentoStatus]}
          documentoStatusClasse={DOCUMENTO_STATUS_CLASSE[worker.documentoStatus]}
          endereco={{
            logradouro: worker.enderecoLogradouro,
            numero: worker.enderecoNumero,
            complemento: worker.enderecoComplemento,
            bairro: worker.enderecoBairro,
            cidade: worker.enderecoCidade,
            estado: worker.enderecoEstado,
            cep: worker.enderecoCep,
          }}
          minhaCarteiraHref="/worker/ganhos"
          updateAction={atualizarDadosEditaveisWorkerAction}
        />
      </div>

      <section className={`${interPerfil.className} mt-6 rounded-2xl border border-[#E7EEF0] bg-white p-5 shadow-md`}>
        <h2 className={`${manropePerfil.className} text-base font-extrabold text-[#1F4E5F]`}>
          Dados do perfil
        </h2>
        <form action={atualizarPerfilAction} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[#243138]" htmlFor="regiaoAtendimento">
              Região de atendimento
            </label>
            <input
              id="regiaoAtendimento"
              name="regiaoAtendimento"
              defaultValue={worker.regiaoAtendimento}
              required
              className="mt-1 w-full rounded-lg border border-[#d7e0e2] px-3 py-2 text-sm focus:border-[#3F7C8A] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#243138]" htmlFor="bio">
              Sobre você
            </label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={worker.bio}
              required
              rows={3}
              className="mt-1 w-full rounded-lg border border-[#d7e0e2] px-3 py-2 text-sm focus:border-[#3F7C8A] focus:outline-none"
            />
          </div>
          <div>
            <p className="block text-sm font-medium text-[#243138]">Categorias atendidas</p>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {categorias.map((categoria) => (
                <label key={categoria.id} className="flex items-center gap-2 text-sm text-[#243138]">
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
            className={`${manropePerfil.className} self-start rounded-xl bg-[#1F4E5F] px-4 py-2 text-sm font-bold text-white hover:opacity-90`}
          >
            Salvar alterações
          </button>
        </form>
      </section>
    </div>
  );
}
