import { STRIKE_JANELA_CONTESTACAO_HORAS } from "./config";

/**
 * Elegibilidade de contestação de um strike (Prompt 9 / Seção 3.6): gravíssima nunca
 * pode ser contestada (fraude/segurança) — checado aqui, reaproveitado tanto pela UI
 * quanto pela server action, pra regra não depender só do botão estar escondido.
 */
export function strikeEhContestavel(strike: {
  gravidade: string;
  statusContestacao: string;
  dataOcorrencia: Date;
}): boolean {
  if (strike.gravidade === "GRAVISSIMA") return false;
  if (strike.statusContestacao !== "NENHUMA") return false;
  const prazo =
    strike.dataOcorrencia.getTime() + STRIKE_JANELA_CONTESTACAO_HORAS * 60 * 60 * 1000;
  return Date.now() <= prazo;
}
