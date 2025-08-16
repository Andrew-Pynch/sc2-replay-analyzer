"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Application, extend } from "@pixi/react";
import {
  Container,
  Graphics as PIXIGraphics,
  FederatedPointerEvent,
} from "pixi.js";
import { getRaceFromUnit } from "~/lib/unit-icons";
import { type TimeSeriesSnapshot } from "../../actions";

// Extend Pixi components to be available as JSX elements
extend({ Container, Graphics: PIXIGraphics });

interface PixiReplayViewerProps {
  timeSeriesData: TimeSeriesSnapshot[];
  gameDuration: number;
}

interface UnitVisual {
  type: string;
  x: number;
  y: number;
  team: number;
  race: string;
  isBuilding: boolean;
  unit_id?: number;
  vx?: number;
  vy?: number;
}

interface HoveredUnit {
  unit: UnitVisual;
  x: number;
  y: number;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getTeamColor(team: number): number {
  return team === 0 ? 0x3b82f6 : 0xef4444; // Blue for team 0, red for team 1
}

function getTeamLightColor(team: number): number {
  return team === 0 ? 0x93c5fd : 0xfca5a5; // Light blue/red
}

// Interpolation function (same as before but optimized for Pixi)
function interpolateUnitPositions(
  beforeUnits: Array<{
    type: string;
    x: number;
    y: number;
    unit_id?: number;
    vx?: number;
    vy?: number;
  }>,
  afterUnits: Array<{
    type: string;
    x: number;
    y: number;
    unit_id?: number;
    vx?: number;
    vy?: number;
  }>,
  factor: number,
): Array<{
  type: string;
  x: number;
  y: number;
  unit_id?: number;
  vx?: number;
  vy?: number;
}> {
  const interpolatedUnits: Array<{
    type: string;
    x: number;
    y: number;
    unit_id?: number;
    vx?: number;
    vy?: number;
  }> = [];

  const beforeUnitsMap = new Map(
    beforeUnits.map((unit) => [unit.unit_id, unit]),
  );
  const afterUnitsMap = new Map(afterUnits.map((unit) => [unit.unit_id, unit]));

  // Interpolate units that exist in both snapshots
  beforeUnits.forEach((beforeUnit) => {
    if (!beforeUnit.unit_id) {
      interpolatedUnits.push(beforeUnit);
      return;
    }

    const afterUnit = afterUnitsMap.get(beforeUnit.unit_id);
    if (!afterUnit) {
      interpolatedUnits.push(beforeUnit);
      return;
    }

    const interpolatedX = beforeUnit.x + (afterUnit.x - beforeUnit.x) * factor;
    const interpolatedY = beforeUnit.y + (afterUnit.y - beforeUnit.y) * factor;

    interpolatedUnits.push({
      type: beforeUnit.type,
      x: interpolatedX,
      y: interpolatedY,
      unit_id: beforeUnit.unit_id,
      vx: beforeUnit.vx || 0,
      vy: beforeUnit.vy || 0,
    });
  });

  // Add new units that only exist in the after snapshot
  afterUnits.forEach((afterUnit) => {
    if (afterUnit.unit_id && !beforeUnitsMap.has(afterUnit.unit_id)) {
      interpolatedUnits.push(afterUnit);
    }
  });

  return interpolatedUnits;
}

// No viewport for now - let's get basic rendering working first

// Enhanced units display component with shapes and hover
const UnitsRenderer: React.FC<{
  units: UnitVisual[];
  onUnitHover?: (unit: UnitVisual | null, x: number, y: number) => void;
}> = ({ units, onUnitHover }) => {
  const draw = useCallback(
    (graphics: PIXIGraphics) => {
      graphics.clear();

      units.forEach((unit) => {
        // Scale coordinates - SC2 maps are typically around 200x200
        const scaledX = (unit.x / 200) * 800; // Scale to canvas width
        const scaledY = (unit.y / 200) * 384; // Scale to canvas height

        const color = getTeamColor(unit.team);
        const lightColor = getTeamLightColor(unit.team);

        // Determine unit category and draw appropriate shape
        const unitType = unit.type.toLowerCase();
        const isWorker =
          unitType.includes("scv") ||
          unitType.includes("drone") ||
          unitType.includes("probe");

        if (unit.isBuilding) {
          // Buildings: Squares
          const size = 12;
          graphics
            .rect(scaledX - size / 2, scaledY - size / 2, size, size)
            .fill(lightColor)
            .stroke({ color: color, width: 2 });
        } else if (isWorker) {
          // Workers: Circles
          const radius = 5;
          graphics
            .circle(scaledX, scaledY, radius)
            .fill(lightColor)
            .stroke({ color: color, width: 2 });
        } else {
          // Military units: Triangles
          const size = 8;
          graphics
            .moveTo(scaledX, scaledY - size)
            .lineTo(scaledX - size, scaledY + size)
            .lineTo(scaledX + size, scaledY + size)
            .lineTo(scaledX, scaledY - size)
            .fill(lightColor)
            .stroke({ color: color, width: 2 });
        }
      });
    },
    [units],
  );

  const handlePointerMove = useCallback(
    (event: FederatedPointerEvent) => {
      if (!onUnitHover) return;

      const { x, y } = event.global;

      // Find unit under cursor
      const hoveredUnit = units.find((unit) => {
        const scaledX = (unit.x / 200) * 800;
        const scaledY = (unit.y / 200) * 384;

        // Different hit detection based on shape
        const unitType = unit.type.toLowerCase();
        const isWorker =
          unitType.includes("scv") ||
          unitType.includes("drone") ||
          unitType.includes("probe");

        if (unit.isBuilding) {
          // Square hit detection
          const size = 12;
          return (
            x >= scaledX - size / 2 &&
            x <= scaledX + size / 2 &&
            y >= scaledY - size / 2 &&
            y <= scaledY + size / 2
          );
        } else if (isWorker) {
          // Circle hit detection
          const radius = 5;
          const distance = Math.sqrt(
            Math.pow(x - scaledX, 2) + Math.pow(y - scaledY, 2),
          );
          return distance <= radius;
        } else {
          // Triangle hit detection (approximate as circle)
          const radius = 8;
          const distance = Math.sqrt(
            Math.pow(x - scaledX, 2) + Math.pow(y - scaledY, 2),
          );
          return distance <= radius;
        }
      });

      onUnitHover(hoveredUnit || null, x, y);
    },
    [units, onUnitHover],
  );

  return (
    <pixiGraphics
      draw={draw}
      eventMode="static"
      onpointermove={handlePointerMove}
      onpointerleave={() => onUnitHover?.(null, 0, 0)}
    />
  );
};

const PixiReplayViewer: React.FC<PixiReplayViewerProps> = ({
  timeSeriesData,
  gameDuration,
}) => {
  // Don't render on server-side
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2);

  // Hover state
  const [hoveredUnit, setHoveredUnit] = useState<HoveredUnit | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Focus management
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Keyboard controls (same as before)
  useEffect(() => {
    if (!isFocused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "Space":
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case "ArrowLeft":
          e.preventDefault();
          setCurrentTime((prev) => Math.max(0, prev - 5));
          setIsPlaying(false);
          break;
        case "ArrowRight":
          e.preventDefault();
          setCurrentTime((prev) => Math.min(gameDuration, prev + 5));
          setIsPlaying(false);
          break;
        case "ArrowUp":
          e.preventDefault();
          setPlaybackSpeed((prev) => Math.min(8, prev * 2));
          break;
        case "ArrowDown":
          e.preventDefault();
          setPlaybackSpeed((prev) => Math.max(0.5, prev / 2));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused, gameDuration]);

  // Auto-play logic with requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) return;

    let lastFrameTime = performance.now();
    let animationFrameId: number;

    const updateTime = (currentFrameTime: number) => {
      const deltaTime = (currentFrameTime - lastFrameTime) / 1000;
      lastFrameTime = currentFrameTime;

      setCurrentTime((prev) => {
        const increment = playbackSpeed * deltaTime;
        const next = prev + increment;

        if (next >= gameDuration) {
          setIsPlaying(false);
          return gameDuration;
        }
        return next;
      });

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(updateTime);
      }
    };

    animationFrameId = requestAnimationFrame(updateTime);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, playbackSpeed, gameDuration]);

  // Get current snapshot data with interpolation (optimized for Pixi)
  const currentUnits = useMemo(() => {
    if (!timeSeriesData || timeSeriesData.length === 0) return [];

    // Find surrounding snapshots for interpolation
    let beforeSnapshot: TimeSeriesSnapshot | null = null;
    let afterSnapshot: TimeSeriesSnapshot | null = null;

    for (let i = 0; i < timeSeriesData.length; i++) {
      const snapshot = timeSeriesData[i]!;
      if (snapshot.timestamp <= currentTime) {
        beforeSnapshot = snapshot;
      } else {
        afterSnapshot = snapshot;
        break;
      }
    }

    if (!beforeSnapshot) {
      return [];
    }

    const units: UnitVisual[] = [];

    // Process each player's units
    Object.entries(beforeSnapshot.players).forEach(
      ([playerId, beforePlayerData]) => {
        const race =
          getRaceFromUnit(beforePlayerData.race) ??
          beforePlayerData.race.toLowerCase();

        let currentUnits = beforePlayerData.units;
        let currentBuildings = beforePlayerData.buildings;

        // Apply interpolation if we have an after snapshot
        if (afterSnapshot && beforeSnapshot.timestamp !== currentTime) {
          const afterPlayerData = afterSnapshot.players[playerId];
          if (afterPlayerData) {
            const timeDelta =
              afterSnapshot.timestamp - beforeSnapshot.timestamp;
            const interpolationFactor =
              (currentTime - beforeSnapshot.timestamp) / timeDelta;

            currentUnits = interpolateUnitPositions(
              beforePlayerData.units,
              afterPlayerData.units,
              interpolationFactor,
            );
            currentBuildings = interpolateUnitPositions(
              beforePlayerData.buildings,
              afterPlayerData.buildings,
              interpolationFactor,
            );
          }
        }

        // Add buildings
        currentBuildings.forEach((building) => {
          units.push({
            type: building.type,
            x: building.x,
            y: building.y,
            team: beforePlayerData.team,
            race: race,
            isBuilding: true,
            unit_id: building.unit_id,
            vx: building.vx,
            vy: building.vy,
          });
        });

        // Add units
        currentUnits.forEach((unit) => {
          units.push({
            type: unit.type,
            x: unit.x,
            y: unit.y,
            team: beforePlayerData.team,
            race: race,
            isBuilding: false,
            unit_id: unit.unit_id,
            vx: unit.vx,
            vy: unit.vy,
          });
        });
      },
    );

    return units;
  }, [timeSeriesData, currentTime]);

  // Event handlers
  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleTimeChange = useCallback((value: number[]) => {
    setCurrentTime(value[0] || 0);
    setIsPlaying(false);
  }, []);

  const handleSkipBackward = useCallback(() => {
    setCurrentTime((prev) => Math.max(0, prev - 10));
    setIsPlaying(false);
  }, []);

  const handleSkipForward = useCallback(() => {
    setCurrentTime((prev) => Math.min(gameDuration, prev + 10));
    setIsPlaying(false);
  }, [gameDuration]);

  const handleUnitHover = useCallback(
    (unit: UnitVisual | null, x: number, y: number) => {
      if (unit) {
        setHoveredUnit({ unit, x, y });
        setMousePos({ x, y });
      } else {
        setHoveredUnit(null);
      }
    },
    [],
  );

  // Don't render Pixi.js on server-side
  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>High-Performance Replay Viewer (Loading...)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-96 w-full items-center justify-center rounded-lg border bg-gray-900">
            <div className="text-white">Loading Pixi.js...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timeSeriesData || timeSeriesData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Replay Viewer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-gray-500">
            No timeline data available for this replay.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>High-Performance Replay Viewer (Pixi.js)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Game Visualization */}
        <div
          className="relative h-96 w-full overflow-hidden rounded-lg border bg-gray-900"
          tabIndex={0}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          <Application
            width={800}
            height={384}
            backgroundColor={0x111827} // gray-900
            antialias={true}
            resolution={
              typeof window !== "undefined" ? window.devicePixelRatio : 1
            }
            autoDensity={true}
          >
            <pixiContainer>
              <UnitsRenderer
                units={currentUnits}
                onUnitHover={handleUnitHover}
              />
            </pixiContainer>
          </Application>

          {/* Hover tooltip */}
          {hoveredUnit && (
            <div
              className="bg-opacity-90 pointer-events-none absolute z-10 rounded bg-black p-2 text-xs text-white"
              style={{
                left: mousePos.x + 10,
                top: mousePos.y - 10,
                transform: mousePos.x > 300 ? "translateX(-100%)" : "none",
              }}
            >
              <div className="font-semibold">{hoveredUnit.unit.type}</div>
              <div>
                Team {hoveredUnit.unit.team + 1} ({hoveredUnit.unit.race})
              </div>
              <div>
                Position: ({Math.round(hoveredUnit.unit.x)},{" "}
                {Math.round(hoveredUnit.unit.y)})
              </div>
              {hoveredUnit.unit.isBuilding && (
                <div className="text-blue-300">Building</div>
              )}
              {!hoveredUnit.unit.isBuilding &&
                !hoveredUnit.unit.type.toLowerCase().includes("scv") &&
                !hoveredUnit.unit.type.toLowerCase().includes("drone") &&
                !hoveredUnit.unit.type.toLowerCase().includes("probe") && (
                  <div className="text-red-300">Military Unit</div>
                )}
              {(hoveredUnit.unit.type.toLowerCase().includes("scv") ||
                hoveredUnit.unit.type.toLowerCase().includes("drone") ||
                hoveredUnit.unit.type.toLowerCase().includes("probe")) && (
                <div className="text-green-300">Worker</div>
              )}
              {(hoveredUnit.unit.vx !== 0 || hoveredUnit.unit.vy !== 0) && (
                <div>
                  Velocity: ({hoveredUnit.unit.vx?.toFixed(1)},{" "}
                  {hoveredUnit.unit.vy?.toFixed(1)})
                </div>
              )}
            </div>
          )}

          {/* Time overlay */}
          <div className="bg-opacity-70 absolute top-4 left-4 rounded bg-black px-3 py-1 text-white">
            {formatTime(currentTime)} / {formatTime(gameDuration)}
          </div>

          {/* Units count */}
          <div className="bg-opacity-70 absolute top-4 right-4 rounded bg-black px-2 py-1 text-xs text-white">
            {currentUnits.length} units
          </div>

          {/* Controls hint */}
          {isFocused && (
            <div className="bg-opacity-70 absolute bottom-4 left-4 rounded bg-black px-2 py-1 text-xs text-white">
              Space: Play/Pause | ←→: Skip ±5s | ↑↓: Speed
            </div>
          )}
        </div>

        {/* Timeline Controls */}
        <div className="space-y-4">
          {/* Timeline Slider */}
          <Slider
            value={[currentTime]}
            onValueChange={handleTimeChange}
            max={gameDuration}
            step={0.1} // Support decimal precision
            className="w-full"
          />

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="sm" onClick={handleSkipBackward}>
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button onClick={handlePlayPause} size="sm">
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button variant="outline" size="sm" onClick={handleSkipForward}>
              <SkipForward className="h-4 w-4" />
            </Button>

            {/* Speed Control */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Speed:</span>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="rounded border px-2 py-1 text-sm"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
                <option value={8}>8x</option>
              </select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PixiReplayViewer;
