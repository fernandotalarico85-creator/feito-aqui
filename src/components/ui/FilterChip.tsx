import type { ReactNode } from "react";

/** Chip de filtro "Oficina" (Prompt 23, item 3) — cantos ~8px, fundo neutro por
 * padrão, fundo secundário quando selecionado. Renderiza como link (útil pra
 * filtros via query string, ex.: Strikes por tipo) ou botão de formulário. */
export default function FilterChip({
  href,
  selected,
  children,
}: {
  href: string;
  selected: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
        selected ? "bg-secondary text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}
    >
      {children}
    </a>
  );
}
