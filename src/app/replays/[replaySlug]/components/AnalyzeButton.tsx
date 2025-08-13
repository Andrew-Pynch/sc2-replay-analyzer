"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { analyzeReplay } from "../../actions";
import { Button } from "~/components/ui/button";
import { Loader2, Play, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "~/components/ui/alert";

interface AnalyzeButtonProps {
  filename: string;
  slug: string;
}

export default function AnalyzeButton({ filename, slug }: AnalyzeButtonProps) {
  const router = useRouter();
  
  const analyzeReplayMutation = useMutation({
    mutationFn: () => analyzeReplay(filename, slug),
    onSuccess: () => {
      // Remove the query params and refresh the page to show results
      router.replace(`/replays/${slug}`);
      router.refresh();
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Ready to analyze replay</h3>
          <p className="text-sm text-gray-600">
            This will extract player statistics, build orders, and game insights
          </p>
        </div>
        <Button
          onClick={() => analyzeReplayMutation.mutate()}
          disabled={analyzeReplayMutation.isPending}
          size="lg"
        >
          {analyzeReplayMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : analyzeReplayMutation.isSuccess ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Analysis
            </>
          )}
        </Button>
      </div>

      {analyzeReplayMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {analyzeReplayMutation.error?.message || "Analysis failed"}
          </AlertDescription>
        </Alert>
      )}
      
      {analyzeReplayMutation.isPending && (
        <Alert>
          <AlertDescription>
            Analyzing replay file... This may take a few moments.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}