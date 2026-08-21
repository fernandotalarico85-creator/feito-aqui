"use client";

import { useState } from "react";
import { calcularComissao } from "@/lib/comissao";
import { enviarOrcamentoAction } from "./actions";

export default function EnviarOrcamentoForm({ serviceRequestId }: { serviceRequestId: string }) {
  const [valorTexto, setValorTexto] = useState("");
  const valor = Number(valorTexto);
  const comissao = valor > 0 ? calcularComissao(valor) : null;

  return (
    <form action={enviarOrcamentoAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="serviceRequestId" value={serviceRequestId} />
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="valor">
          Valor do orçamento (R$)
        </label>
        <input
          id="valor"
          name="valor"
          type="number"
          min="1"
          step="0.01"
          required
          value={valorTexto}
          onChange={(e) => setValorTexto(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-stone-400">
          O cliente vê e paga exatamente esse valor — sem taxa somada.
        </p>
      </div>

      {comissao && (
        <div className="rounded-md bg-stone-100 p-3">
          <p className="text-xs font-medium text-stone-500">
            Você recebe R$ {comissao.totalRecebidoPeloWorker.toFixed(2)}, em 3 parcelas:
          </p>
          <ul className="mt-1.5 space-y-0.5 text-xs text-stone-600">
            <li>R$ {comissao.parcelaAceite.toFixed(2)} — no aceite do orçamento (2%)</li>
            <li>R$ {comissao.parcelaPontualidade.toFixed(2)} — no check-in pontual (30%)</li>
            <li>R$ {comissao.parcelaConclusao.toFixed(2)} — na conclusão do serviço (resto)</li>
          </ul>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="prazoEntrega">
          Meu prazo de entrega
        </label>
        <input
          id="prazoEntrega"
          name="prazoEntrega"
          type="date"
          required
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-stone-400">
          Esse prazo é definido por você, não pela plataforma.
        </p>
      </div>
      <button
        type="submit"
        className="self-start rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700"
      >
        Enviar orçamento
      </button>
    </form>
  );
}
