"use server";

import { db } from "~/server/db";
import { replays, players, replayPlayers, buildOrders, replaySnapshots } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";

export interface ReplayFile {
  name: string;
  path: string;
}

export interface PlayerStats {
  name: string;
  race: string;
  team: number;
  result: string;
  apm: number;
  resources_collected: number;
  units_killed: number;
  army_value_max: number;
}

export interface BuildOrderAction {
  action_name: string;
  unit_type?: string; // Optional for backward compatibility
  timestamp: number;
  order_index: number;
  formatted_time: string;
}

export interface TimeSeriesSnapshot {
  timestamp: number; // Now supports decimal timestamps (0.1 second precision)
  players: Record<string, {
    name: string;
    race: string;
    team: number;
    units: Array<{
      type: string;
      x: number;
      y: number;
      unit_id?: number;
      vx?: number; // Velocity in x direction (units per second)
      vy?: number; // Velocity in y direction (units per second)
    }>;
    buildings: Array<{
      type: string;
      x: number;
      y: number;
      unit_id?: number;
      vx?: number; // Velocity in x direction (usually 0 for buildings)
      vy?: number; // Velocity in y direction (usually 0 for buildings)
    }>;
  }>;
}

export interface ReplayAnalysisResult {
  success: boolean;
  game_info: {
    filename: string;
    map_name: string;
    game_version: string;
    duration: number;
    played_at: number;
  };
  players: Array<{
    player: PlayerStats;
    build_order: BuildOrderAction[];
  }>;
  time_series?: TimeSeriesSnapshot[];
  error?: string;
}

/**
 * Get list of replay files from the replays directory
 */
export async function getReplayFiles(): Promise<ReplayFile[]> {
  try {
    const replaysDir = path.join(process.cwd(), "replays");
    const files = await fs.readdir(replaysDir);
    
    return files
      .filter(file => file.endsWith(".SC2Replay"))
      .map(file => ({
        name: file,
        path: path.join(replaysDir, file)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error reading replay files:", error);
    return [];
  }
}

/**
 * Execute Python script to analyze replay
 */
function analyzeReplayWithPython(replayPath: string): Promise<ReplayAnalysisResult> {
  return new Promise((resolve) => {
    const pythonScript = path.join(process.cwd(), "python", "analyze_replay.py");
    const child = spawn("python3", [pythonScript, replayPath]);
    
    let stdout = "";
    let stderr = "";
    
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    
    child.on("close", (code) => {
      if (code !== 0) {
        resolve({
          success: false,
          game_info: {
            filename: path.basename(replayPath),
            map_name: "",
            game_version: "",
            duration: 0,
            played_at: 0,
          },
          players: [],
          error: `Python script failed with code ${code}: ${stderr}`
        });
        return;
      }
      
      try {
        const result = JSON.parse(stdout) as ReplayAnalysisResult;
        resolve(result);
      } catch (parseError) {
        resolve({
          success: false,
          game_info: {
            filename: path.basename(replayPath),
            map_name: "",
            game_version: "",
            duration: 0,
            played_at: 0,
          },
          players: [],
          error: `Failed to parse Python output: ${parseError}`
        });
      }
    });
  });
}

/**
 * Store replay analysis results in the database
 */
async function storeReplayInDatabase(analysis: ReplayAnalysisResult, slug: string) {
  const { game_info, players: playersData, time_series } = analysis;
  
  // Insert replay record
  const [replayRecord] = await db
    .insert(replays)
    .values({
      slug,
      filename: game_info.filename,
      mapName: game_info.map_name,
      gameVersion: game_info.game_version,
      duration: Math.floor(game_info.duration),
      playedAt: game_info.played_at ? new Date(game_info.played_at * 1000) : null,
    })
    .returning();

  if (!replayRecord) {
    throw new Error("Failed to insert replay record");
  }

  // Process each player
  for (const playerData of playersData) {
    const { player, build_order } = playerData;
    
    // Check if player already exists
    let playerRecord = await db
      .select()
      .from(players)
      .where(eq(players.name, player.name))
      .limit(1);
    
    // Create player if doesn't exist
    if (playerRecord.length === 0) {
      const [newPlayer] = await db
        .insert(players)
        .values({
          name: player.name,
          race: player.race,
        })
        .returning();
      
      if (!newPlayer) {
        throw new Error(`Failed to insert player: ${player.name}`);
      }
      
      playerRecord = [newPlayer];
    }
    
    // Insert replay-player relationship
    const [replayPlayerRecord] = await db
      .insert(replayPlayers)
      .values({
        replayId: replayRecord.id,
        playerId: playerRecord[0]!.id,
        team: player.team,
        result: player.result,
        apm: player.apm ?? 0,
        resourcesCollected: player.resources_collected ?? 0,
        unitsKilled: player.units_killed ?? 0,
        armyValueMax: player.army_value_max ?? 0,
      })
      .returning();

    if (!replayPlayerRecord) {
      throw new Error(`Failed to insert replay-player record for ${player.name}`);
    }

    // Insert build order actions (batch insert to avoid SQLite variable limit)
    if (build_order && build_order.length > 0) {
      const buildOrderData = build_order.map((action) => ({
        replayPlayerId: replayPlayerRecord.id,
        actionName: action.action_name,
        unitType: action.unit_type ?? null, // Store unit_type if available
        timestamp: action.timestamp,
        orderIndex: action.order_index,
      }));
      
      // SQLite has a limit of 999 variables per statement
      // With 5 columns per record, we can safely insert 199 records per batch (995 variables)
      const batchSize = 199;
      
      for (let i = 0; i < buildOrderData.length; i += batchSize) {
        const batch = buildOrderData.slice(i, i + batchSize);
        await db.insert(buildOrders).values(batch);
      }
    }
  }
  
  // Store time series data if available (batch insert to avoid SQLite variable limit)
  if (time_series && time_series.length > 0) {
    const snapshotData = time_series.map(snapshot => ({
      replayId: replayRecord.id,
      timestamp: snapshot.timestamp,
      snapshotData: JSON.stringify(snapshot.players),
    }));
    
    // SQLite has a limit of 999 variables per statement
    // With 3 columns per record, we can safely insert 300 records per batch (900 variables)
    const batchSize = 300;
    
    for (let i = 0; i < snapshotData.length; i += batchSize) {
      const batch = snapshotData.slice(i, i + batchSize);
      await db.insert(replaySnapshots).values(batch);
    }
  }
  
  return replayRecord.id;
}

/**
 * Get all analyzed replays with basic info
 */
export async function getAnalyzedReplays(): Promise<Array<{
  id: number;
  slug: string;
  filename: string;
  mapName: string | null;
  duration: number | null;
  playedAt: Date | null;
  processedAt: Date;
}>> {
  const analyzedReplays = await db
    .select({
      id: replays.id,
      slug: replays.slug,
      filename: replays.filename,
      mapName: replays.mapName,
      duration: replays.duration,
      playedAt: replays.playedAt,
      processedAt: replays.processedAt,
    })
    .from(replays)
    .orderBy(replays.processedAt);
  
  return analyzedReplays.filter(replay => replay.slug !== null) as Array<{
    id: number;
    slug: string;
    filename: string;
    mapName: string | null;
    duration: number | null;
    playedAt: Date | null;
    processedAt: Date;
  }>;
}

/**
 * Get replay data by slug
 */
export async function getReplayBySlug(slug: string): Promise<ReplayAnalysisResult | null> {
  const existingReplay = await db
    .select()
    .from(replays)
    .where(eq(replays.slug, slug))
    .limit(1);
  
  if (existingReplay.length === 0) {
    return null;
  }
  
  const replayId = existingReplay[0]!.id;
  
  // Get players and build orders for this replay
  const replayPlayersData = await db
    .select({
      player: players,
      replayPlayer: replayPlayers,
      buildOrders: buildOrders,
    })
    .from(replayPlayers)
    .innerJoin(players, eq(replayPlayers.playerId, players.id))
    .leftJoin(buildOrders, eq(buildOrders.replayPlayerId, replayPlayers.id))
    .where(eq(replayPlayers.replayId, replayId));
  
  // Group build orders by player
  const playersMap = new Map<number, {
    player: PlayerStats;
    build_order: BuildOrderAction[];
  }>();
  
  replayPlayersData.forEach((row) => {
    const playerId = row.replayPlayer.id;
    
    if (!playersMap.has(playerId)) {
      playersMap.set(playerId, {
        player: {
          name: row.player.name,
          race: row.player.race ?? "",
          team: row.replayPlayer.team,
          result: row.replayPlayer.result ?? "",
          apm: row.replayPlayer.apm ?? 0,
          resources_collected: row.replayPlayer.resourcesCollected ?? 0,
          units_killed: row.replayPlayer.unitsKilled ?? 0,
          army_value_max: row.replayPlayer.armyValueMax ?? 0,
        },
        build_order: [],
      });
    }
    
    if (row.buildOrders) {
      const minutes = Math.floor(row.buildOrders.timestamp / 60);
      const seconds = row.buildOrders.timestamp % 60;
      
      playersMap.get(playerId)!.build_order.push({
        action_name: row.buildOrders.actionName,
        unit_type: row.buildOrders.unitType ?? undefined, // Include unit_type if available
        timestamp: row.buildOrders.timestamp,
        order_index: row.buildOrders.orderIndex,
        formatted_time: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      });
    }
  });
  
  // Sort build orders by order index
  playersMap.forEach((playerData) => {
    playerData.build_order.sort((a, b) => a.order_index - b.order_index);
  });
  
  return {
    success: true,
    game_info: {
      filename: existingReplay[0]!.filename,
      map_name: existingReplay[0]!.mapName ?? "",
      game_version: existingReplay[0]!.gameVersion ?? "",
      duration: existingReplay[0]!.duration ?? 0,
      played_at: existingReplay[0]!.playedAt ? Math.floor(existingReplay[0]!.playedAt.getTime() / 1000) : 0,
    },
    players: Array.from(playersMap.values()),
  };
}

/**
 * Get time series data for a replay by slug
 */
export async function getReplayTimeSeriesBySlug(slug: string): Promise<TimeSeriesSnapshot[]> {
  const existingReplay = await db
    .select()
    .from(replays)
    .where(eq(replays.slug, slug))
    .limit(1);
  
  if (existingReplay.length === 0) {
    return [];
  }
  
  const replayId = existingReplay[0]!.id;
  
  // Get all snapshots for this replay
  const snapshots = await db
    .select({
      timestamp: replaySnapshots.timestamp,
      snapshotData: replaySnapshots.snapshotData,
    })
    .from(replaySnapshots)
    .where(eq(replaySnapshots.replayId, replayId))
    .orderBy(replaySnapshots.timestamp);
  
  return snapshots.map(snapshot => ({
    timestamp: snapshot.timestamp,
    players: JSON.parse(snapshot.snapshotData) as Record<string, {
      name: string;
      race: string;
      team: number;
      units: Array<{
        type: string;
        x: number;
        y: number;
        unit_id?: number;
      }>;
      buildings: Array<{
        type: string;
        x: number;
        y: number;
        unit_id?: number;
      }>;
    }>,
  }));
}

/**
 * Delete existing replay data by slug for re-analysis
 */
async function deleteExistingReplay(slug: string): Promise<void> {
  const existingReplay = await db
    .select()
    .from(replays)
    .where(eq(replays.slug, slug))
    .limit(1);
  
  if (existingReplay.length === 0) {
    return;
  }
  
  const replayId = existingReplay[0]!.id;
  
  // Get all replayPlayer IDs for this replay
  const replayPlayerIds = await db
    .select({ id: replayPlayers.id })
    .from(replayPlayers)
    .where(eq(replayPlayers.replayId, replayId));
  
  // Delete build orders first (due to foreign key constraints)
  if (replayPlayerIds.length > 0) {
    for (const { id } of replayPlayerIds) {
      await db.delete(buildOrders).where(eq(buildOrders.replayPlayerId, id));
    }
  }
  
  // Delete replay players
  await db.delete(replayPlayers).where(eq(replayPlayers.replayId, replayId));
  
  // Delete replay snapshots
  await db.delete(replaySnapshots).where(eq(replaySnapshots.replayId, replayId));
  
  // Delete the replay itself
  await db.delete(replays).where(eq(replays.id, replayId));
}

/**
 * Analyze a replay file and store it with a specific slug
 */
export async function analyzeReplay(filename: string, slug: string): Promise<void> {
  // Delete existing replay data if it exists (for re-analysis)
  await deleteExistingReplay(slug);
  
  // Analyze fresh replay
  const replayPath = path.join(process.cwd(), "replays", filename);
  
  // Check if file exists
  try {
    await fs.access(replayPath);
  } catch {
    throw new Error(`Replay file not found: ${filename}`);
  }
  
  // Run Python analysis
  const analysis = await analyzeReplayWithPython(replayPath);
  
  if (!analysis.success) {
    throw new Error(analysis.error || "Analysis failed");
  }
  
  // Store in database with slug
  await storeReplayInDatabase(analysis, slug);
}