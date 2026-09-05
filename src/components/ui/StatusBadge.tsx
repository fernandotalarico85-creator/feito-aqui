const TONE_CLASSES = {
  success: "bg-emerald-100 text-emerald-700",
  alert: "bg-amber-100 text-amber-700",
  secondary: "bg-secondary/10 text-secondary",
  neutral: "bg-stone-100 text-stone-600",
} as const;

const TONE_DOT = {
  success: "bg-emerald-700",
  alert: "bg-amber-700",
  secondary: "bg-secondary",
  neutral: "bg-stone-500",
} as const;

/** Selo de status "Oficina" (Prompt 23, item 3): bolinha colorida + texto maiúsculo.
 * `tone` segue a semântica do sistema visual — success = concluído/aprovado, alert =
 * aguardando/pendente, secondary = em andamento, neutral = qualquer outro estado. */
export default function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: keyof typeof TONE_CLASSES;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${TONE_CLASSES[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]}`} />
      {label}
    </span>
  );
}
