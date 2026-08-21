-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('CLIENTE', 'WORKER', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusVerificacao" AS ENUM ('PENDENTE', 'VERIFICADO');

-- CreateEnum
CREATE TYPE "StatusServiceRequest" AS ENUM ('TRIAGEM', 'AGUARDANDO_ORCAMENTO', 'ORCADO', 'FECHADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusBudget" AS ENUM ('PENDENTE', 'ACEITO', 'RECUSADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "StatusContraproposta" AS ENUM ('NENHUMA', 'PENDENTE_WORKER', 'RECUSADA_PELO_WORKER');

-- CreateEnum
CREATE TYPE "StatusBooking" AS ENUM ('FECHADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusContestacao" AS ENUM ('NENHUMA', 'EM_ANALISE', 'MANTIDA', 'REVERTIDA');

-- CreateEnum
CREATE TYPE "TipoWalletTransaction" AS ENUM ('CREDITO_AVALIACAO', 'ESTORNO', 'USO_EM_SERVICO', 'REEMBOLSO_NO_SHOW');

-- CreateEnum
CREATE TYPE "OrigemCancelamento" AS ENUM ('WORKER', 'CLIENTE');

-- CreateEnum
CREATE TYPE "StatusWalletTransaction" AS ENUM ('CARENCIA', 'LIBERADO', 'USADO', 'ESTORNADO');

-- CreateEnum
CREATE TYPE "GravidadeStrike" AS ENUM ('MEDIA', 'GRAVE', 'GRAVISSIMA');

-- CreateEnum
CREATE TYPE "StatusConclusao" AS ENUM ('AGUARDANDO_CONFIRMACAO_CLIENTE', 'CONFIRMADO', 'CONTESTADO');

-- CreateEnum
CREATE TYPE "TipoRepasse" AS ENUM ('ACEITE', 'PONTUALIDADE', 'CONCLUSAO');

-- CreateEnum
CREATE TYPE "StatusRepasse" AS ENUM ('PENDENTE', 'EM_ANALISE', 'CARENCIA', 'LIBERADO');

-- CreateEnum
CREATE TYPE "OrigemPortfolioItem" AS ENUM ('EXTERNO', 'PLATAFORMA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "tipo" "TipoUsuario" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancelamentoTardio" (
    "id" TEXT NOT NULL,
    "clientProfileId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CancelamentoTardio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "clientProfileId" TEXT NOT NULL,
    "rotulo" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "regiaoAtendimento" TEXT NOT NULL,
    "statusVerificacao" "StatusVerificacao" NOT NULL DEFAULT 'PENDENTE',
    "elegivelParaTriagem" BOOLEAN NOT NULL DEFAULT true,
    "destaquePago" BOOLEAN NOT NULL DEFAULT false,
    "destaquePagoValidoAte" TIMESTAMP(3),
    "notaMediaRecente" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxaConclusaoPrazo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxaComparecimento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tempoMedioRespostaMin" INTEGER NOT NULL DEFAULT 60,
    "volumeConcluidos" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepasseWorker" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "tipo" "TipoRepasse" NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "status" "StatusRepasse" NOT NULL DEFAULT 'PENDENTE',
    "justificativaTexto" TEXT,
    "justificativaDataEnvio" TIMESTAMP(3),
    "liberadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepasseWorker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "origem" "OrigemPortfolioItem" NOT NULL DEFAULT 'EXTERNO',
    "bookingId" TEXT,
    "fotoAntesUrl" TEXT,
    "fotoDepoisUrl" TEXT,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePhoto" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaDia" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AgendaDia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubService" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "SubService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "clientProfileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "descricaoLivre" TEXT NOT NULL,
    "subServicosJson" TEXT NOT NULL,
    "janelaDataInicio" TIMESTAMP(3) NOT NULL,
    "janelaDataFim" TIMESTAMP(3) NOT NULL,
    "status" "StatusServiceRequest" NOT NULL DEFAULT 'TRIAGEM',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "prazoEntrega" TIMESTAMP(3) NOT NULL,
    "status" "StatusBudget" NOT NULL DEFAULT 'PENDENTE',
    "contrapropostaStatus" "StatusContraproposta" NOT NULL DEFAULT 'NENHUMA',
    "valorContraproposta" DOUBLE PRECISION,
    "prazoEntregaContraproposta" TIMESTAMP(3),
    "contrapropostaMensagem" TEXT,
    "contrapropostaCriadaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "comissaoValor" DOUBLE PRECISION NOT NULL,
    "comissaoPercentual" DOUBLE PRECISION NOT NULL,
    "pagamentoStatus" TEXT NOT NULL DEFAULT 'simulado_aprovado',
    "status" "StatusBooking" NOT NULL DEFAULT 'FECHADO',
    "checkInHorario" TIMESTAMP(3),
    "checkInLatitude" DOUBLE PRECISION,
    "checkInLongitude" DOUBLE PRECISION,
    "checkInDentroGeofence" BOOLEAN,
    "checkInAtrasado" BOOLEAN NOT NULL DEFAULT false,
    "checkOutHorario" TIMESTAMP(3),
    "checkOutLatitude" DOUBLE PRECISION,
    "checkOutLongitude" DOUBLE PRECISION,
    "alertaSaidaProlongada" BOOLEAN NOT NULL DEFAULT false,
    "canceladoPor" "OrigemCancelamento",
    "canceladoEm" TIMESTAMP(3),
    "motivoCancelamento" TEXT,
    "canceladoAntesDoDia" BOOLEAN,
    "statusConclusao" "StatusConclusao",
    "conclusaoMarcadaEm" TIMESTAMP(3),
    "conclusaoConfirmadaEm" TIMESTAMP(3),
    "conclusaoAutoConfirmada" BOOLEAN NOT NULL DEFAULT false,
    "contestacaoConclusaoTexto" TEXT,
    "contestacaoConclusaoDataEnvio" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "depoimento" TEXT,
    "fotosJson" TEXT,
    "tokensGerados" INTEGER NOT NULL DEFAULT 0,
    "statusContestacao" "StatusContestacao" NOT NULL DEFAULT 'NENHUMA',
    "replicaWorkerTexto" TEXT,
    "replicaWorkerFotosJson" TEXT,
    "replicaWorkerDataEnvio" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "clientProfileId" TEXT NOT NULL,
    "reviewId" TEXT,
    "bookingId" TEXT,
    "descricao" TEXT,
    "tipo" "TipoWalletTransaction" NOT NULL,
    "valorTokens" INTEGER NOT NULL,
    "valorReais" DOUBLE PRECISION NOT NULL,
    "status" "StatusWalletTransaction" NOT NULL DEFAULT 'CARENCIA',
    "liberadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Strike" (
    "id" TEXT NOT NULL,
    "workerId" TEXT,
    "clientProfileId" TEXT,
    "tipoInfracao" TEXT NOT NULL,
    "gravidade" "GravidadeStrike" NOT NULL,
    "dataOcorrencia" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "statusContestacao" "StatusContestacao" NOT NULL DEFAULT 'NENHUMA',
    "observacao" TEXT,
    "replicaTexto" TEXT,
    "replicaFotosJson" TEXT,
    "replicaDataEnvio" TIMESTAMP(3),

    CONSTRAINT "Strike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "reviewId" TEXT,
    "strikeId" TEXT,
    "repasseId" TEXT,
    "evidenciasJson" TEXT,
    "decisao" TEXT,
    "decididoPorId" TEXT,
    "dataDecisao" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ServiceCategoryToWorkerProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ServiceCategoryToWorkerProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProfile_userId_key" ON "ClientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerProfile_userId_key" ON "WorkerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioItem_bookingId_key" ON "PortfolioItem"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "AgendaDia_workerProfileId_data_key" ON "AgendaDia"("workerProfileId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_nome_key" ON "ServiceCategory"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_budgetId_key" ON "Booking"("budgetId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "_ServiceCategoryToWorkerProfile_B_index" ON "_ServiceCategoryToWorkerProfile"("B");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelamentoTardio" ADD CONSTRAINT "CancelamentoTardio_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerProfile" ADD CONSTRAINT "WorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepasseWorker" ADD CONSTRAINT "RepasseWorker_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepasseWorker" ADD CONSTRAINT "RepasseWorker_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePhoto" ADD CONSTRAINT "ServicePhoto_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaDia" ADD CONSTRAINT "AgendaDia_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubService" ADD CONSTRAINT "SubService_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strike" ADD CONSTRAINT "Strike_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strike" ADD CONSTRAINT "Strike_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_strikeId_fkey" FOREIGN KEY ("strikeId") REFERENCES "Strike"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_repasseId_fkey" FOREIGN KEY ("repasseId") REFERENCES "RepasseWorker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_decididoPorId_fkey" FOREIGN KEY ("decididoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceCategoryToWorkerProfile" ADD CONSTRAINT "_ServiceCategoryToWorkerProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "ServiceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceCategoryToWorkerProfile" ADD CONSTRAINT "_ServiceCategoryToWorkerProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
