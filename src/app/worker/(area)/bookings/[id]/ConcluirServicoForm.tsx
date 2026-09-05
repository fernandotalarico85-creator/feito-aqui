"use client";

import { useState } from "react";

export default function ConcluirServicoForm({
  action,
  bookingId,
  defaultLat,
  defaultLng,
}: {
  action: (formData: FormData) => void;
  bookingId: string;
  defaultLat: number;
  defaultLng: number;
}) {
  const [lat, setLat] = useState(String(defaultLat));
  const [lng, setLng] = useState(String(defaultLng));
  const [erroGeo, setErroGeo] = useState<string | null>(null);
  const [totalFotos, setTotalFotos] = useState(0);

  function usarLocalizacaoAtual() {
    setErroGeo(null);
    if (!navigator.geolocation) {
      setErroGeo("Geolocalização não disponível neste navegador — use os campos manuais.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
      },
      () => {
        setErroGeo("Não foi possível obter sua localização — use os campos manuais.");
      },
    );
  }

  return (
    <form action={action} className="mt-3 flex flex-col gap-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-600">Latitude</label>
          <input
            name="latitude"
            type="number"
            step="any"
            required
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600">Longitude</label>
          <input
            name="longitude"
            type="number"
            step="any"
            required
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={usarLocalizacaoAtual}
          className="text-xs font-medium text-stone-600 underline"
        >
          Usar minha localização atual
        </button>
        {erroGeo && <span className="text-xs text-red-600">{erroGeo}</span>}
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-600" htmlFor="fotos">
          Foto(s) do resultado (obrigatório pelo menos 1)
        </label>
        <input
          id="fotos"
          name="fotos"
          type="file"
          accept="image/*"
          multiple
          required
          onChange={(e) => setTotalFotos(e.target.files?.length ?? 0)}
          className="mt-1 text-sm"
        />
        <p className="mt-1 text-xs text-stone-400">
          Sem foto do &ldquo;depois&rdquo;, o serviço não pode ser marcado como concluído
          (Seção 3.8). Se enviar mais de uma, a primeira vira a capa no portfólio.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" name="publicarPortfolio" value="true" />
        Publicar esta foto no meu portfólio agora
      </label>
      <p className="text-xs text-stone-400">
        Se não marcar, dá pra publicar depois a qualquer momento em &ldquo;Meu perfil {">"}{" "}
        Portfólio&rdquo;.
      </p>

      <button
        type="submit"
        disabled={totalFotos === 0}
        className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        Concluí o serviço
      </button>
    </form>
  );
}
