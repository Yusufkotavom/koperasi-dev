-- CreateTable
CREATE TABLE "unit_usaha_sales" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerName" TEXT NOT NULL,
    "nasabahId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'TOKO',
    "metodeBayar" "MetodeBayar" NOT NULL DEFAULT 'TUNAI',
    "kasJenis" TEXT NOT NULL DEFAULT 'TUNAI',
    "total" DECIMAL(15,2) NOT NULL,
    "catatan" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "unit_usaha_sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unit_usaha_sales_companyId_invoiceNo_key" ON "unit_usaha_sales"("companyId", "invoiceNo");

-- CreateIndex
CREATE INDEX "unit_usaha_sales_companyId_tanggal_idx" ON "unit_usaha_sales"("companyId", "tanggal");

-- CreateIndex
CREATE INDEX "unit_usaha_sales_companyId_nasabahId_idx" ON "unit_usaha_sales"("companyId", "nasabahId");

-- AddForeignKey
ALTER TABLE "unit_usaha_sales" ADD CONSTRAINT "unit_usaha_sales_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_usaha_sales" ADD CONSTRAINT "unit_usaha_sales_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_usaha_sales" ADD CONSTRAINT "unit_usaha_sales_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE SET NULL ON UPDATE CASCADE;
