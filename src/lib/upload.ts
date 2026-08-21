import "server-only";
import { put } from "@vercel/blob";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Upload em Vercel Blob — o filesystem do deploy é somente leitura em produção
 * (serverless), então salvar em public/uploads como antes só funciona em dev local.
 * Precisa da env var BLOB_READ_WRITE_TOKEN (criada automaticamente ao linkar um
 * Blob store no projeto na Vercel — ver DEPLOY.md).
 */
export async function salvarUpload(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const extensao = path.extname(file.name) || ".jpg";
  const nomeArquivo = `uploads/${randomUUID()}${extensao}`;

  const blob = await put(nomeArquivo, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return blob.url;
}
