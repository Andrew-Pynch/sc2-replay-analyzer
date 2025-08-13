import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

const ANALYZER_VERSION = "1.0.1";

interface ReplayAnalysisResult {
  success: boolean;
  game_info?: {
    filename: string;
    map_name: string;
    game_version: string;
    duration: number;
    played_at: number;
  };
  players?: Array<{
    player: {
      name: string;
      race: string;
      team: number;
      result: string;
      apm: number;
      resources_collected: number;
      units_killed: number;
      army_value_max: number;
    };
    build_order: Array<{
      action_name: string;
      timestamp: number;
      order_index: number;
      formatted_time: string;
    }>;
  }>;
  error?: string;
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
          error: `Failed to parse Python output: ${parseError}`
        });
      }
    });
  });
}

export async function GET(request: NextRequest) {
  try {
    console.log(`[TEST-ANALYZER v${ANALYZER_VERSION}] Starting analysis test`);
    
    // Use a hardcoded replay for testing
    const testReplayPath = path.join(process.cwd(), "replays", "20250722 - Game1 - ByuN vs Lambo - Persephone.SC2Replay");
    
    // Run Python analysis
    const analysis = await analyzeReplayWithPython(testReplayPath);
    
    console.log(`[TEST-ANALYZER v${ANALYZER_VERSION}] Analysis completed:`, {
      success: analysis.success,
      playerCount: analysis.players?.length || 0,
      hasError: !!analysis.error
    });
    
    if (analysis.success && analysis.players) {
      console.log(`[TEST-ANALYZER v${ANALYZER_VERSION}] Player stats:`, 
        analysis.players.map(p => ({
          name: p.player.name,
          apm: p.player.apm,
          resources: p.player.resources_collected,
          unitsKilled: p.player.units_killed,
          armyValue: p.player.army_value_max
        }))
      );
    }
    
    return NextResponse.json({
      version: ANALYZER_VERSION,
      timestamp: new Date().toISOString(),
      testFile: path.basename(testReplayPath),
      analysis
    });
    
  } catch (error) {
    console.error(`[TEST-ANALYZER v${ANALYZER_VERSION}] Error:`, error);
    return NextResponse.json({
      version: ANALYZER_VERSION,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
}