// Sem "server-only" de propósito — precisa ser importável também por
// prisma/seed.ts (script Node puro fora do bundler do Next), não só por Server
// Actions. Nunca é importado por um Client Component.
import { prisma } from "./db";

function dataAAMMDD(data: Date): string {
  const aa = String(data.getFullYear()).slice(-2);
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  const dd = String(data.getDate()).padStart(2, "0");
  return `${aa}${mm}${dd}`;
}

/**
 * Gera o próximo número sequencial do dia pra um tipo de documento (Prompt 11):
 * OS (pedido, ServiceRequest) ou PO (orçamento, Budget) — formato
 * PREFIXO-AAMMDD-NNNNN, ex.: OS-260820-00001. Reinicia em 00001 a cada dia
 * `[padrão de protótipo, ajustável]`.
 *
 * O upsert em SequenciaDiaria é uma única instrução atômica no Postgres
 * (ON CONFLICT DO UPDATE), então é seguro mesmo com criações simultâneas — não
 * precisa de lock manual nem de retry.
 */
export async function gerarNumeroDocumento(tipo: "OS" | "PO"): Promise<string> {
  const data = dataAAMMDD(new Date());

  const sequencia = await prisma.sequenciaDiaria.upsert({
    where: { tipo_data: { tipo, data } },
    create: { tipo, data, contador: 1 },
    update: { contador: { increment: 1 } },
  });

  return `${tipo}-${data}-${String(sequencia.contador).padStart(5, "0")}`;
}

/**
 * Gera o ID de cadastro sequencial (Prompt 11) — C00000001, C00000002... para
 * cliente, W00000001, W00000002... para worker. Contador GLOBAL (nunca reinicia,
 * diferente de gerarNumeroDocumento acima) — dois contadores independentes, um por
 * tipo, na tabela SequenciaCadastro. Mesmo padrão de upsert atômico.
 */
export async function gerarIdCadastro(tipo: "C" | "W"): Promise<string> {
  const sequencia = await prisma.sequenciaCadastro.upsert({
    where: { tipo },
    create: { tipo, contador: 1 },
    update: { contador: { increment: 1 } },
  });

  return `${tipo}${String(sequencia.contador).padStart(8, "0")}`;
}
