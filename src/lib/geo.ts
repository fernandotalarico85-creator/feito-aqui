/**
 * Geolocalização simulada — não há geocodificação real no protótipo (Seção 3.4 /
 * "Fora de escopo da v0.1" do contexto). Endereços novos recebem uma coordenada
 * aproximada do centro de São Paulo com um leve deslocamento determinístico a partir
 * do CEP, só para variar os pontos no mapa entre cadastros diferentes.
 */
const SP_CENTRO = { latitude: -23.5505, longitude: -46.6333 };

export function geocodificarMock(cep: string): { latitude: number; longitude: number } {
  const hash = Array.from(cep).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const jitter = ((hash % 100) - 50) / 1000; // até ~0.05 grau (alguns km)
  return {
    latitude: SP_CENTRO.latitude + jitter,
    longitude: SP_CENTRO.longitude - jitter,
  };
}

/** Distância em metros entre duas coordenadas (fórmula de Haversine) — usada para
 * comparar o check-in do worker com o endereço do pedido (Seção 3.4, geofence). */
export function distanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const RAIO_TERRA_METROS = 6371000;
  const paraRad = (graus: number) => (graus * Math.PI) / 180;

  const dLat = paraRad(lat2 - lat1);
  const dLon = paraRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(paraRad(lat1)) * Math.cos(paraRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return RAIO_TERRA_METROS * c;
}
