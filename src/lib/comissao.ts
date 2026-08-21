import {
  COMISSAO_PERCENTUAL_TOTAL,
  WORKER_PERCENTUAL_ACEITE,
  WORKER_PERCENTUAL_PONTUALIDADE,
} from "./config";

/**
 * Cálculo da comissão — Seção 3.1 do contexto, ajustada em cima do Prompt 9: o
 * cliente paga exatamente o valor do orçamento (nunca vê nem paga uma taxa à parte).
 * A comissão de 10% sai do que o worker recebe, mas parcelada em 3 eventos — ver
 * src/lib/repasses.ts pro ciclo de vida de cada parcela.
 *
 * As constantes de percentual ficam em src/lib/config.ts — ajuste lá, não aqui.
 */
export type ResultadoComissao = {
  valorOrcamento: number;
  totalPagoPeloCliente: number; // = valorOrcamento, sem taxa visível
  comissaoPlataforma: number; // 10%
  parcelaAceite: number; // 2%
  parcelaPontualidade: number; // 30%
  parcelaConclusao: number; // resto (58%)
  totalRecebidoPeloWorker: number; // soma das 3 parcelas = 90%
};

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function calcularComissao(valorOrcamento: number): ResultadoComissao {
  const comissaoPlataforma = arredondar(valorOrcamento * COMISSAO_PERCENTUAL_TOTAL);
  const totalRecebidoPeloWorker = arredondar(valorOrcamento - comissaoPlataforma);

  const parcelaAceite = arredondar(valorOrcamento * WORKER_PERCENTUAL_ACEITE);
  const parcelaPontualidade = arredondar(valorOrcamento * WORKER_PERCENTUAL_PONTUALIDADE);
  // Conclusão fica com o resto — evita erro de arredondamento acumulado nas 2 primeiras.
  const parcelaConclusao = arredondar(totalRecebidoPeloWorker - parcelaAceite - parcelaPontualidade);

  return {
    valorOrcamento,
    totalPagoPeloCliente: valorOrcamento,
    comissaoPlataforma,
    parcelaAceite,
    parcelaPontualidade,
    parcelaConclusao,
    totalRecebidoPeloWorker,
  };
}
