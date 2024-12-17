/*
  Warnings:

  - The values [DEFAULT] on the enum `TypeMessage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TypeMessage_new" AS ENUM ('NUMBER', 'NAME', 'NONE');
ALTER TABLE "messages" ALTER COLUMN "typeMessage" TYPE "TypeMessage_new" USING ("typeMessage"::text::"TypeMessage_new");
ALTER TYPE "TypeMessage" RENAME TO "TypeMessage_old";
ALTER TYPE "TypeMessage_new" RENAME TO "TypeMessage";
DROP TYPE "TypeMessage_old";
COMMIT;

-- AlterTable
ALTER TABLE "messages" ALTER COLUMN "typeMessage" SET DEFAULT 'NONE',
ALTER COLUMN "trigger" DROP NOT NULL;
