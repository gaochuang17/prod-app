/*
  Warnings:

  - You are about to drop the `todos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `todos`;

-- CreateTable
CREATE TABLE `records` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('income', 'expense') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `category` VARCHAR(64) NOT NULL,
    `note` VARCHAR(500) NOT NULL DEFAULT '',
    `date` DATE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `records_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
