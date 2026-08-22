export default function EmConstrucao({ titulo }: { titulo: string }) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">{titulo}</h1>
      <p className="mt-6 rounded-md border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm text-stone-500">
        Esta área está em construção — disponível em breve.
      </p>
    </div>
  );
}
