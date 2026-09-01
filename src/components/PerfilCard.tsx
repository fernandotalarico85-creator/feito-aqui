"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import EnderecoCadastroFields from "@/components/EnderecoCadastroFields";
import { manropePerfil, interPerfil } from "@/lib/fontsPerfil";

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
 * Cartão de identidade + painel "Informações" da tela "Meu Perfil" (Prompts 19 e 20) —
 * usado por cliente e worker. Layout em 2 colunas: cartão fixo à esquerda (avatar,
 * nome, papel, ID de cadastro, "Enviar mensagem" desabilitado, navegação vertical) e o
 * painel "Informações" à direita, que abre em modo leitura e só vira formulário
 * editável via "Editar" no menu "⋮" — nome/sobrenome/e-mail/endereço/foto continuam
 * editáveis (Seção 3.9), CPF e ID de cadastro continuam travados mesmo em edição.
 *
 * Identidade visual própria (Prompt 20, Seção 3.11) — exceção pontual só para esta
 * tela, via as fontes de src/lib/fontsPerfil.ts e as cores hexadecimais abaixo; o resto
 * do app continua com o estilo padrão (stone/Geist).
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
    <div className={`${interPerfil.className} grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]`}>
      {/* Cartão de identidade */}
      <aside className="h-fit rounded-2xl border border-[#E7EEF0] bg-white p-5 shadow-md">
        <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-[#1F4E5F] to-[#3F7C8A]">
          {fotoPerfilUrl ? (
            <Image src={fotoPerfilUrl} alt="Foto de perfil" fill unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white">
              {nome.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <p className={`${manropePerfil.className} mt-3 text-center text-base font-extrabold text-[#243138]`}>
          {nomeCompleto}
        </p>

        <div className="mt-2 flex justify-center">
          <span
            className={`${manropePerfil.className} rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${
              tipo === "CLIENTE" ? "bg-[#1F4E5F]" : "bg-[#C0592C]"
            }`}
          >
            {tipo === "CLIENTE" ? "Cliente" : "Worker"}
          </span>
        </div>

        {tipo === "WORKER" && categorias && categorias.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {categorias.map((c) => (
              <span
                key={c}
                className="rounded-full bg-[#3F7C8A] px-2 py-0.5 text-xs font-medium text-white"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <p className="mt-3 flex items-center justify-center gap-1 rounded-full bg-[#E7EEF0] px-2.5 py-1 font-mono text-xs text-[#667680]">
          {ICONE_CADEADO}
          {idCadastro}
        </p>

        <button
          type="button"
          disabled
          title="Em breve"
          className="mt-4 w-full cursor-not-allowed rounded-xl bg-[#E7EEF0] px-3 py-1.5 text-sm font-medium text-[#667680]"
        >
          Enviar mensagem
        </button>

        <nav className="mt-5 flex flex-col gap-1 border-t border-[#E7EEF0] pt-4 text-sm">
          <span
            className={`${manropePerfil.className} rounded-lg bg-[#3F7C8A]/10 px-3 py-1.5 font-bold text-[#3F7C8A]`}
          >
            Informações
          </span>
          <Link
            href={minhaCarteiraHref}
            className="rounded-lg px-3 py-1.5 text-[#667680] hover:bg-[#E7EEF0] hover:text-[#243138]"
          >
            Minha Carteira
          </Link>
        </nav>

        <div className="relative mt-4 border-t border-[#E7EEF0] pt-3" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuAberto((v) => !v)}
            className="w-full rounded-lg px-3 py-1.5 text-center text-lg leading-none text-[#667680] hover:bg-[#E7EEF0]"
            aria-label="Mais opções"
          >
            ⋮
          </button>
          {menuAberto && (
            <div className="absolute inset-x-0 bottom-full z-10 mb-1 rounded-xl border border-[#E7EEF0] bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setEditando(true);
                  setMenuAberto(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-[#243138] hover:bg-[#E7EEF0]"
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
      <section className="rounded-2xl border border-[#E7EEF0] bg-white p-5 shadow-md">
        <h2 className={`${manropePerfil.className} text-base font-extrabold text-[#1F4E5F]`}>
          Informações
        </h2>

        {!editando ? (
          <div className="mt-4 flex flex-col gap-5 text-sm">
            <div>
              <h3
                className={`${manropePerfil.className} text-xs font-bold uppercase tracking-wide text-[#667680]`}
              >
                Identificação
              </h3>
              <dl className="mt-2 grid grid-cols-2 gap-y-2">
                <dt className="flex items-center gap-1 text-[#667680]">
                  {ICONE_CADEADO} ID de cadastro
                </dt>
                <dd className="text-right font-mono text-[#243138]">{idCadastro}</dd>
                <dt className="flex items-center gap-1 text-[#667680]">{ICONE_CADEADO} CPF</dt>
                <dd className="text-right text-[#243138]">{cpf}</dd>
              </dl>
            </div>

            <div>
              <h3
                className={`${manropePerfil.className} text-xs font-bold uppercase tracking-wide text-[#667680]`}
              >
                Dados pessoais
              </h3>
              <dl className="mt-2 grid grid-cols-2 gap-y-2">
                <dt className="text-[#667680]">Nome</dt>
                <dd className="text-right text-[#243138]">{nome}</dd>
                <dt className="text-[#667680]">Sobrenome</dt>
                <dd className="text-right text-[#243138]">{sobrenome}</dd>
                <dt className="text-[#667680]">E-mail</dt>
                <dd className="text-right text-[#243138]">{email}</dd>
              </dl>
            </div>

            <div>
              <h3
                className={`${manropePerfil.className} text-xs font-bold uppercase tracking-wide text-[#667680]`}
              >
                Endereço
              </h3>
              <p className="mt-2 text-[#243138]">{enderecoFormatado}</p>
            </div>

            {tipo === "WORKER" && documentoStatusLabel && (
              <div>
                <h3
                  className={`${manropePerfil.className} text-xs font-bold uppercase tracking-wide text-[#667680]`}
                >
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
              <h3
                className={`${manropePerfil.className} text-xs font-bold uppercase tracking-wide text-[#667680]`}
              >
                Identificação
              </h3>
              <dl className="mt-2 grid grid-cols-2 gap-y-2 text-sm">
                <dt className="flex items-center gap-1 text-[#667680]">
                  {ICONE_CADEADO} ID de cadastro
                </dt>
                <dd className="text-right font-mono text-[#243138]">{idCadastro}</dd>
                <dt className="flex items-center gap-1 text-[#667680]">{ICONE_CADEADO} CPF</dt>
                <dd className="text-right text-[#243138]">{cpf}</dd>
              </dl>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#243138]" htmlFor="nome">
                  Nome
                </label>
                <input
                  id="nome"
                  name="nome"
                  defaultValue={nome}
                  required
                  className="mt-1 w-full rounded-lg border border-[#d7e0e2] px-3 py-2 text-sm focus:border-[#3F7C8A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#243138]" htmlFor="sobrenome">
                  Sobrenome
                </label>
                <input
                  id="sobrenome"
                  name="sobrenome"
                  defaultValue={sobrenome}
                  required
                  className="mt-1 w-full rounded-lg border border-[#d7e0e2] px-3 py-2 text-sm focus:border-[#3F7C8A] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#243138]" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={email}
                required
                className="mt-1 w-full rounded-lg border border-[#d7e0e2] px-3 py-2 text-sm focus:border-[#3F7C8A] focus:outline-none"
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
              <label className="block text-xs font-medium text-[#667680]" htmlFor="fotoPerfil">
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
                className={`${manropePerfil.className} rounded-xl bg-[#1F4E5F] px-4 py-2 text-sm font-bold text-white hover:opacity-90`}
              >
                Salvar alterações
              </button>
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="rounded-xl border border-[#d7e0e2] px-4 py-2 text-sm font-medium text-[#667680] hover:bg-[#E7EEF0]"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </section>

      {confirmandoExclusao && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg">
            {!exclusaoAvisada ? (
              <>
                <h3 className={`${manropePerfil.className} text-sm font-bold text-[#243138]`}>
                  Excluir conta
                </h3>
                <p className="mt-2 text-sm text-[#667680]">
                  Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmandoExclusao(false)}
                    className="rounded-xl border border-[#d7e0e2] px-3 py-1.5 text-sm font-medium text-[#667680] hover:bg-[#E7EEF0]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setExclusaoAvisada(true)}
                    className="rounded-xl bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Excluir conta
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-[#667680]">
                  Exclusão de conta ainda não está disponível neste protótipo.
                </p>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmandoExclusao(false);
                      setExclusaoAvisada(false);
                    }}
                    className={`${manropePerfil.className} rounded-xl bg-[#1F4E5F] px-3 py-1.5 text-sm font-bold text-white hover:opacity-90`}
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
