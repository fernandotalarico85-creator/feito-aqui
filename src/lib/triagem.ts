import "server-only";
import { prisma } from "./db";

export type SugestaoServicos = {
  categoria: { id: string; nome: string };
  subServicos: { id: string; nome: string; ordem: number }[];
};

/**
 * Triagem por IA (Seção 3.2 do contexto) — ponto de extensão.
 *
 * V0.1: formulário guiado. O cliente escolhe a categoria manualmente e esta função
 * apenas busca os sub-serviços já cadastrados na taxonomia, na ordem de execução
 * recomendada — não há LLM envolvido.
 *
 * Para plugar uma triagem por IA real no futuro, adicione um parâmetro
 * `descricaoLivre` opcional: quando presente, uma chamada a um LLM infere a
 * `categoriaId` mais provável a partir do texto e delega para a mesma lógica abaixo,
 * sem precisar mudar o restante do fluxo do cliente.
 */
export async function sugerirServicos(
  categoriaId: string,
): Promise<SugestaoServicos | null> {
  const categoria = await prisma.serviceCategory.findUnique({
    where: { id: categoriaId },
    include: { subServicos: { orderBy: { ordem: "asc" } } },
  });

  if (!categoria) return null;

  return {
    categoria: { id: categoria.id, nome: categoria.nome },
    subServicos: categoria.subServicos.map((s) => ({
      id: s.id,
      nome: s.nome,
      ordem: s.ordem,
    })),
  };
}

export async function listarCategorias() {
  return prisma.serviceCategory.findMany({
    orderBy: { nome: "asc" },
    include: { subServicos: { orderBy: { ordem: "asc" } } },
  });
}
