import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Portfólio dos workers usa SVGs mock locais (src/../public/mock/portfolio) em vez
    // de upload real (fora de escopo da v0.1) — precisa liberar SVG explicitamente.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
