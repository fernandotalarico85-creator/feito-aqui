"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";

/**
 * Dropdown do usuário logado (Prompts 12 e 15/16) — reaproveitado por cliente, worker
 * e admin, cada um passando seus próprios itens como children. `UserMenuLink` fecha o
 * dropdown ao navegar; `UserMenuGroup` é um acordeão independente (não fecha o
 * dropdown ao expandir/recolher) usado só pelo admin, que tem dois níveis.
 */
const FecharMenuContext = createContext<() => void>(() => {});

export default function UserMenuDropdown({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fechar = () => setAberto(false);

  useEffect(() => {
    function aoClicarFora(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        fechar();
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
        {label}
        <span className="text-xs text-stone-400">▾</span>
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-md border border-stone-200 bg-white py-1 shadow-lg">
          <FecharMenuContext.Provider value={fechar}>{children}</FecharMenuContext.Provider>
        </div>
      )}
    </div>
  );
}

export function UserMenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  const fechar = useContext(FecharMenuContext);
  return (
    <Link
      href={href}
      onClick={fechar}
      className="block px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
    >
      {children}
    </Link>
  );
}

export function UserMenuGroup({ label, children }: { label: string; children: React.ReactNode }) {
  const [expandido, setExpandido] = useState(false);
  return (
    <div className="border-t border-stone-100 first:border-t-0">
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
      >
        {label}
        <span className="text-xs text-stone-400">{expandido ? "▴" : "▾"}</span>
      </button>
      {expandido && <div className="flex flex-col bg-stone-50 pl-3">{children}</div>}
    </div>
  );
}
