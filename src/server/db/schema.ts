import { relations, sql } from "drizzle-orm";
import { index, primaryKey, sqliteTableCreator } from "drizzle-orm/sqlite-core";
import { type AdapterAccount } from "@auth/core/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator(
  (name) => `sc2-replay-analyzer_${name}`,
);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    name: d.text({ length: 256 }),
    createdById: d
      .text({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const users = createTable("user", (d) => ({
  id: d
    .text({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.text({ length: 255 }),
  email: d.text({ length: 255 }).notNull(),
  emailVerified: d.integer({ mode: "timestamp" }).default(sql`(unixepoch())`),
  image: d.text({ length: 255 }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.text({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.text({ length: 255 }).notNull(),
    providerAccountId: d.text({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.text({ length: 255 }),
    scope: d.text({ length: 255 }),
    id_token: d.text(),
    session_state: d.text({ length: 255 }),
  }),
  (t) => [
    primaryKey({
      columns: [t.provider, t.providerAccountId],
    }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.text({ length: 255 }).notNull().primaryKey(),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.integer({ mode: "timestamp" }).notNull(),
  }),
  (t) => [index("session_userId_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.text({ length: 255 }).notNull(),
    token: d.text({ length: 255 }).notNull(),
    expires: d.integer({ mode: "timestamp" }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// SC2 Replay Analysis Tables
export const replays = createTable(
  "replay",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    slug: d.text({ length: 100 }).unique(),
    filename: d.text({ length: 255 }).notNull().unique(),
    mapName: d.text({ length: 255 }),
    gameVersion: d.text({ length: 50 }),
    duration: d.integer(), // Duration in seconds
    playedAt: d.integer({ mode: "timestamp" }),
    processedAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  }),
  (t) => [
    index("replay_slug_idx").on(t.slug),
    index("replay_filename_idx").on(t.filename),
    index("replay_map_idx").on(t.mapName),
    index("replay_processed_idx").on(t.processedAt),
  ],
);

export const players = createTable(
  "player",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    name: d.text({ length: 255 }).notNull(),
    race: d.text({ length: 50 }), // Terran, Protoss, Zerg
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  }),
  (t) => [
    index("player_name_idx").on(t.name),
    index("player_race_idx").on(t.race),
  ],
);

export const replayPlayers = createTable(
  "replay_player",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    replayId: d
      .integer()
      .notNull()
      .references(() => replays.id),
    playerId: d
      .integer()
      .notNull()
      .references(() => players.id),
    team: d.integer().notNull(), // 0 or 1
    result: d.text({ length: 20 }), // "Victory" or "Defeat"
    apm: d.integer(), // Actions per minute
    resourcesCollected: d.integer(),
    unitsKilled: d.integer(),
    armyValueMax: d.integer(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  }),
  (t) => [
    index("replay_player_replay_idx").on(t.replayId),
    index("replay_player_player_idx").on(t.playerId),
    index("replay_player_team_idx").on(t.team),
  ],
);

export const buildOrders = createTable(
  "build_order",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    replayPlayerId: d
      .integer()
      .notNull()
      .references(() => replayPlayers.id),
    actionName: d.text({ length: 255 }).notNull(),
    unitType: d.text({ length: 255 }), // Optional unit type for icon mapping
    timestamp: d.integer().notNull(), // Time in seconds from game start
    orderIndex: d.integer().notNull(), // Sequential order of the action
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  }),
  (t) => [
    index("build_order_replay_player_idx").on(t.replayPlayerId),
    index("build_order_timestamp_idx").on(t.timestamp),
    index("build_order_order_idx").on(t.orderIndex),
  ],
);

export const replaySnapshots = createTable(
  "replay_snapshot",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    replayId: d
      .integer()
      .notNull()
      .references(() => replays.id),
    timestamp: d.integer().notNull(), // Time in seconds from game start
    snapshotData: d.text().notNull(), // JSON string containing units/buildings positions
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  }),
  (t) => [
    index("replay_snapshot_replay_idx").on(t.replayId),
    index("replay_snapshot_timestamp_idx").on(t.timestamp),
  ],
);

// Relations
export const replaysRelations = relations(replays, ({ many }) => ({
  replayPlayers: many(replayPlayers),
  snapshots: many(replaySnapshots),
}));

export const playersRelations = relations(players, ({ many }) => ({
  replayPlayers: many(replayPlayers),
}));

export const replayPlayersRelations = relations(replayPlayers, ({ one, many }) => ({
  replay: one(replays, {
    fields: [replayPlayers.replayId],
    references: [replays.id],
  }),
  player: one(players, {
    fields: [replayPlayers.playerId],
    references: [players.id],
  }),
  buildOrders: many(buildOrders),
}));

export const buildOrdersRelations = relations(buildOrders, ({ one }) => ({
  replayPlayer: one(replayPlayers, {
    fields: [buildOrders.replayPlayerId],
    references: [replayPlayers.id],
  }),
}));

export const replaySnapshotsRelations = relations(replaySnapshots, ({ one }) => ({
  replay: one(replays, {
    fields: [replaySnapshots.replayId],
    references: [replays.id],
  }),
}));
