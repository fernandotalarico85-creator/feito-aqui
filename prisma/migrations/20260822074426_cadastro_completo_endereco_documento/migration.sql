-- CreateEnum
CREATE TYPE "TipoDocumentoVerificacao" AS ENUM ('CNH', 'RG_COM_CPF', 'RG_E_CPF_SEPARADOS');

-- CreateEnum
CREATE TYPE "StatusDocumentoVerificacao" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');

-- AlterTable
ALTER TABLE "ClientProfile" ADD COLUMN     "enderecoBairro" TEXT NOT NULL,
ADD COLUMN     "enderecoCep" TEXT NOT NULL,
ADD COLUMN     "enderecoCidade" TEXT NOT NULL,
ADD COLUMN     "enderecoComplemento" TEXT,
ADD COLUMN     "enderecoEstado" TEXT NOT NULL,
ADD COLUMN     "enderecoLogradouro" TEXT NOT NULL,
ADD COLUMN     "enderecoNumero" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cpf" TEXT NOT NULL,
ADD COLUMN     "fotoPerfilUrl" TEXT,
ADD COLUMN     "idCadastro" TEXT NOT NULL,
ADD COLUMN     "sobrenome" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WorkerProfile" ADD COLUMN     "documentoStatus" "StatusDocumentoVerificacao" NOT NULL DEFAULT 'PENDENTE',
ADD COLUMN     "documentoUrl1" TEXT NOT NULL,
ADD COLUMN     "documentoUrl2" TEXT,
ADD COLUMN     "enderecoBairro" TEXT NOT NULL,
ADD COLUMN     "enderecoCep" TEXT NOT NULL,
ADD COLUMN     "enderecoCidade" TEXT NOT NULL,
ADD COLUMN     "enderecoComplemento" TEXT,
ADD COLUMN     "enderecoEstado" TEXT NOT NULL,
ADD COLUMN     "enderecoLogradouro" TEXT NOT NULL,
ADD COLUMN     "enderecoNumero" TEXT NOT NULL,
ADD COLUMN     "tipoDocumento" "TipoDocumentoVerificacao" NOT NULL;

-- CreateTable
CREATE TABLE "SequenciaCadastro" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "contador" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SequenciaCadastro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SequenciaCadastro_tipo_key" ON "SequenciaCadastro"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "User_idCadastro_key" ON "User"("idCadastro");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

