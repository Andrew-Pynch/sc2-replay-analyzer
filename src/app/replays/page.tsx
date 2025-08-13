"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getReplayFiles } from "./actions";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Loader2, Play, FileText } from "lucide-react";

function generateReplaySlug(filename: string): string {
  // Extract player names and create a readable slug
  const baseName = filename.replace('.SC2Replay', '');
  const cleanName = baseName
    .replace(/^\d+\s*-\s*/, '') // Remove date prefix
    .replace(/Game\d+\s*-\s*/, '') // Remove game number
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
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

  const handleAnalyze = () => {
    if (!selectedReplay) return;
    
    const slug = generateReplaySlug(selectedReplay);
    router.push(`/replays/${slug}?filename=${encodeURIComponent(selectedReplay)}&new=true`);
  };

  if (replayFilesQuery.isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading replay files...</span>
        </div>
      </div>
    );
  }

  if (replayFilesQuery.isError) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          Failed to load replay files: {replayFilesQuery.error?.message}
        </div>
      </div>
    );
  }

  const replayFiles = replayFilesQuery.data ?? [];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SC2 Replay Analyzer</h1>
        <p className="text-gray-600">
          Analyze StarCraft II replay files to extract player statistics, build orders, and game insights.
        </p>
        <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Found {replayFiles.length} replay files
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Replay File</CardTitle>
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
              disabled={!selectedReplay}
              size="lg"
            >
              <Play className="mr-2 h-4 w-4" />
              Analyze Replay
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}