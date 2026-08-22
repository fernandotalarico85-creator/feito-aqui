/**
 * Validação de CPF simplificada pro protótipo (Prompt 11) — só confere que sobraram
 * 11 dígitos depois de tirar a formatação, sem checar os dígitos verificadores.
 * `[padrão de protótipo, ajustável]`.
 */
export function limparCpf(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function cpfValido(valor: string): boolean {
  return limparCpf(valor).length === 11;
}
