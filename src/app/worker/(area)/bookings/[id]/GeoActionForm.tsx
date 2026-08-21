"use client";

import { useState } from "react";

export default function GeoActionForm({
  action,
  bookingId,
  buttonLabel,
  defaultLat,
  defaultLng,
}: {
  action: (formData: FormData) => void;
  bookingId: string;
  buttonLabel: string;
  defaultLat: number;
  defaultLng: number;
}) {
  const [lat, setLat] = useState(String(defaultLat));
  const [lng, setLng] = useState(String(defaultLng));
  const [erroGeo, setErroGeo] = useState<string | null>(null);

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
      <p className="text-xs text-stone-400">
        Campos preenchidos com o endereço do pedido — edite para simular estar fora do local.
      </p>

      <button
        type="submit"
        className="self-start rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
