"use client";

import { useState } from "react";
import { LISTA_UF } from "@/lib/uf";

type ViaCepResposta = {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

/**
 * Campos de endereço reutilizados no cadastro de cliente e worker (Prompt 11):
 * CEP com autopreenchimento via ViaCEP (rua/bairro/cidade/estado), estado como
 * dropdown de UF em vez de texto livre, número/complemento digitados manualmente.
 * Os `name`s dos inputs batem com FormData simples (logradouro/numero/...) — a
 * Server Action que recebe o submit é quem mapeia pros campos enderecoXxx do banco.
 */
export default function EnderecoCadastroFields({
  defaultValues,
}: {
  defaultValues?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
}) {
  const [cep, setCep] = useState(defaultValues?.cep ?? "");
  const [logradouro, setLogradouro] = useState(defaultValues?.logradouro ?? "");
  const [bairro, setBairro] = useState(defaultValues?.bairro ?? "");
  const [cidade, setCidade] = useState(defaultValues?.cidade ?? "");
  const [estado, setEstado] = useState(defaultValues?.estado ?? "SP");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erroCep, setErroCep] = useState<string | null>(null);

  async function buscarCep() {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    setErroCep(null);
    setBuscandoCep(true);
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados: ViaCepResposta = await resposta.json();
      if (dados.erro) {
        setErroCep("CEP não encontrado — preencha o endereço manualmente.");
        return;
      }
      if (dados.logradouro) setLogradouro(dados.logradouro);
      if (dados.bairro) setBairro(dados.bairro);
      if (dados.localidade) setCidade(dados.localidade);
      if (dados.uf) setEstado(dados.uf);
    } catch {
      setErroCep("Não foi possível consultar o CEP agora — preencha manualmente.");
    } finally {
      setBuscandoCep(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className="block text-xs font-medium text-stone-600" htmlFor="cep">
          CEP
        </label>
        <input
          id="cep"
          name="cep"
          required
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          onBlur={buscarCep}
          placeholder="00000-000"
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        {buscandoCep && <p className="mt-1 text-xs text-stone-400">Buscando endereço…</p>}
        {erroCep && <p className="mt-1 text-xs text-red-600">{erroCep}</p>}
      </div>

      <div className="col-span-2">
        <label className="block text-xs font-medium text-stone-600" htmlFor="logradouro">
          Logradouro
        </label>
        <input
          id="logradouro"
          name="logradouro"
          required
          value={logradouro}
          onChange={(e) => setLogradouro(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-600" htmlFor="numero">
          Número
        </label>
        <input
          id="numero"
          name="numero"
          required
          defaultValue={defaultValues?.numero}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-600" htmlFor="complemento">
          Complemento (opcional)
        </label>
        <input
          id="complemento"
          name="complemento"
          defaultValue={defaultValues?.complemento}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-600" htmlFor="bairro">
          Bairro
        </label>
        <input
          id="bairro"
          name="bairro"
          required
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-600" htmlFor="cidade">
          Cidade
        </label>
        <input
          id="cidade"
          name="cidade"
          required
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="col-span-2">
        <label className="block text-xs font-medium text-stone-600" htmlFor="estado">
          Estado
        </label>
        <select
          id="estado"
          name="estado"
          required
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          {LISTA_UF.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
