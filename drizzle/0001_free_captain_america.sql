CREATE TABLE `audit_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` int,
	`userRole` varchar(32),
	`action` varchar(128) NOT NULL,
	`module` varchar(64) NOT NULL,
	`entityType` varchar(64),
	`entityId` int,
	`description` text,
	`ipAddress` varchar(64),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consignmentRef` varchar(64) NOT NULL,
	`omcId` int NOT NULL,
	`depotId` int,
	`productType` enum('petrol','diesel','kerosene','lpg','jet_fuel') NOT NULL,
	`declaredVolumeLitres` decimal(18,2) NOT NULL,
	`upliftDate` timestamp NOT NULL,
	`sourceTerminal` varchar(255),
	`destinationDepot` varchar(255),
	`vehicleReg` varchar(32),
	`driverName` varchar(255),
	`status` enum('in_transit','delivered','verified','flagged') NOT NULL DEFAULT 'in_transit',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `consignments_consignmentRef_unique` UNIQUE(`consignmentRef`)
);
--> statement-breakpoint
CREATE TABLE `depots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`omcId` int NOT NULL,
	`depotName` varchar(255) NOT NULL,
	`location` varchar(255),
	`depotCode` varchar(32),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `depots_id` PRIMARY KEY(`id`),
	CONSTRAINT `depots_depotCode_unique` UNIQUE(`depotCode`)
);
--> statement-breakpoint
CREATE TABLE `enforcement_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseRef` varchar(64) NOT NULL,
	`omcId` int NOT NULL,
	`taxReturnId` int,
	`caseType` enum('default_assessment','additional_assessment','penalty','interest') NOT NULL,
	`status` enum('open','under_review','notice_issued','appealed','resolved','closed') NOT NULL DEFAULT 'open',
	`assessedAmount` decimal(18,2),
	`penaltyAmount` decimal(18,2),
	`interestAmount` decimal(18,2),
	`totalDue` decimal(18,2),
	`noticeIssuedAt` timestamp,
	`dueDate` timestamp,
	`description` text,
	`assignedOfficerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enforcement_cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `enforcement_cases_caseRef_unique` UNIQUE(`caseRef`)
);
--> statement-breakpoint
CREATE TABLE `omcs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationNumber` varchar(64) NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`tradingName` varchar(255),
	`tinNumber` varchar(64),
	`contactPerson` varchar(255),
	`contactEmail` varchar(320),
	`contactPhone` varchar(32),
	`address` text,
	`status` enum('active','suspended','revoked','pending') NOT NULL DEFAULT 'pending',
	`licenseExpiry` timestamp,
	`depotCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `omcs_id` PRIMARY KEY(`id`),
	CONSTRAINT `omcs_registrationNumber_unique` UNIQUE(`registrationNumber`)
);
--> statement-breakpoint
CREATE TABLE `sicpa_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consignmentId` int,
	`omcId` int NOT NULL,
	`depotId` int,
	`verificationRef` varchar(64),
	`productType` enum('petrol','diesel','kerosene','lpg','jet_fuel') NOT NULL,
	`declaredVolumeLitres` decimal(18,2) NOT NULL,
	`verifiedVolumeLitres` decimal(18,2) NOT NULL,
	`varianceLitres` decimal(18,2),
	`variancePercent` decimal(8,4),
	`discrepancyFlag` enum('none','minor','major','critical') NOT NULL DEFAULT 'none',
	`verificationDate` timestamp NOT NULL DEFAULT (now()),
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	CONSTRAINT `sicpa_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `sicpa_records_verificationRef_unique` UNIQUE(`verificationRef`)
);
--> statement-breakpoint
CREATE TABLE `tax_returns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`omcId` int NOT NULL,
	`periodYear` int NOT NULL,
	`periodQuarter` int NOT NULL,
	`exciseDeclaredVolume` decimal(18,2),
	`exciseDutyRate` decimal(10,4),
	`exciseDutyAmount` decimal(18,2),
	`vatDeclaredVolume` decimal(18,2),
	`vatRate` decimal(10,4),
	`vatAmount` decimal(18,2),
	`levyDeclaredVolume` decimal(18,2),
	`levyRate` decimal(10,4),
	`levyAmount` decimal(18,2),
	`totalDeclaredVolume` decimal(18,2),
	`totalTaxDue` decimal(18,2),
	`totalPaid` decimal(18,2),
	`status` enum('draft','submitted','under_review','assessed','overdue') NOT NULL DEFAULT 'draft',
	`submittedAt` timestamp,
	`dueDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`submittedBy` int,
	CONSTRAINT `tax_returns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','nra_admin','tax_officer','omc_user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `omcId` int;