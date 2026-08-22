"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Menu do usuário logado (Prompt 11) — clique no nome abre "Meu Portfólio" + "Sair",
 * em vez desses itens ficarem soltos na barra de navegação horizontal.
 */
export default function UserMenu({
  nome,
  sairAction,
}: {
  nome: string;
  sairAction: (formData: FormData) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoClicarFora(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-1 text-stone-600 hover:text-stone-900"
      >
        {nome}
        <span className="text-xs text-stone-400">▾</span>
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-10 mt-2 w-44 rounded-md border border-stone-200 bg-white py-1 shadow-lg">
          <Link
            href="/worker/perfil"
            onClick={() => setAberto(false)}
            className="block px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
          >
            Meu Portfólio
          </Link>
          <form action={sairAction}>
            <button
              type="submit"
              className="block w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
            >
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
