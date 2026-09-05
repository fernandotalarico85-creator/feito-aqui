"use client";

import { useState } from "react";
import type { BookingElegivel } from "@/lib/portfolio";

export default function AdicionarPortfolioForm({
  action,
  bookingsElegiveis,
}: {
  action: (formData: FormData) => void;
  bookingsElegiveis: BookingElegivel[];
}) {
  const [origem, setOrigem] = useState<"EXTERNO" | "PLATAFORMA">("EXTERNO");

  return (
    <form action={action} className="mt-3 flex flex-col gap-3 rounded-md border border-stone-200 bg-white p-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-600" htmlFor="fotoAntes">
            Foto &ldquo;antes&rdquo;
          </label>
          <input id="fotoAntes" name="fotoAntes" type="file" accept="image/*" required className="mt-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600" htmlFor="fotoDepois">
            Foto &ldquo;depois&rdquo; (opcional)
          </label>
          <input id="fotoDepois" name="fotoDepois" type="file" accept="image/*" className="mt-1 text-sm" />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-stone-600">Esse serviço foi feito...</p>
        <div className="mt-1.5 flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="origem"
              value="EXTERNO"
              checked={origem === "EXTERNO"}
              onChange={() => setOrigem("EXTERNO")}
            />
            Fora da plataforma
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="origem"
              value="PLATAFORMA"
              checked={origem === "PLATAFORMA"}
              onChange={() => setOrigem("PLATAFORMA")}
              disabled={bookingsElegiveis.length === 0}
            />
            Pelo Feito Aqui
          </label>
        </div>
      </div>

      {origem === "EXTERNO" ? (
        <input
          name="descricao"
          placeholder="Descrição (ex.: Reforma de banheiro social)"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      ) : bookingsElegiveis.length === 0 ? (
        <p className="text-xs text-stone-400">
          Você ainda não tem nenhum serviço concluído pela plataforma disponível para vincular.
        </p>
      ) : (
        <div>
          <label className="block text-xs font-medium text-stone-600" htmlFor="bookingId">
            Qual obra?
          </label>
          <select
            id="bookingId"
            name="bookingId"
            required
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            {bookingsElegiveis.map((b) => (
              <option key={b.id} value={b.id}>
                {b.budget.serviceRequest.category.nome} — {b.budget.serviceRequest.address.bairro},{" "}
                {b.budget.serviceRequest.address.cidade} ·{" "}
                {b.criadoEm.toLocaleDateString("pt-BR")}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-stone-400">
            Categoria, região e a nota do cliente são preenchidos automaticamente — os dados de
            contato do cliente não aparecem no portfólio público.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={origem === "PLATAFORMA" && bookingsElegiveis.length === 0}
        className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
      >
        Publicar no portfólio
      </button>
    </form>
  );
}
