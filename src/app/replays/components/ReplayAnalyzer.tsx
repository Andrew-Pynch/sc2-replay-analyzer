"use client";

import { useState } from "react";
import { analyzeReplay, type ReplayFile, type ReplayAnalysisResult } from "../actions";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Loader2, Play, Clock, Map, Users } from "lucide-react";
import { Alert, AlertDescription } from "~/components/ui/alert";

interface ReplayAnalyzerProps {
  replayFiles: ReplayFile[];
}

type ProcessingStatus = "idle" | "processing" | "complete" | "error";

export default function ReplayAnalyzer({ replayFiles }: ReplayAnalyzerProps) {
  const [selectedReplay, setSelectedReplay] = useState<string>("");
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [analysisResult, setAnalysisResult] = useState<ReplayAnalysisResult | null>(null);
  const [error, setError] = useState<string>("");
  const [fromCache, setFromCache] = useState<boolean>(false);

  const handleAnalyze = async () => {
    if (!selectedReplay) return;

    setStatus("processing");
    setError("");
    setAnalysisResult(null);

    try {
      const result = await analyzeReplay(selectedReplay);

      if (result.success && result.data) {
        setAnalysisResult(result.data);
        setFromCache(result.fromCache ?? false);
        setStatus("complete");
      } else {
        setError(result.error ?? "Analysis failed");
        setStatus("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStatus("error");
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getRaceColor = (race: string): string => {
    switch (race) {
      case "Terran":
        return "bg-blue-100 text-blue-800";
      case "Protoss":
        return "bg-yellow-100 text-yellow-800";
      case "Zerg":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getResultColor = (result: string): string => {
    return result === "Win" || result === "Victory"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      {/* Replay Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Replay</CardTitle>
          <CardDescription>
            Choose a StarCraft II replay file to analyze
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Select value={selectedReplay} onValueChange={setSelectedReplay}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a replay file..." />
                </SelectTrigger>
                <SelectContent>
                  {replayFiles.map((file) => (
                    <SelectItem key={file.name} value={file.name}>
                      {file.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={!selectedReplay || status === "processing"}
            >
              {status === "processing" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Analyze Replay
                </>
              )}
            </Button>
          </div>

          {fromCache && status === "complete" && (
            <Alert>
              <AlertDescription>
                Results loaded from cache. This replay was previously analyzed.
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {analysisResult && status === "complete" && (
        <div className="space-y-6">
          {/* Game Info */}
          <Card>
            <CardHeader>
              <CardTitle>Game Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Map className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Map:</span>
                  <span className="font-medium">{analysisResult.game_info.map_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {formatDuration(analysisResult.game_info.duration)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Players:</span>
                  <span className="font-medium">{analysisResult.players.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Version:</span>
                  <span className="font-medium">{analysisResult.game_info.game_version}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysisResult.players.map((playerData, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {playerData.player.name}
                      <Badge className={getRaceColor(playerData.player.race)}>
                        {playerData.player.race}
                      </Badge>
                    </CardTitle>
                    <Badge className={getResultColor(playerData.player.result)}>
                      {playerData.player.result}
                    </Badge>
                  </div>
                  <CardDescription>Team {playerData.player.team}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Player Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">APM:</span>
                      <span className="ml-2 font-medium">{playerData.player.apm}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Resources:</span>
                      <span className="ml-2 font-medium">
                        {playerData.player.resources_collected.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Units Killed:</span>
                      <span className="ml-2 font-medium">{playerData.player.units_killed}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Army Value:</span>
                      <span className="ml-2 font-medium">
                        {playerData.player.army_value_max.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Build Order */}
                  {playerData.build_order && playerData.build_order.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Build Order (First 15 actions)</h4>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {playerData.build_order.map((action, actionIndex) => (
                          <div
                            key={actionIndex}
                            className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded text-sm"
                          >
                            <span>{action.action_name}</span>
                            <Badge variant="outline">{action.formatted_time}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}