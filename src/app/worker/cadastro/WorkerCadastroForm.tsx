"use client";

import { useState } from "react";
import EnderecoCadastroFields from "@/components/EnderecoCadastroFields";

type Categoria = { id: string; nome: string };
type TipoDocumento = "CNH" | "RG_COM_CPF" | "RG_E_CPF_SEPARADOS";

export default function WorkerCadastroForm({
  action,
  categorias,
}: {
  action: (formData: FormData) => void;
  categorias: Categoria[];
}) {
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("CNH");

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="nome">
            Nome
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
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
            type="text"
            required
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="cpf">
          CPF
        </label>
        <input
          id="cpf"
          name="cpf"
          type="text"
          required
          placeholder="000.000.000-00"
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          minLength={6}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="regiaoAtendimento">
          Região de atendimento
        </label>
        <input
          id="regiaoAtendimento"
          name="regiaoAtendimento"
          type="text"
          required
          placeholder="Ex.: São Paulo - Zona Sul"
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="bio">
          Sobre você
        </label>
        <textarea
          id="bio"
          name="bio"
          required
          rows={3}
          placeholder="Experiência, especialidades, tempo de atuação..."
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <p className="block text-sm font-medium text-stone-700">Categorias atendidas</p>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {categorias.map((categoria) => (
            <label key={categoria.id} className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="categoriaIds" value={categoria.id} />
              {categoria.nome}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-stone-700">Endereço</p>
        <div className="mt-1">
          <EnderecoCadastroFields />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="fotoPerfil">
          Foto de perfil (opcional)
        </label>
        <input
          id="fotoPerfil"
          name="fotoPerfil"
          type="file"
          accept="image/*"
          className="mt-1 text-sm"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-stone-700">Documento de verificação</p>
        <p className="mt-1 text-xs text-stone-500">
          Precisamos confirmar sua identidade antes de liberar seu perfil pros clientes — sem
          OCR automático no protótipo, um admin revisa manualmente.
        </p>
        <div className="mt-2 flex flex-col gap-1.5 text-sm text-stone-700">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="tipoDocumento"
              value="CNH"
              checked={tipoDocumento === "CNH"}
              onChange={() => setTipoDocumento("CNH")}
            />
            CNH
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="tipoDocumento"
              value="RG_COM_CPF"
              checked={tipoDocumento === "RG_COM_CPF"}
              onChange={() => setTipoDocumento("RG_COM_CPF")}
            />
            RG (que já mostra o CPF)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="tipoDocumento"
              value="RG_E_CPF_SEPARADOS"
              checked={tipoDocumento === "RG_E_CPF_SEPARADOS"}
              onChange={() => setTipoDocumento("RG_E_CPF_SEPARADOS")}
            />
            RG e CPF (dois documentos separados)
          </label>
        </div>

        <div className="mt-2">
          <label className="block text-xs font-medium text-stone-600" htmlFor="documento1">
            {tipoDocumento === "RG_E_CPF_SEPARADOS" ? "Foto do RG" : "Foto do documento"}
          </label>
          <input
            id="documento1"
            name="documento1"
            type="file"
            accept="image/*,application/pdf"
            required
            className="mt-1 text-sm"
          />
        </div>
        {tipoDocumento === "RG_E_CPF_SEPARADOS" && (
          <div className="mt-2">
            <label className="block text-xs font-medium text-stone-600" htmlFor="documento2">
              Foto do CPF
            </label>
            <input
              id="documento2"
              name="documento2"
              type="file"
              accept="image/*,application/pdf"
              required
              className="mt-1 text-sm"
            />
          </div>
        )}
      </div>

      <p className="text-xs text-stone-400">
        Sua conta começa como &ldquo;pendente de verificação&rdquo; — um administrador precisa
        aprovar seu perfil e seu documento antes que você apareça nos resultados dos clientes.
      </p>

      <button
        type="submit"
        className="mt-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
      >
        Criar conta
      </button>
    </form>
  );
}
