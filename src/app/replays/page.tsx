import { getReplayFiles } from "./actions";
import ReplayAnalyzer from "./components/ReplayAnalyzer";

export default async function ReplaysPage() {
  const replayFiles = await getReplayFiles();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SC2 Replay Analyzer</h1>
        <p className="text-gray-600">
          Analyze StarCraft II replay files to extract player statistics, build orders, and game insights.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Found {replayFiles.length} replay files
        </p>
      </div>

      <ReplayAnalyzer replayFiles={replayFiles} />
    </div>
  );
}