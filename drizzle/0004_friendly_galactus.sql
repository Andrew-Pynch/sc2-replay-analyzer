CREATE TABLE `sc2-replay-analyzer_replay_snapshot` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`replayId` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`snapshotData` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`replayId`) REFERENCES `sc2-replay-analyzer_replay`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `replay_snapshot_replay_idx` ON `sc2-replay-analyzer_replay_snapshot` (`replayId`);--> statement-breakpoint
CREATE INDEX `replay_snapshot_timestamp_idx` ON `sc2-replay-analyzer_replay_snapshot` (`timestamp`);