CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paymentRef` varchar(64) NOT NULL,
	`omcId` int NOT NULL,
	`taxReturnId` int,
	`enforcementCaseId` int,
	`paymentType` enum('excise_duty','vat','petroleum_levy','penalty','interest','other') NOT NULL,
	`amount` decimal(18,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'NLE',
	`status` enum('pending','processing','completed','failed','reversed') NOT NULL DEFAULT 'pending',
	`paymentMethod` enum('bank_transfer','cheque','cash','mobile_money','online') DEFAULT 'bank_transfer',
	`bankName` varchar(128),
	`bankRef` varchar(128),
	`proofFileKey` varchar(512),
	`proofFileName` varchar(255),
	`proofFileUrl` varchar(1024),
	`paidAt` timestamp,
	`verifiedAt` timestamp,
	`verifiedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_paymentRef_unique` UNIQUE(`paymentRef`)
);
--> statement-breakpoint
CREATE TABLE `penalties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`penaltyRef` varchar(64) NOT NULL,
	`omcId` int NOT NULL,
	`enforcementCaseId` int,
	`taxReturnId` int,
	`penaltyType` enum('late_filing','underpayment','non_compliance','fraud','interest','other') NOT NULL,
	`principalAmount` decimal(18,2) NOT NULL,
	`penaltyAmount` decimal(18,2) NOT NULL,
	`interestAmount` decimal(18,2) DEFAULT '0',
	`totalDue` decimal(18,2) NOT NULL,
	`status` enum('outstanding','partial','paid','waived','appealed') NOT NULL DEFAULT 'outstanding',
	`dueDate` timestamp,
	`paidDate` timestamp,
	`reason` text,
	`issuedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `penalties_id` PRIMARY KEY(`id`),
	CONSTRAINT `penalties_penaltyRef_unique` UNIQUE(`penaltyRef`)
);
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `omcId`;