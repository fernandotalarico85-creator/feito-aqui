"use client";

import { useState } from "react";
import { TABELA_INFRACOES } from "@/lib/infracoes";
import { registrarStrikeAction } from "./actions";

type Pessoa = { id: string; nome: string };
type BookingSemCheckIn = { id: string; workerId: string; label: string };

const TIPO_NO_SHOW = "No-show (sem check-in)";

export default function NovoStrikeForm({
  workers,
  clientes,
  bookingsSemCheckIn,
}: {
  workers: Pessoa[];
  clientes: Pessoa[];
  bookingsSemCheckIn: BookingSemCheckIn[];
}) {
  const [tipoInfracao, setTipoInfracao] = useState<string>(TABELA_INFRACOES[0].tipo);
  const infracao = TABELA_INFRACOES.find((i) => i.tipo === tipoInfracao)!;
  const [gravidade, setGravidade] = useState<string>(infracao.gravidade);
  const [alvoTipo, setAlvoTipo] = useState<"WORKER" | "CLIENTE">(infracao.alvo);
  const pessoas = alvoTipo === "WORKER" ? workers : clientes;
  const [alvoId, setAlvoId] = useState<string>(pessoas[0]?.id ?? "");

  function selecionarInfracao(tipo: string) {
    setTipoInfracao(tipo);
    const nova = TABELA_INFRACOES.find((i) => i.tipo === tipo)!;
    setGravidade(nova.gravidade);
    setAlvoTipo(nova.alvo);
    const novasPessoas = nova.alvo === "WORKER" ? workers : clientes;
    setAlvoId(novasPessoas[0]?.id ?? "");
  }

  function selecionarAlvoTipo(tipo: "WORKER" | "CLIENTE") {
    setAlvoTipo(tipo);
    const novasPessoas = tipo === "WORKER" ? workers : clientes;
    setAlvoId(novasPessoas[0]?.id ?? "");
  }

  const bookingsDoWorker =
    tipoInfracao === TIPO_NO_SHOW && alvoTipo === "WORKER"
      ? bookingsSemCheckIn.filter((b) => b.workerId === alvoId)
      : [];

  return (
    <form action={registrarStrikeAction} className="mt-6 flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="tipoInfracao">
          Tipo de infração
        </label>
        <select
          id="tipoInfracao"
          name="tipoInfracao"
          value={tipoInfracao}
          onChange={(e) => selecionarInfracao(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          {TABELA_INFRACOES.map((i) => (
            <option key={i.tipo} value={i.tipo}>
              {i.tipo}
            </option>
          ))}
        </select>
        <p className="mt-1.5 rounded-md bg-stone-100 px-3 py-2 text-xs text-stone-600">
          Ação sugerida: {infracao.acaoSugerida}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="gravidade">
            Gravidade
          </label>
          <select
            id="gravidade"
            name="gravidade"
            value={gravidade}
            onChange={(e) => setGravidade(e.target.value)}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="MEDIA">Média</option>
            <option value="GRAVE">Grave</option>
            <option value="GRAVISSIMA">Gravíssima</option>
          </select>
          <p className="mt-1 text-xs text-stone-400">Pré-preenchida — ajuste se necessário.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="alvoTipo">
            Alvo
          </label>
          <select
            id="alvoTipo"
            name="alvoTipo"
            value={alvoTipo}
            onChange={(e) => selecionarAlvoTipo(e.target.value as "WORKER" | "CLIENTE")}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="WORKER">Worker</option>
            <option value="CLIENTE">Cliente</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="alvoId">
          {alvoTipo === "WORKER" ? "Qual worker?" : "Qual cliente?"}
        </label>
        <select
          id="alvoId"
          name="alvoId"
          required
          value={alvoId}
          onChange={(e) => setAlvoId(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>

      {tipoInfracao === TIPO_NO_SHOW && alvoTipo === "WORKER" && (
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="bookingId">
            Qual booking? (dispara o reembolso automático ao cliente)
          </label>
          {bookingsDoWorker.length === 0 ? (
            <p className="mt-1 text-xs text-stone-400">
              Esse worker não tem nenhum booking fechado sem check-in no momento — o strike será
              registrado sem reembolso vinculado.
            </p>
          ) : (
            <select
              id="bookingId"
              name="bookingId"
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            >
              {bookingsDoWorker.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="observacao">
          Observação (opcional)
        </label>
        <textarea
          id="observacao"
          name="observacao"
          rows={3}
          placeholder="Contexto do caso, evidências, etc."
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        className="self-start rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
      >
        Registrar strike
      </button>
    </form>
  );
}
