import { PESOS_RANKING, RANKING_COLD_START_A_CADA_N_POSICOES } from "./config";

/**
 * Fórmula de ranking orgânico — Seção 3.3 de CONTEXTO_REGRAS_FEITO_AQUI.md.
 * Ajuste os pesos em src/lib/config.ts (PESOS_RANKING), não aqui.
 */

const TEMPO_RESPOSTA_MAX_MIN = 120; // acima disso, pontuação de tempo de resposta zera
const VOLUME_CONCLUIDOS_REFERENCIA = 50; // volume a partir do qual a pontuação satura

export type WorkerParaRanking = {
  id: string;
  notaMediaRecente: number; // 0..5
  taxaConclusaoPrazo: number; // 0..1
  taxaComparecimento: number; // 0..1
  tempoMedioRespostaMin: number;
  volumeConcluidos: number;
  regiaoAtendimento: string;
};

function pontuarAderenciaRegiao(regiaoAtendimento: string, cidadeAlvo: string): number {
  const atende = regiaoAtendimento.toLowerCase().includes(cidadeAlvo.toLowerCase());
  return atende
    ? PESOS_RANKING.aderenciaGeoCategoria
    : PESOS_RANKING.aderenciaGeoCategoria * 0.5;
}

/** Calcula o score de ranking orgânico de um worker (0..100) para uma cidade-alvo. */
export function calcularScoreRanking(
  worker: WorkerParaRanking,
  cidadeAlvo: string,
): number {
  const notaScore = (worker.notaMediaRecente / 5) * PESOS_RANKING.notaMediaRecente;
  const prazoScore = worker.taxaConclusaoPrazo * PESOS_RANKING.taxaConclusaoPrazo;
  const comparecimentoScore = worker.taxaComparecimento * PESOS_RANKING.taxaComparecimento;
  const tempoRespostaScore =
    Math.max(0, 1 - worker.tempoMedioRespostaMin / TEMPO_RESPOSTA_MAX_MIN) *
    PESOS_RANKING.tempoMedioResposta;
  const aderenciaScore = pontuarAderenciaRegiao(worker.regiaoAtendimento, cidadeAlvo);
  const volumeScore =
    Math.min(worker.volumeConcluidos / VOLUME_CONCLUIDOS_REFERENCIA, 1) *
    PESOS_RANKING.volumeConcluidos;

  return notaScore + prazoScore + comparecimentoScore + tempoRespostaScore + aderenciaScore + volumeScore;
}

/** Worker "cold start": elegível mas ainda sem histórico de serviços concluídos. */
export function ehColdStart(worker: WorkerParaRanking): boolean {
  return worker.volumeConcluidos === 0;
}

export type ResultadoRanking<T extends WorkerParaRanking> = {
  worker: T;
  score: number;
  coldStart: boolean;
};

/**
 * Monta a lista orgânica final: ordenada por score, mas reservando 1 em cada N
 * posições (RANKING_COLD_START_A_CADA_N_POSICOES) para um worker elegível em cold
 * start, para dar visibilidade a quem ainda não tem histórico.
 */
export function montarListaOrganica<T extends WorkerParaRanking>(
  workers: T[],
  cidadeAlvo: string,
): ResultadoRanking<T>[] {
  const comScore: ResultadoRanking<T>[] = workers.map((worker) => ({
    worker,
    score: calcularScoreRanking(worker, cidadeAlvo),
    coldStart: ehColdStart(worker),
  }));

  const principais = comScore.filter((r) => !r.coldStart).sort((a, b) => b.score - a.score);
  const coldStarters = comScore.filter((r) => r.coldStart).sort((a, b) => b.score - a.score);

  if (coldStarters.length === 0) return principais;
  if (principais.length === 0) return coldStarters;

  const resultado: ResultadoRanking<T>[] = [];
  let coldIdx = 0;
  let principalIdx = 0;
  let posicao = 1;

  while (principalIdx < principais.length || coldIdx < coldStarters.length) {
    const reservaColdStart =
      posicao % RANKING_COLD_START_A_CADA_N_POSICOES === 0 && coldIdx < coldStarters.length;

    if (reservaColdStart) {
      resultado.push(coldStarters[coldIdx]);
      coldIdx++;
    } else if (principalIdx < principais.length) {
      resultado.push(principais[principalIdx]);
      principalIdx++;
    } else {
      resultado.push(coldStarters[coldIdx]);
      coldIdx++;
    }
    posicao++;
  }

  return resultado;
}
