import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listarCategorias } from "@/lib/triagem";
import NovoPedidoForm from "./NovoPedidoForm";

const MENSAGENS_ERRO: Record<string, string> = {
  dados_invalidos: "Preencha a descrição e a janela de datas do serviço.",
  janela_invalida: "A data final precisa ser igual ou depois da data inicial.",
  categoria_invalida: "Selecione uma categoria válida.",
  endereco_invalido: "Preencha o endereço onde o serviço será realizado.",
};

export default async function NovoPedidoPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuario = await exigirUsuario("CLIENTE");
  const params = await searchParams;

  const [categorias, clientProfile] = await Promise.all([
    listarCategorias(),
    prisma.clientProfile.findUniqueOrThrow({
      where: { userId: usuario.id },
      include: { enderecos: { orderBy: { rotulo: "asc" } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-stone-900">Novo pedido</h1>
      <p className="mt-1 text-sm text-stone-500">
        Escolha a categoria do serviço — nós já sugerimos os sub-serviços envolvidos e a
        ordem recomendada de execução.
      </p>

      {params.erro && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {MENSAGENS_ERRO[params.erro] ?? "Não foi possível criar o pedido."}
        </p>
      )}

      {categorias.length === 0 ? (
        <p className="mt-6 text-stone-600">
          Nenhuma categoria cadastrada ainda. Rode o seed do banco de dados.
        </p>
      ) : (
        <NovoPedidoForm categorias={categorias} enderecos={clientProfile.enderecos} />
      )}
    </div>
  );
}
