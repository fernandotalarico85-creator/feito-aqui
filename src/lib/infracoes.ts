/**
 * Tabela de infrações — Seção 3.6 do contexto. Usada tanto para pré-preencher a
 * gravidade e a ação sugerida no formulário do admin (client component) quanto para
 * validar no servidor — por isso fica num módulo neutro, sem "server-only".
 */
export const TABELA_INFRACOES = [
  {
    tipo: "No-show (sem check-in)",
    gravidade: "GRAVE",
    acaoSugerida: "Strike grave + reembolso automático ao cliente",
    alvo: "WORKER",
  },
  {
    tipo: "Atraso não justificado",
    gravidade: "MEDIA",
    acaoSugerida: "Strike + redução temporária no ranking",
    alvo: "WORKER",
  },
  {
    tipo: "Cancelamento tardio pelo worker",
    gravidade: "GRAVE",
    acaoSugerida: "Strike proporcional à proximidade da data (média a grave, ajuste se necessário)",
    alvo: "WORKER",
  },
  {
    tipo: "Avaliação fraudulenta comprovada",
    gravidade: "GRAVISSIMA",
    acaoSugerida: "Suspensão do programa de tokens",
    alvo: "CLIENTE",
  },
  {
    tipo: "Fraude/identidade falsa/assédio",
    gravidade: "GRAVISSIMA",
    acaoSugerida: "Exclusão imediata, sem strike prévio",
    alvo: "WORKER",
  },
] as const;
