-- AlterTable
ALTER TABLE "User" ADD COLUMN     "totalStorageUsed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "fileSize" INTEGER NOT NULL DEFAULT 0;
