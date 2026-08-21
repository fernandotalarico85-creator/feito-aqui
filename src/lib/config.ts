/**
 * Constantes de negócio do protótipo "Feito Aqui".
 *
 * Todos os valores aqui vêm de CONTEXTO_REGRAS_FEITO_AQUI.md — sempre que uma regra de
 * negócio mudar nesse documento, ajuste o valor correspondente aqui em vez de espalhar
 * números mágicos pelo código.
 */

// ---------------------------------------------------------------------------
// 3.1 — Comissão e repasse ao worker em 3 parcelas
//
// Ajuste pedido pelo usuário no meio do Prompt 9: o cliente nunca vê nem paga uma
// taxa separada — ele paga exatamente o valor do orçamento. A comissão de 10% sai do
// lado do worker, mas o repasse dele é parcelado em 3 eventos em vez de uma liberação
// única na conclusão:
//   ACEITE (2%)         → liberado quando o orçamento é aceito e pago
//   PONTUALIDADE (30%)  → liberado no check-in dentro da tolerância (ver 3.4 abaixo)
//   CONCLUSAO (resto)   → liberado quando o serviço é concluído
// Ver src/lib/comissao.ts (cálculo) e src/lib/repasses.ts (ciclo de vida das parcelas).
// ---------------------------------------------------------------------------
export const COMISSAO_PERCENTUAL_TOTAL = 0.1; // 10% — fica com a plataforma
export const WORKER_PERCENTUAL_ACEITE = 0.02; // 2% — parcela 1
export const WORKER_PERCENTUAL_PONTUALIDADE = 0.3; // 30% — parcela 2
// Parcela 3 (conclusão) = 1 - COMISSAO_PERCENTUAL_TOTAL - ACEITE - PONTUALIDADE = 58%

/** Nota mínima para o worker poder comprar destaque pago. */
export const NOTA_MINIMA_PARA_DESTAQUE = 4.0;

/** Preço mockado do destaque — pagamento simulado, igual ao fechamento de serviço. */
export const VALOR_DESTAQUE_REAIS = 49.9;
export const DESTAQUE_DURACAO_DIAS = 7;

// ---------------------------------------------------------------------------
// 3.3 — Ranking orgânico (pesos somam 100)
// ---------------------------------------------------------------------------
export const PESOS_RANKING = {
  notaMediaRecente: 30,
  taxaConclusaoPrazo: 25,
  taxaComparecimento: 20,
  tempoMedioResposta: 10,
  aderenciaGeoCategoria: 10,
  volumeConcluidos: 5,
} as const;

/** 1 em cada N posições do resultado é reservada a um worker em cold start. */
export const RANKING_COLD_START_A_CADA_N_POSICOES = 6;

// ---------------------------------------------------------------------------
// 3.4 — Geolocalização / check-in / check-out
//
// TOLERANCIA_CHECKIN_MINUTOS substituiu a janela antiga (que só olhava atraso, um
// lado só) por uma janela simétrica: ±30min em volta do horário combinado. É a
// mesma regra usada pro flag de atraso (strikes/ranking) E pra liberar a parcela de
// pontualidade do repasse do worker — ajuste pedido pelo usuário: uma regra só.
// ---------------------------------------------------------------------------
export const GEOFENCE_RAIO_METROS = 150;
export const TOLERANCIA_CHECKIN_MINUTOS = 30;
export const ALERTA_SAIDA_PROLONGADA_MINUTOS = 40;

/** Se o worker não fizer check-in dentro da tolerância, pode enviar uma justificativa
 * — cabe ao admin decidir se libera a parcela de pontualidade na hora, agenda pra
 * daqui a X dias, ou deixa cair no fallback (libera junto com a conclusão). */
export const JUSTIFICATIVA_ATRASO_PRAZO_HORAS = 48;

// ---------------------------------------------------------------------------
// 3.5 — Tokens / incentivo a avaliações
// ---------------------------------------------------------------------------
export const TOKENS_POR_AVALIACAO = 500;
export const VALOR_REAIS_POR_AVALIACAO = 5.0; // 500 tokens = R$ 5,00
export const JANELA_CARENCIA_TOKENS_DIAS = 4;

// ---------------------------------------------------------------------------
// 3.6 — Penalidades
// ---------------------------------------------------------------------------
export const STRIKES_MEDIA_LIMITE_SUSPENSAO = 3;
export const STRIKES_MEDIA_JANELA_MESES = 6;

/** Janela pra contestar um strike — Prompt 9. Gravíssima nunca tem direito (checado
 * no server em vez de só na UI, ver src/lib/strikes.ts). */
export const STRIKE_JANELA_CONTESTACAO_HORAS = 48;

// ---------------------------------------------------------------------------
// Cancelamento pós-fechamento (Prompt 9 — "Cancelamento tardio pelo worker",
// Seção 3.6, e o princípio de confiança de mão dupla pro lado do cliente)
// ---------------------------------------------------------------------------
/** Abaixo desse limite, cancelamento do worker é tratado como equivalente a no-show
 * (mesma gravidade e reembolso automático). */
export const CANCELAMENTO_WORKER_JANELA_GRAVE_HORAS = 24;
/** Entre o limite "grave" e esse, o strike ainda é grave (só sem reembolso automático);
 * acima desse limite, vira strike médio. */
export const CANCELAMENTO_WORKER_JANELA_MEDIA_HORAS = 72;

/** Cliente só leva strike por cancelamento tardio se reincidir dentro dessa janela. */
export const CANCELAMENTO_CLIENTE_JANELA_DIAS = 90;
export const CANCELAMENTO_CLIENTE_LIMITE_REINCIDENCIA = 2;

// ---------------------------------------------------------------------------
// 3.8 — Confirmação de conclusão e liberação de repasse
//
// Marcar conclusão no check-out (com foto obrigatória) NÃO libera a parcela final do
// repasse sozinho — só depois que o cliente confirma a entrega, ou depois que esse
// prazo se esgota sem confirmação nem contestação (ver src/lib/confirmacaoConclusao.ts).
// ---------------------------------------------------------------------------
export const CONFIRMACAO_CONCLUSAO_PRAZO_HORAS = 72;

// ---------------------------------------------------------------------------
// 3.9 — Negociação de orçamento (contra-proposta e expiração)
//
// Cliente pode recusar um orçamento, fazer uma contra-proposta de valor/prazo (o
// worker aceita ou recusa), ou simplesmente não responder — nesse caso o orçamento
// expira sozinho depois de ORCAMENTO_PRAZO_EXPIRACAO_DIAS sem decisão.
// ---------------------------------------------------------------------------
export const ORCAMENTO_PRAZO_EXPIRACAO_DIAS = 5;
