PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sc2-replay-analyzer_replay` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(100),
	`filename` text(255) NOT NULL,
	`mapName` text(255),
	`gameVersion` text(50),
	`duration` integer,
	`playedAt` integer,
	`processedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_sc2-replay-analyzer_replay`("id", "slug", "filename", "mapName", "gameVersion", "duration", "playedAt", "processedAt", "createdAt") SELECT "id", "slug", "filename", "mapName", "gameVersion", "duration", "playedAt", "processedAt", "createdAt" FROM `sc2-replay-analyzer_replay`;--> statement-breakpoint
DROP TABLE `sc2-replay-analyzer_replay`;--> statement-breakpoint
ALTER TABLE `__new_sc2-replay-analyzer_replay` RENAME TO `sc2-replay-analyzer_replay`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `sc2-replay-analyzer_replay_slug_unique` ON `sc2-replay-analyzer_replay` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `sc2-replay-analyzer_replay_filename_unique` ON `sc2-replay-analyzer_replay` (`filename`);--> statement-breakpoint
CREATE INDEX `replay_slug_idx` ON `sc2-replay-analyzer_replay` (`slug`);--> statement-breakpoint
CREATE INDEX `replay_filename_idx` ON `sc2-replay-analyzer_replay` (`filename`);--> statement-breakpoint
CREATE INDEX `replay_map_idx` ON `sc2-replay-analyzer_replay` (`mapName`);--> statement-breakpoint
CREATE INDEX `replay_processed_idx` ON `sc2-replay-analyzer_replay` (`processedAt`);