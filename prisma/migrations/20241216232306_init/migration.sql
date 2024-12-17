-- CreateEnum
CREATE TYPE "Option" AS ENUM ('CAPTURE', 'MENU', 'READ');

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'REDACTOR', 'EMPLEADO');

-- CreateEnum
CREATE TYPE "TypeMessage" AS ENUM ('NUMBER', 'NAME', 'DEFAULT');

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) DEFAULT '9999-12-12 00:00:00 +00:00',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "available" BOOLEAN NOT NULL DEFAULT true,
    "numOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "option" "Option" NOT NULL,
    "typeMessage" "TypeMessage" NOT NULL,
    "showName" BOOLEAN NOT NULL,
    "trigger" TEXT NOT NULL,
    "parentMessageId" TEXT,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
