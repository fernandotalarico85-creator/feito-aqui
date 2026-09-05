import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PerfilCard from "@/components/PerfilCard";
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
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold text-stone-900">Meu perfil</h1>

      {params.erro && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {MENSAGENS_ERRO[params.erro] ?? "Não foi possível salvar."}
        </p>
      )}

      <div className="mt-6">
        <PerfilCard
          tipo="CLIENTE"
          idCadastro={usuario.idCadastro}
          nome={usuario.nome}
          sobrenome={usuario.sobrenome}
          email={usuario.email}
          cpf={usuario.cpf}
          fotoPerfilUrl={usuario.fotoPerfilUrl}
          endereco={{
            logradouro: cliente.enderecoLogradouro,
            numero: cliente.enderecoNumero,
            complemento: cliente.enderecoComplemento,
            bairro: cliente.enderecoBairro,
            cidade: cliente.enderecoCidade,
            estado: cliente.enderecoEstado,
            cep: cliente.enderecoCep,
          }}
          minhaCarteiraHref="/cliente/carteira"
          updateAction={atualizarPerfilClienteAction}
        />
      </div>
    </div>
  );
}
