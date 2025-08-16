"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getReplayFiles, getAnalyzedReplays } from "./actions";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Loader2, Play, FileText, Eye, Clock, Map } from "lucide-react";
import Link from "next/link";

function generateReplaySlug(filename: string): string {
  // Extract player names and create a readable slug
  const baseName = filename.replace(".SC2Replay", "");
  const cleanName = baseName
    .replace(/^\d+\s*-\s*/, "") // Remove date prefix
    .replace(/Game\d+\s*-\s*/, "") // Remove game number
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();

  // Add random suffix for uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${cleanName}-${randomSuffix}`;
}

export default function ReplaysPage() {
  const [selectedReplay, setSelectedReplay] = useState<string>("");
  const router = useRouter();

  const replayFilesQuery = useQuery({
    queryKey: ["replayFiles"],
    queryFn: getReplayFiles,
  });

  const analyzedReplaysQuery = useQuery({
    queryKey: ["analyzedReplays"],
    queryFn: getAnalyzedReplays,
  });

  const handleAnalyze = () => {
    if (!selectedReplay) return;

    const slug = generateReplaySlug(selectedReplay);
    router.push(
      `/replays/${slug}?filename=${encodeURIComponent(selectedReplay)}&new=true`,
    );
  };

  if (replayFilesQuery.isLoading || analyzedReplaysQuery.isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  if (replayFilesQuery.isError || analyzedReplaysQuery.isError) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          Failed to load data:{" "}
          {replayFilesQuery.error?.message ||
            analyzedReplaysQuery.error?.message}
        </div>
      </div>
    );
  }

  const replayFiles = replayFilesQuery.data ?? [];
  const analyzedReplays = analyzedReplaysQuery.data ?? [];

  function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">SC2 Replay Analyzer</h1>
        <p className="text-gray-600">
          Analyze StarCraft II replay files to extract player statistics, build
          orders, and game insights.
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <FileText className="h-4 w-4" />
          Found {replayFiles.length} replay files • {analyzedReplays.length}{" "}
          analyzed
        </p>
      </div>

      {/* Upload/Analyze Section */}
      <Card>
        <CardHeader>
          <CardTitle>Analyze New Replay</CardTitle>
          <CardDescription>
            Choose a StarCraft II replay file to analyze
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
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
              disabled={!selectedReplay}
              size="lg"
            >
              <Play className="mr-2 h-4 w-4" />
              Analyze Replay
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analyzed Replays Section */}
      {analyzedReplays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previously Analyzed Replays</CardTitle>
            <CardDescription>
              View and re-analyze your previously processed replays
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyzedReplays.map((replay) => (
                <div
                  key={replay.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{replay.filename}</h4>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                      {replay.mapName && (
                        <div className="flex items-center gap-1">
                          <Map className="h-4 w-4" />
                          <span>{replay.mapName}</span>
                        </div>
                      )}
                      {replay.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(replay.duration)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href={`/replays/${replay.slug}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View Results
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
