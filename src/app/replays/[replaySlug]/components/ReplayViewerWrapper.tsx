"use client";

import dynamic from "next/dynamic";
import { type TimeSeriesSnapshot } from "../actions";

// Dynamic import to prevent SSR issues with Pixi.js
const PixiReplayViewer = dynamic(() => import("./PixiReplayViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 border rounded-lg bg-gray-900 flex items-center justify-center">
      <div className="text-white">Loading WebGL Replay Viewer...</div>
    </div>
  )
});

interface ReplayViewerWrapperProps {
  timeSeriesData: TimeSeriesSnapshot[];
  gameDuration: number;
}

export default function ReplayViewerWrapper({ timeSeriesData, gameDuration }: ReplayViewerWrapperProps) {
  return (
    <PixiReplayViewer 
      timeSeriesData={timeSeriesData} 
      gameDuration={gameDuration}
    />
  );
}