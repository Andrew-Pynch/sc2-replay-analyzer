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
import { getRaceFromUnit } from "~/lib/unit-icons";
import { type TimeSeriesSnapshot } from "../../actions";

interface ReplayViewerProps {
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
}

interface HoveredUnit {
  unit: UnitVisual;
  group: { units: UnitVisual[]; count: number; mainType: string };
  x: number;
  y: number;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getTeamBorderColor(team: number): string {
  return team === 0 ? "border-blue-500" : "border-red-500";
}

function getTeamFillColor(team: number): string {
  return team === 0 ? "#3b82f6" : "#ef4444";
}

function getTeamLightFillColor(team: number): string {
  return team === 0 ? "#93c5fd" : "#fca5a5";
}

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

  // Create lookup maps by unit_id for efficient matching
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
      // Unit disappeared, keep the before position
      interpolatedUnits.push(beforeUnit);
      return;
    }

    // Linear interpolation of position
    const interpolatedX = beforeUnit.x + (afterUnit.x - beforeUnit.x) * factor;
    const interpolatedY = beforeUnit.y + (afterUnit.y - beforeUnit.y) * factor;

    // Use velocity from the before unit for prediction if available
    const vx = beforeUnit.vx || 0;
    const vy = beforeUnit.vy || 0;

    interpolatedUnits.push({
      type: beforeUnit.type,
      x: interpolatedX,
      y: interpolatedY,
      unit_id: beforeUnit.unit_id,
      vx: vx,
      vy: vy,
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

const ReplayViewer: React.FC<ReplayViewerProps> = ({
  timeSeriesData,
  gameDuration,
}) => {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2); // 2x speed by default

  // Zoom and pan state
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);

  // Drag state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);

  // Hover state
  const [hoveredUnit, setHoveredUnit] = useState<HoveredUnit | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Focus management
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Keyboard controls
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

  // Auto-play logic with requestAnimationFrame for smooth playback
  useEffect(() => {
    if (!isPlaying) return;

    let lastFrameTime = performance.now();
    let animationFrameId: number;

    const updateTime = (currentFrameTime: number) => {
      const deltaTime = (currentFrameTime - lastFrameTime) / 1000; // Convert to seconds
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

  // Handle drag outside container
  useEffect(() => {
    const handleDocumentMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStart(null);
      }
    };

    if (isDragging) {
      document.addEventListener("mouseup", handleDocumentMouseUp);
      return () =>
        document.removeEventListener("mouseup", handleDocumentMouseUp);
    }
  }, [isDragging]);

  // Get current snapshot data with interpolation
  const currentSnapshot = useMemo(() => {
    if (!timeSeriesData || timeSeriesData.length === 0) return null;

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

    // If no before snapshot, use the first one
    if (!beforeSnapshot) {
      return timeSeriesData[0] || null;
    }

    // If no after snapshot or exact match, use the before snapshot
    if (!afterSnapshot || beforeSnapshot.timestamp === currentTime) {
      return beforeSnapshot;
    }

    // Calculate interpolation factor
    const timeDelta = afterSnapshot.timestamp - beforeSnapshot.timestamp;
    const interpolationFactor =
      (currentTime - beforeSnapshot.timestamp) / timeDelta;

    // Create interpolated snapshot
    const interpolatedSnapshot: TimeSeriesSnapshot = {
      timestamp: currentTime,
      players: {},
    };

    // Interpolate each player's units and buildings
    Object.entries(beforeSnapshot.players).forEach(
      ([playerId, beforePlayerData]) => {
        const afterPlayerData = afterSnapshot!.players[playerId];
        if (!afterPlayerData) {
          interpolatedSnapshot.players[playerId] = beforePlayerData;
          return;
        }

        interpolatedSnapshot.players[playerId] = {
          name: beforePlayerData.name,
          race: beforePlayerData.race,
          team: beforePlayerData.team,
          units: interpolateUnitPositions(
            beforePlayerData.units,
            afterPlayerData.units,
            interpolationFactor,
          ),
          buildings: interpolateUnitPositions(
            beforePlayerData.buildings,
            afterPlayerData.buildings,
            interpolationFactor,
          ),
        };
      },
    );

    return interpolatedSnapshot;
  }, [timeSeriesData, currentTime]);

  // Process current snapshot into visual units
  const visualUnits = useMemo((): UnitVisual[] => {
    if (!currentSnapshot) return [];

    const units: UnitVisual[] = [];

    Object.entries(currentSnapshot.players).forEach(([, playerData]) => {
      const race =
        getRaceFromUnit(playerData.race) ?? playerData.race.toLowerCase();

      // Add buildings
      playerData.buildings.forEach((building) => {
        units.push({
          type: building.type,
          x: building.x,
          y: building.y,
          team: playerData.team,
          race: race,
          isBuilding: true,
          unit_id: building.unit_id,
        });
      });

      // Add units
      playerData.units.forEach((unit) => {
        units.push({
          type: unit.type,
          x: unit.x,
          y: unit.y,
          team: playerData.team,
          race: race,
          isBuilding: false,
          unit_id: unit.unit_id,
        });
      });
    });

    return units;
  }, [currentSnapshot]);

  // Group units by proximity (less aggressive grouping)
  const groupedUnits = useMemo(() => {
    const groups: Array<{
      units: UnitVisual[];
      x: number;
      y: number;
      team: number;
      mainType: string;
      count: number;
    }> = [];
    const processedUnits = new Set<number>();

    visualUnits.forEach((unit, index) => {
      if (processedUnits.has(index)) return;

      const group = {
        units: [unit],
        x: unit.x,
        y: unit.y,
        team: unit.team,
        mainType: unit.type,
        count: 1,
      };

      // Only group if zoom is low (less than 2x) and units are very close
      if (zoom < 2) {
        visualUnits.forEach((otherUnit, otherIndex) => {
          if (index === otherIndex || processedUnits.has(otherIndex)) return;

          const distance = Math.sqrt(
            Math.pow(unit.x - otherUnit.x, 2) +
              Math.pow(unit.y - otherUnit.y, 2),
          );

          // Reduced distance threshold and only group same unit type
          if (
            distance < 15 &&
            unit.type === otherUnit.type &&
            unit.team === otherUnit.team
          ) {
            group.units.push(otherUnit);
            group.count++;
            processedUnits.add(otherIndex);
          }
        });
      }

      groups.push(group);
      processedUnits.add(index);
    });

    return groups;
  }, [visualUnits, zoom]);

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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const zoomFactor = e.deltaY > 0 ? 0.8 : 1.25;
    setZoom((prev) => Math.max(0.5, Math.min(10, prev * zoomFactor)));
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const currentMousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setMousePos(currentMousePos);

      // Handle dragging
      if (isDragging && dragStart) {
        const deltaX = currentMousePos.x - dragStart.x;
        const deltaY = currentMousePos.y - dragStart.y;

        // Scale delta by zoom level (inverse - more zoomed = less pan per pixel)
        const scaleFactor = 1000 / zoom / rect.width; // Adjust based on viewBox size

        setPanX(dragStart.panX - deltaX * scaleFactor);
        setPanY(dragStart.panY - deltaY * scaleFactor);
      }
    },
    [isDragging, dragStart, zoom],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        // Left mouse button
        const rect = e.currentTarget.getBoundingClientRect();
        setIsDragging(true);
        setDragStart({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          panX: panX,
          panY: panY,
        });
      }
    },
    [panX, panY],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  const handleUnitHover = useCallback(
    (
      group: (typeof groupedUnits)[0],
      unit: UnitVisual,
      x: number,
      y: number,
    ) => {
      setHoveredUnit({ unit, group, x, y });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredUnit(null);
  }, []);

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
        <CardTitle>Live Replay Viewer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Game Visualization */}
        <div
          ref={containerRef}
          className={`relative h-96 w-full overflow-hidden rounded-lg border bg-gray-900 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          tabIndex={0}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onWheel={handleWheel}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Mini-map visualization */}
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`${panX} ${panY} ${1000 / zoom} ${1000 / zoom}`}
          >
            {groupedUnits.map((group, index) => {
              // Better coordinate scaling - SC2 maps are typically around 200x200
              const scaledX = (group.x / 200) * 1000;
              const scaledY = (group.y / 200) * 1000;

              const radius = group.units[0]?.isBuilding ? 8 : 6;
              const adjustedRadius = Math.max(3, radius / Math.sqrt(zoom));

              return (
                <g key={`${index}-${group.mainType}`}>
                  {/* Unit/building representation */}
                  <circle
                    cx={scaledX}
                    cy={scaledY}
                    r={adjustedRadius}
                    stroke={getTeamFillColor(group.team)}
                    strokeWidth={Math.max(1, 2 / Math.sqrt(zoom))}
                    fill={
                      hoveredUnit?.group === group
                        ? getTeamFillColor(group.team)
                        : getTeamLightFillColor(group.team)
                    }
                    opacity={0.8}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() =>
                      handleUnitHover(group, group.units[0]!, scaledX, scaledY)
                    }
                  />

                  {/* Count indicator for grouped units */}
                  {group.count > 1 && zoom < 3 && (
                    <text
                      x={scaledX}
                      y={scaledY + 1}
                      textAnchor="middle"
                      fontSize={Math.max(8, 10 / Math.sqrt(zoom))}
                      fill="white"
                      stroke="black"
                      strokeWidth={0.5 / Math.sqrt(zoom)}
                      pointerEvents="none"
                    >
                      {group.count}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

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
              {hoveredUnit.group.count > 1 && (
                <div>Count: {hoveredUnit.group.count}</div>
              )}
              {hoveredUnit.unit.isBuilding && (
                <div className="text-blue-300">Building</div>
              )}
            </div>
          )}

          {/* Time overlay */}
          <div className="bg-opacity-70 absolute top-4 left-4 rounded bg-black px-3 py-1 text-white">
            {formatTime(currentTime)} / {formatTime(gameDuration)}
          </div>

          {/* Zoom indicator */}
          <div className="bg-opacity-70 absolute top-4 right-4 rounded bg-black px-2 py-1 text-xs text-white">
            {zoom.toFixed(1)}x
          </div>

          {/* Controls hint */}
          {isFocused && (
            <div className="bg-opacity-70 absolute bottom-4 left-4 rounded bg-black px-2 py-1 text-xs text-white">
              Space: Play/Pause | ←→: Skip ±5s | ↑↓: Speed | Scroll: Zoom |
              Drag: Pan
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
            step={1}
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

        {/* Current Units Summary */}
        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          {currentSnapshot &&
            Object.entries(currentSnapshot.players).map(
              ([playerId, playerData]) => (
                <div
                  key={playerId}
                  className={`rounded-lg border p-3 ${getTeamBorderColor(playerData.team)} bg-gray-800 text-white`}
                >
                  <h4
                    className="mb-2 text-sm font-semibold"
                    style={{ color: getTeamFillColor(playerData.team) }}
                  >
                    {playerData.name} ({playerData.race})
                  </h4>
                  <div className="text-xs text-gray-300">
                    Units: {playerData.units.length} | Buildings:{" "}
                    {playerData.buildings.length}
                  </div>
                </div>
              ),
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReplayViewer;
