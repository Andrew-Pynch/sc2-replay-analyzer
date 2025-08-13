import { notFound } from "next/navigation";
import { getReplayBySlug } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Clock, Map, Users, Award, Zap, DollarSign, Target, Shield } from "lucide-react";
import AnalyzeButton from "./components/AnalyzeButton";

interface ReplayPageProps {
  params: Promise<{ replaySlug: string }>;
  searchParams: Promise<{ filename?: string; new?: string }>;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getRaceColor(race: string): string {
  switch (race) {
    case "Terran":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "Protoss":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "Zerg":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
}

export default async function ReplayPage({ params, searchParams }: ReplayPageProps) {
  const { replaySlug } = await params;
  const { filename, new: isNew } = await searchParams;
  
  // If this is a new replay, show the analyze interface
  if (isNew === "true" && filename) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analyze Replay</h1>
          <p className="text-gray-600">
            Ready to analyze the selected replay file
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ready to Analyze</CardTitle>
            <CardDescription>
              File: {decodeURIComponent(filename)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyzeButton filename={decodeURIComponent(filename)} slug={replaySlug} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Try to load existing replay data
  const replayData = await getReplayBySlug(replaySlug);
  
  if (!replayData) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Replay Analysis</h1>
        <p className="text-gray-600">{replayData.game_info.filename}</p>
      </div>

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
                <span className="font-medium">{replayData.game_info.map_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Duration:</span>
                <span className="font-medium">
                  {formatDuration(replayData.game_info.duration)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Players:</span>
                <span className="font-medium">{replayData.players.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Version:</span>
                <span className="font-medium">{replayData.game_info.game_version}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Player Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {replayData.players.map((playerData, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span>{playerData.player.name}</span>
                    <Badge className={getRaceColor(playerData.player.race)}>
                      {playerData.player.race}
                    </Badge>
                    <Badge variant={playerData.player.result === "Win" ? "default" : "secondary"}>
                      {playerData.player.result === "Win" ? (
                        <>
                          <Award className="w-3 h-3 mr-1" />
                          Winner
                        </>
                      ) : (
                        playerData.player.result
                      )}
                    </Badge>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Player Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-600">APM</p>
                      <p className="font-semibold">{playerData.player.apm}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Resources</p>
                      <p className="font-semibold">{playerData.player.resources_collected.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm text-gray-600">Units Killed</p>
                      <p className="font-semibold">{playerData.player.units_killed.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Max Army</p>
                      <p className="font-semibold">{playerData.player.army_value_max.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Build Order */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Build Order</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {playerData.build_order.map((action, actionIndex) => (
                      <div key={actionIndex} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 w-12">{action.formatted_time}</span>
                        <span className="text-gray-700 dark:text-gray-300">{action.action_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}