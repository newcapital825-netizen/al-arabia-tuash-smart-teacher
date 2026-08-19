ALTER TABLE `documents` ADD `expiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `licenses` ADD `plan` enum('free_trial','limited','open') DEFAULT 'limited' NOT NULL;--> statement-breakpoint
ALTER TABLE `licenses` ADD `usageLimit` int DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE `licenses` ADD `usageUsed` int DEFAULT 0 NOT NULL;