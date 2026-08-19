ALTER TABLE `documents` ADD `analysisKey` varchar(512);--> statement-breakpoint
ALTER TABLE `documents` DROP COLUMN `extractedText`;--> statement-breakpoint
ALTER TABLE `documents` DROP COLUMN `summary`;