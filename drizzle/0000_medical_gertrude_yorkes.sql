CREATE TABLE `sc2-replay-analyzer_account` (
	`userId` text(255) NOT NULL,
	`type` text(255) NOT NULL,
	`provider` text(255) NOT NULL,
	`providerAccountId` text(255) NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text(255),
	`scope` text(255),
	`id_token` text,
	`session_state` text(255),
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `sc2-replay-analyzer_user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `sc2-replay-analyzer_account` (`userId`);--> statement-breakpoint
CREATE TABLE `sc2-replay-analyzer_build_order` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`replayPlayerId` integer NOT NULL,
	`actionName` text(255) NOT NULL,
	`timestamp` integer NOT NULL,
	`orderIndex` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`replayPlayerId`) REFERENCES `sc2-replay-analyzer_replay_player`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `build_order_replay_player_idx` ON `sc2-replay-analyzer_build_order` (`replayPlayerId`);--> statement-breakpoint
CREATE INDEX `build_order_timestamp_idx` ON `sc2-replay-analyzer_build_order` (`timestamp`);--> statement-breakpoint
CREATE INDEX `build_order_order_idx` ON `sc2-replay-analyzer_build_order` (`orderIndex`);--> statement-breakpoint
CREATE TABLE `sc2-replay-analyzer_player` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(255) NOT NULL,
	`race` text(50),
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `player_name_idx` ON `sc2-replay-analyzer_player` (`name`);--> statement-breakpoint
CREATE INDEX `player_race_idx` ON `sc2-replay-analyzer_player` (`race`);--> statement-breakpoint
CREATE TABLE `sc2-replay-analyzer_post` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(256),
	`createdById` text(255) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`createdById`) REFERENCES `sc2-replay-analyzer_user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `created_by_idx` ON `sc2-replay-analyzer_post` (`createdById`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `sc2-replay-analyzer_post` (`name`);--> statement-breakpoint
CREATE TABLE `sc2-replay-analyzer_replay_player` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`replayId` integer NOT NULL,
	`playerId` integer NOT NULL,
	`team` integer NOT NULL,
	`result` text(20),
	`apm` integer,
	`resourcesCollected` integer,
	`unitsKilled` integer,
	`armyValueMax` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`replayId`) REFERENCES `sc2-replay-analyzer_replay`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`playerId`) REFERENCES `sc2-replay-analyzer_player`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `replay_player_replay_idx` ON `sc2-replay-analyzer_replay_player` (`replayId`);--> statement-breakpoint
CREATE INDEX `replay_player_player_idx` ON `sc2-replay-analyzer_replay_player` (`playerId`);--> statement-breakpoint
CREATE INDEX `replay_player_team_idx` ON `sc2-replay-analyzer_replay_player` (`team`);--> statement-breakpoint
CREATE TABLE `sc2-replay-analyzer_replay` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text(255) NOT NULL,
	`mapName` text(255),
	`gameVersion` text(50),
	`duration` integer,
	`playedAt` integer,
	`processedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sc2-replay-analyzer_replay_filename_unique` ON `sc2-replay-analyzer_replay` (`filename`);--> statement-breakpoint
CREATE INDEX `replay_filename_idx` ON `sc2-replay-analyzer_replay` (`filename`);--> statement-breakpoint
CREATE INDEX `replay_map_idx` ON `sc2-replay-analyzer_replay` (`mapName`);--> statement-breakpoint
CREATE INDEX `replay_processed_idx` ON `sc2-replay-analyzer_replay` (`processedAt`);--> statement-breakpoint
CREATE TABLE `sc2-replay-analyzer_session` (
	`sessionToken` text(255) PRIMARY KEY NOT NULL,
	`userId` text(255) NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `sc2-replay-analyzer_user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `sc2-replay-analyzer_session` (`userId`);--> statement-breakpoint
CREATE TABLE `sc2-replay-analyzer_user` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`name` text(255),
	`email` text(255) NOT NULL,
	`emailVerified` integer DEFAULT (unixepoch()),
	`image` text(255)
);
--> statement-breakpoint
CREATE TABLE `sc2-replay-analyzer_verification_token` (
	`identifier` text(255) NOT NULL,
	`token` text(255) NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
