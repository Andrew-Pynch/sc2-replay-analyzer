"use server";

import { db } from "~/server/db";
import { replays, players, replayPlayers, buildOrders } from "~/server/db/schema";
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
  timestamp: number;
  order_index: number;
  formatted_time: string;
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
  const { game_info, players: playersData } = analysis;
  
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

    // Insert build order actions
    if (build_order && build_order.length > 0) {
      const buildOrderData = build_order.map((action) => ({
        replayPlayerId: replayPlayerRecord.id,
        actionName: action.action_name,
        timestamp: action.timestamp,
        orderIndex: action.order_index,
      }));
      
      await db.insert(buildOrders).values(buildOrderData);
    }
  }
  
  return replayRecord.id;
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
 * Analyze a replay file and store it with a specific slug
 */
export async function analyzeReplay(filename: string, slug: string): Promise<void> {
  // Check if replay already exists with this slug
  const existingReplay = await db
    .select()
    .from(replays)
    .where(eq(replays.slug, slug))
    .limit(1);
  
  if (existingReplay.length > 0) {
    throw new Error("Replay with this slug already exists");
  }
  
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