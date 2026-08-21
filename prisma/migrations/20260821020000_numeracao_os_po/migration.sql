-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "numeroPO" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "numeroOS" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "SequenciaDiaria" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "contador" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SequenciaDiaria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SequenciaDiaria_tipo_data_key" ON "SequenciaDiaria"("tipo", "data");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_numeroPO_key" ON "Budget"("numeroPO");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_numeroOS_key" ON "ServiceRequest"("numeroOS");

