import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NOTA_MINIMA_PARA_DESTAQUE, VALOR_DESTAQUE_REAIS, DESTAQUE_DURACAO_DIAS } from "@/lib/config";
import { comprarDestaqueAction } from "./actions";

const MENSAGENS_ERRO: Record<string, string> = {
  nota_insuficiente: `Sua nota está abaixo do piso de ${NOTA_MINIMA_PARA_DESTAQUE.toFixed(1)} — não é possível comprar destaque agora.`,
};

export default async function DestaquePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuario = await exigirUsuario("WORKER");
  const { erro } = await searchParams;

  const worker = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  const agora = new Date();
  const destaqueAtivo =
    worker.destaquePago && worker.destaquePagoValidoAte && worker.destaquePagoValidoAte > agora;
  const elegivel = worker.notaMediaRecente >= NOTA_MINIMA_PARA_DESTAQUE;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold text-stone-900">Destaque pago</h1>
      <p className="mt-1 text-sm text-stone-500">
        O destaque aparece num bloco &ldquo;Patrocinado&rdquo; separado, sem alterar seu
        ranking orgânico ou sua nota (Seção 3.1 do contexto).
      </p>

      {erro && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {MENSAGENS_ERRO[erro] ?? "Não foi possível concluir a compra."}
        </p>
      )}

      <div className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-stone-900">Sua nota atual</p>
          <p className="text-lg font-semibold text-stone-900">
            {worker.notaMediaRecente > 0 ? worker.notaMediaRecente.toFixed(1) : "—"}
            <span className="text-sm text-amber-500"> ★</span>
          </p>
        </div>
        <p className="mt-1 text-xs text-stone-500">
          Piso mínimo para comprar destaque: {NOTA_MINIMA_PARA_DESTAQUE.toFixed(1)}
        </p>

        {destaqueAtivo && (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Destaque ativo até{" "}
            {worker.destaquePagoValidoAte!.toLocaleDateString("pt-BR")}.
          </p>
        )}

        {elegivel ? (
          <form action={comprarDestaqueAction} className="mt-4">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              {destaqueAtivo ? "Renovar" : "Comprar"} destaque — {DESTAQUE_DURACAO_DIAS} dias por
              R$ {VALOR_DESTAQUE_REAIS.toFixed(2)}
            </button>
            <p className="mt-2 text-xs text-stone-400">
              Pagamento simulado (sem gateway real), igual ao fechamento de um serviço.
            </p>
          </form>
        ) : (
          <div className="mt-4 rounded-md bg-stone-100 p-3">
            <p className="text-sm text-stone-600">
              Botão desabilitado: sua nota ({worker.notaMediaRecente.toFixed(1)}) está abaixo do
              piso de {NOTA_MINIMA_PARA_DESTAQUE.toFixed(1)} exigido para comprar destaque.
              Melhore sua taxa de conclusão no prazo e comparecimento para subir sua nota.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
