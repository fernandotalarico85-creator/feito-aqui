"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import EnderecoCadastroFields from "@/components/EnderecoCadastroFields";

const ICONE_CADEADO = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
    <path
      fillRule="evenodd"
      d="M10 1a4 4 0 0 0-4 4v2H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V5a4 4 0 0 0-4-4Zm2 6V5a2 2 0 1 0-4 0v2h4Z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Cartão de identidade + painel "Informações" da tela "Meu Perfil" (Prompt 19) — usado
 * por cliente e worker. Layout em 2 colunas: cartão fixo à esquerda (avatar, nome,
 * papel, ID de cadastro, "Enviar mensagem" desabilitado, navegação vertical) e o
 * painel "Informações" à direita, que abre em modo leitura e só vira formulário
 * editável via "Editar" no menu "⋮" — nome/sobrenome/e-mail/endereço/foto continuam
 * editáveis (Seção 3.9), CPF e ID de cadastro continuam travados mesmo em edição.
 */
export default function PerfilCard({
  tipo,
  idCadastro,
  nome,
  sobrenome,
  email,
  cpf,
  fotoPerfilUrl,
  categorias,
  documentoStatusLabel,
  documentoStatusClasse,
  endereco,
  minhaCarteiraHref,
  updateAction,
}: {
  tipo: "CLIENTE" | "WORKER";
  idCadastro: string;
  nome: string;
  sobrenome: string;
  email: string;
  cpf: string;
  fotoPerfilUrl: string | null;
  categorias?: string[];
  documentoStatusLabel?: string;
  documentoStatusClasse?: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  minhaCarteiraHref: string;
  updateAction: (formData: FormData) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [exclusaoAvisada, setExclusaoAvisada] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoClicarFora(evento: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(evento.target as Node)) {
        setMenuAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const nomeCompleto = `${nome} ${sobrenome}`;
  const enderecoFormatado = `${endereco.logradouro}, ${endereco.numero}${
    endereco.complemento ? ` — ${endereco.complemento}` : ""
  } · ${endereco.bairro}, ${endereco.cidade}/${endereco.estado} · CEP ${endereco.cep}`;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
      {/* Cartão de identidade */}
      <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5">
        <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-stone-100">
          {fotoPerfilUrl ? (
            <Image src={fotoPerfilUrl} alt="Foto de perfil" fill unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-stone-400">
              {nome.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-base font-semibold text-stone-900">{nomeCompleto}</p>

        <div className="mt-2 flex justify-center">
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
            {tipo === "CLIENTE" ? "Cliente" : "Worker"}
          </span>
        </div>

        {tipo === "WORKER" && categorias && categorias.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {categorias.map((c) => (
              <span
                key={c}
                className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <p className="mt-3 flex items-center justify-center gap-1 font-mono text-xs text-stone-500">
          {ICONE_CADEADO}
          {idCadastro}
        </p>

        <button
          type="button"
          disabled
          title="Em breve"
          className="mt-4 w-full cursor-not-allowed rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-400"
        >
          Enviar mensagem
        </button>

        <nav className="mt-5 flex flex-col gap-1 border-t border-stone-100 pt-4 text-sm">
          <span className="rounded-md bg-stone-100 px-3 py-1.5 font-medium text-stone-900">
            Informações
          </span>
          <Link
            href={minhaCarteiraHref}
            className="rounded-md px-3 py-1.5 text-stone-600 hover:bg-stone-50 hover:text-stone-900"
          >
            Minha Carteira
          </Link>
        </nav>

        <div className="relative mt-4 border-t border-stone-100 pt-3" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuAberto((v) => !v)}
            className="w-full rounded-md px-3 py-1.5 text-center text-lg leading-none text-stone-500 hover:bg-stone-50"
            aria-label="Mais opções"
          >
            ⋮
          </button>
          {menuAberto && (
            <div className="absolute inset-x-0 bottom-full z-10 mb-1 rounded-md border border-stone-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setEditando(true);
                  setMenuAberto(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmandoExclusao(true);
                  setMenuAberto(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Excluir conta
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Painel "Informações" */}
      <section className="rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-stone-900">Informações</h2>

        {!editando ? (
          <div className="mt-4 flex flex-col gap-5 text-sm">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Identificação
              </h3>
              <dl className="mt-2 grid grid-cols-2 gap-y-2">
                <dt className="flex items-center gap-1 text-stone-500">
                  {ICONE_CADEADO} ID de cadastro
                </dt>
                <dd className="text-right font-mono text-stone-900">{idCadastro}</dd>
                <dt className="flex items-center gap-1 text-stone-500">{ICONE_CADEADO} CPF</dt>
                <dd className="text-right text-stone-900">{cpf}</dd>
              </dl>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Dados pessoais
              </h3>
              <dl className="mt-2 grid grid-cols-2 gap-y-2">
                <dt className="text-stone-500">Nome</dt>
                <dd className="text-right text-stone-900">{nome}</dd>
                <dt className="text-stone-500">Sobrenome</dt>
                <dd className="text-right text-stone-900">{sobrenome}</dd>
                <dt className="text-stone-500">E-mail</dt>
                <dd className="text-right text-stone-900">{email}</dd>
              </dl>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Endereço
              </h3>
              <p className="mt-2 text-stone-900">{enderecoFormatado}</p>
            </div>

            {tipo === "WORKER" && documentoStatusLabel && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Documento de verificação
                </h3>
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${documentoStatusClasse}`}
                >
                  {documentoStatusLabel}
                </span>
              </div>
            )}
          </div>
        ) : (
          <form action={updateAction} className="mt-4 flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Identificação
              </h3>
              <dl className="mt-2 grid grid-cols-2 gap-y-2 text-sm">
                <dt className="flex items-center gap-1 text-stone-500">
                  {ICONE_CADEADO} ID de cadastro
                </dt>
                <dd className="text-right font-mono text-stone-900">{idCadastro}</dd>
                <dt className="flex items-center gap-1 text-stone-500">{ICONE_CADEADO} CPF</dt>
                <dd className="text-right text-stone-900">{cpf}</dd>
              </dl>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700" htmlFor="nome">
                  Nome
                </label>
                <input
                  id="nome"
                  name="nome"
                  defaultValue={nome}
                  required
                  className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700" htmlFor="sobrenome">
                  Sobrenome
                </label>
                <input
                  id="sobrenome"
                  name="sobrenome"
                  defaultValue={sobrenome}
                  required
                  className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={email}
                required
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>

            <EnderecoCadastroFields
              defaultValues={{
                logradouro: endereco.logradouro,
                numero: endereco.numero,
                complemento: endereco.complemento ?? "",
                bairro: endereco.bairro,
                cidade: endereco.cidade,
                estado: endereco.estado,
                cep: endereco.cep,
              }}
            />
            <div>
              <label className="block text-xs font-medium text-stone-600" htmlFor="fotoPerfil">
                Trocar foto de perfil (opcional)
              </label>
              <input
                id="fotoPerfil"
                name="fotoPerfil"
                type="file"
                accept="image/*"
                className="mt-1 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
              >
                Salvar alterações
              </button>
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </section>

      {confirmandoExclusao && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5">
            {!exclusaoAvisada ? (
              <>
                <h3 className="text-sm font-semibold text-stone-900">Excluir conta</h3>
                <p className="mt-2 text-sm text-stone-600">
                  Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmandoExclusao(false)}
                    className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setExclusaoAvisada(true)}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Excluir conta
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-stone-600">
                  Exclusão de conta ainda não está disponível neste protótipo.
                </p>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmandoExclusao(false);
                      setExclusaoAvisada(false);
                    }}
                    className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
                  >
                    Entendi
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
