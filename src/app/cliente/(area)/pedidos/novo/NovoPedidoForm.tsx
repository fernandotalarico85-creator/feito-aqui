"use client";

import { useState } from "react";
import { criarPedidoAction } from "./actions";
import { LISTA_UF } from "@/lib/uf";

type Categoria = {
  id: string;
  nome: string;
  subServicos: { id: string; nome: string; ordem: number }[];
};

type Endereco = {
  id: string;
  rotulo: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
};

export default function NovoPedidoForm({
  categorias,
  enderecos,
}: {
  categorias: Categoria[];
  enderecos: Endereco[];
}) {
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [enderecoModo, setEnderecoModo] = useState<"existente" | "novo">(
    enderecos.length > 0 ? "existente" : "novo",
  );

  const categoriaSelecionada = categorias.find((c) => c.id === categoriaId);

  return (
    <form action={criarPedidoAction} className="mt-6 flex flex-col gap-6">
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="categoriaId">
          O que você precisa?
        </label>
        <select
          id="categoriaId"
          name="categoriaId"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>

        {categoriaSelecionada && (
          <div className="mt-3 rounded-md bg-stone-100 p-3">
            <p className="text-xs font-medium text-stone-500">
              Sub-serviços envolvidos (ordem sugerida de execução):
            </p>
            <ol className="mt-1.5 flex flex-wrap gap-2">
              {categoriaSelecionada.subServicos.map((sub, i) => (
                <li
                  key={sub.id}
                  className="rounded-full bg-white px-2.5 py-1 text-xs text-stone-700 shadow-sm"
                >
                  {i + 1}. {sub.nome}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="descricaoLivre">
          Descreva o serviço com suas palavras
        </label>
        <textarea
          id="descricaoLivre"
          name="descricaoLivre"
          required
          rows={4}
          placeholder="Ex.: banheiro de 4m², quero trocar todo o revestimento e a caixa de descarga está vazando."
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="janelaDataInicio">
            A partir de quando (data e hora combinada)?
          </label>
          <input
            id="janelaDataInicio"
            name="janelaDataInicio"
            type="datetime-local"
            required
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-stone-400">
            Esse horário é usado como referência para o check-in do profissional.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="janelaDataFim">
            Até quando?
          </label>
          <input
            id="janelaDataFim"
            name="janelaDataFim"
            type="date"
            required
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <p className="block text-sm font-medium text-stone-700">Onde será o serviço?</p>

        {enderecos.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {enderecos.map((endereco) => (
              <label
                key={endereco.id}
                className="flex items-start gap-2 rounded-md border border-stone-200 p-2.5 text-sm has-checked:border-stone-500 has-checked:bg-stone-50"
              >
                <input
                  type="radio"
                  name="enderecoId"
                  value={endereco.id}
                  defaultChecked={enderecoModo === "existente"}
                  onChange={() => setEnderecoModo("existente")}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-stone-800">{endereco.rotulo}</span>
                  <br />
                  <span className="text-stone-500">
                    {endereco.logradouro}, {endereco.numero} — {endereco.bairro},{" "}
                    {endereco.cidade}
                  </span>
                </span>
              </label>
            ))}
            <button
              type="button"
              onClick={() => setEnderecoModo("novo")}
              className="self-start text-xs font-medium text-stone-600 underline"
            >
              + Usar um novo endereço
            </button>
          </div>
        )}

        {enderecoModo === "novo" && (
          <div className="mt-3 grid grid-cols-2 gap-3 rounded-md border border-stone-200 p-3">
            <input type="hidden" name="enderecoModo" value="novo" />
            <input
              name="rotulo"
              placeholder="Rótulo (ex.: Casa)"
              className="col-span-2 rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              name="logradouro"
              placeholder="Logradouro"
              required
              className="col-span-2 rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              name="numero"
              placeholder="Número"
              required
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              name="bairro"
              placeholder="Bairro"
              required
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              name="cidade"
              placeholder="Cidade"
              required
              defaultValue="São Paulo"
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <select
              name="estado"
              required
              defaultValue="SP"
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            >
              {LISTA_UF.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
            <input
              name="cep"
              placeholder="CEP"
              required
              className="col-span-2 rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <p className="col-span-2 text-xs text-stone-400">
              A localização exata é simulada neste protótipo (sem geocodificação real).
            </p>
          </div>
        )}
        {enderecoModo !== "novo" && <input type="hidden" name="enderecoModo" value="existente" />}
      </div>

      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
      >
        Buscar profissionais recomendados
      </button>
    </form>
  );
}
