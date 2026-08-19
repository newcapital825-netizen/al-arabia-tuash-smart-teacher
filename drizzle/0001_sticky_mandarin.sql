CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`extractedText` text,
	`summary` text,
	`pageCount` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `licenseAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accessKey` varchar(128) NOT NULL,
	`userId` int,
	`email` varchar(320),
	`deviceHash` varchar(128),
	`outcome` enum('success','rejected','disabled','not_found') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `licenseAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `licenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accessKey` varchar(128) NOT NULL,
	`status` enum('available','active','disabled') NOT NULL DEFAULT 'available',
	`boundUserId` int,
	`boundEmail` varchar(320),
	`boundDeviceHash` varchar(128),
	`activatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `licenses_id` PRIMARY KEY(`id`),
	CONSTRAINT `licenses_accessKey_unique` UNIQUE(`accessKey`)
);
--> statement-breakpoint
CREATE TABLE `usageEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentId` int,
	`eventType` enum('upload','summary','question') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usageEvents_id` PRIMARY KEY(`id`)
);
