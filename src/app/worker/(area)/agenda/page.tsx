import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { alternarDisponibilidadeAction } from "./actions";

const DIAS_A_MOSTRAR = 30;

function chaveData(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function AgendaPage() {
  const usuario = await exigirUsuario("WORKER");
  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fim = new Date(hoje.getTime() + (DIAS_A_MOSTRAR - 1) * 24 * 60 * 60 * 1000);

  const diasMarcados = await prisma.agendaDia.findMany({
    where: { workerProfileId: worker.id, data: { gte: hoje, lte: fim } },
  });
  const mapaDisponibilidade = new Map(diasMarcados.map((d) => [chaveData(d.data), d.disponivel]));

  const dias = Array.from({ length: DIAS_A_MOSTRAR }).map((_, i) => {
    const data = new Date(hoje.getTime() + i * 24 * 60 * 60 * 1000);
    const chave = chaveData(data);
    const disponivel = mapaDisponibilidade.get(chave) ?? true;
    return { data, chave, disponivel };
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Agenda</h1>
      <p className="mt-1 text-sm text-stone-500">
        Clique em um dia para alternar entre disponível e ocupado. Dias não marcados contam
        como disponíveis por padrão.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {dias.map(({ data, chave, disponivel }) => (
          <form key={chave} action={alternarDisponibilidadeAction}>
            <input type="hidden" name="data" value={chave} />
            <input type="hidden" name="disponivelAtual" value={String(disponivel)} />
            <button
              type="submit"
              className={`w-full rounded-md border px-2 py-3 text-center text-xs font-medium ${
                disponivel
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                  : "border-stone-300 bg-stone-100 text-stone-500 hover:border-stone-400"
              }`}
            >
              <span className="block text-[11px] text-stone-400">
                {data.toLocaleDateString("pt-BR", { weekday: "short" })}
              </span>
              {data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
              <span className="mt-1 block">{disponivel ? "Disponível" : "Ocupado"}</span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
