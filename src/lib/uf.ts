// Sem "server-only" — usado tanto por formulários (Client Components) quanto por
// validação em Server Actions.

/** As 27 unidades federativas do Brasil (Prompt 11) — usado nos dropdowns de
 * estado em vez de campo de texto livre. */
export const LISTA_UF = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export type UF = (typeof LISTA_UF)[number];

export function ehUfValida(valor: string): valor is UF {
  return (LISTA_UF as readonly string[]).includes(valor);
}
