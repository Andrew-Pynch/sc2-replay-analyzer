# Raw Data Explorer Component Implementation Plan

## Overview

This plan implements a comprehensive raw data explorer component for the SC2 replay viewer that provides real-time control over visualization settings and deep exploration of replay analysis data.

## Architecture Overview

- **State Management**: New Zustand store for simulation/visualization controls
- **Component Structure**: Collapsible side panel with tabbed interface
- **Data Integration**: Direct access to replay analysis data with search/filter capabilities
- **Performance**: Virtualized rendering for large datasets

## Features to Implement

### 1. Visualization Controls

- Checkboxes for toggling unit visibility (workers, military, buildings)
- Team-based visibility controls
- Path/movement visualization toggles
- Timeline scrubbing enhancements

### 2. Raw Data Explorer

- Syntax-highlighted JSON viewer with search
- Expandable/collapsible tree view
- Real-time data filtering
- Copy/export functionality

### 3. State Management

- Zustand store for simulation settings
- Reactive updates to Pixi visualization
- Persistence of user preferences

## Implementation Steps

### 1. Install Required Dependencies

- **Index**: 1
- **Name**: Add dependencies for JSON viewer and state management
- **Description**: Install react-json-view, zustand, and fuse.js for search
- **Justification**: Need JSON viewer component and fuzzy search capabilities
- **Snippet**:

```bash
bun add zustand react-json-view fuse.js @types/react-json-view
```

### 2. Create Simulation Settings Store

- **Index**: 2
- **Name**: Create Zustand store for simulation state
- **Description**: New store to manage visibility toggles and simulation settings
- **Justification**: Centralized state management for visualization controls
- **Snippet**:

```typescript
// src/stores/simulationStore.ts
import { create } from "zustand";

interface SimulationState {
  showWorkers: boolean;
  showMilitary: boolean;
  showBuildings: boolean;
  showTeam0: boolean;
  showTeam1: boolean;
  showPaths: boolean;
  playbackSpeed: number;
  // Actions
  toggleWorkers: () => void;
  toggleMilitary: () => void;
  // ... other toggles
}

export const useSimulationStore = create<SimulationState>()((set) => ({
  showWorkers: true,
  showMilitary: true,
  showBuildings: true,
  // ... implementation
}));
```

### 3. Create Raw Data Explorer Component

- **Index**: 3
- **Name**: Create RawDataExplorer component
- **Description**: Main component with tabs for different data views
- **Justification**: Provides structured access to replay analysis data
- **Snippet**:

```typescript
// src/app/replays/[replaySlug]/components/RawDataExplorer.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Input } from "~/components/ui/input";
import ReactJson from 'react-json-view';

interface RawDataExplorerProps {
  replayData: ReplayAnalysisResult;
  timeSeriesData: TimeSeriesSnapshot[];
}

export default function RawDataExplorer({ replayData, timeSeriesData }: RawDataExplorerProps) {
  return (
    <Tabs defaultValue="controls">
      <TabsList>
        <TabsTrigger value="controls">Simulation Controls</TabsTrigger>
        <TabsTrigger value="raw-data">Raw Data</TabsTrigger>
      </TabsList>
      {/* Implementation */}
    </Tabs>
  );
}
```

### 4. Create Simulation Controls Panel

- **Index**: 4
- **Name**: Create SimulationControls component
- **Description**: Panel with checkboxes for visibility toggles
- **Justification**: Direct control over what's rendered in the Pixi visualization
- **Snippet**:

```typescript
// src/app/replays/[replaySlug]/components/SimulationControls.tsx
import { Checkbox } from "~/components/ui/checkbox";
import { useSimulationStore } from "~/stores/simulationStore";

export default function SimulationControls() {
  const { showWorkers, showMilitary, toggleWorkers, toggleMilitary } = useSimulationStore();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="workers"
            checked={showWorkers}
            onCheckedChange={toggleWorkers}
          />
          <label htmlFor="workers">Workers</label>
        </div>
        {/* More controls */}
      </div>
    </div>
  );
}
```

### 5. Create Searchable JSON Viewer

- **Index**: 5
- **Name**: Create JsonDataViewer component
- **Description**: Searchable JSON viewer with syntax highlighting
- **Justification**: Enables deep exploration of replay analysis structure
- **Snippet**:

```typescript
// src/app/replays/[replaySlug]/components/JsonDataViewer.tsx
import ReactJson from 'react-json-view';
import { Input } from "~/components/ui/input";
import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';

export default function JsonDataViewer({ data }: { data: any }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    // Implement fuzzy search logic
    return data; // filtered result
  }, [data, searchTerm]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search data..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ReactJson
        src={filteredData}
        theme="monokai"
        collapsed={2}
        displayDataTypes={false}
        enableClipboard={true}
      />
    </div>
  );
}
```

### 6. Update PixiReplayViewer to Use Store

- **Index**: 6
- **Name**: Integrate simulation store with Pixi viewer
- **Description**: Connect visibility controls to rendering logic
- **Justification**: Makes controls functional by filtering rendered units
- **Snippet**:

```typescript
// In PixiReplayViewer.tsx - update UnitsRenderer component
const UnitsRenderer: React.FC<{
  units: UnitVisual[];
  onUnitHover?: (unit: UnitVisual | null, x: number, y: number) => void;
}> = ({ units, onUnitHover }) => {
  const { showWorkers, showMilitary, showBuildings, showTeam0, showTeam1 } =
    useSimulationStore();

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      // Apply visibility filters
      if (!showTeam0 && unit.team === 0) return false;
      if (!showTeam1 && unit.team === 1) return false;
      if (unit.isBuilding && !showBuildings) return false;
      // ... more filters
      return true;
    });
  }, [units, showWorkers, showMilitary, showBuildings, showTeam0, showTeam1]);

  // ... rest of component uses filteredUnits
};
```

### 7. Create Collapsible Explorer Panel

- **Index**: 7
- **Name**: Create ReplayExplorerPanel component
- **Description**: Main container with collapsible functionality
- **Justification**: Provides organized layout without overwhelming the main view
- **Snippet**:

```typescript
// src/app/replays/[replaySlug]/components/ReplayExplorerPanel.tsx
import { useState } from 'react';
import { ChevronRight, ChevronDown, Settings, Database } from 'lucide-react';
import { Button } from "~/components/ui/button";

export default function ReplayExplorerPanel({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`transition-all duration-300 ${isExpanded ? 'w-96' : 'w-12'}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-2"
      >
        {isExpanded ? <ChevronRight /> : <ChevronDown />}
        {isExpanded && "Data Explorer"}
      </Button>
      {isExpanded && (
        <div className="border rounded-lg p-4 bg-background">
          {children}
        </div>
      )}
    </div>
  );
}
```

### 8. Update ReplayViewerWrapper Layout

- **Index**: 8
- **Name**: Update wrapper to include explorer panel
- **Description**: Modify layout to accommodate side panel
- **Justification**: Integrates explorer into existing replay viewer structure
- **Snippet**:

```typescript
// In ReplayViewerWrapper.tsx
export default function ReplayViewerWrapper({ timeSeriesData, gameDuration, replayData }: ReplayViewerWrapperProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <PixiReplayViewer
          timeSeriesData={timeSeriesData}
          gameDuration={gameDuration}
        />
      </div>
      <ReplayExplorerPanel>
        <RawDataExplorer
          replayData={replayData}
          timeSeriesData={timeSeriesData}
        />
      </ReplayExplorerPanel>
    </div>
  );
}
```

### 9. Update Main Replay Page Props

- **Index**: 9
- **Name**: Pass replay data to wrapper component
- **Description**: Update ReplayViewerWrapper props to include full replay data
- **Justification**: Explorer needs access to complete analysis results
- **Snippet**:

```typescript
// In src/app/replays/[replaySlug]/page.tsx
<ReplayViewerWrapper
  timeSeriesData={timeSeriesData}
  gameDuration={replayData.game_info.duration}
  replayData={replayData} // Add this prop
/>
```

### 10. Add Search Functionality to Raw Data

- **Index**: 10
- **Name**: Implement fuzzy search in JsonDataViewer
- **Description**: Add Fuse.js integration for searching through replay data
- **Justification**: Large replay datasets need efficient search capabilities
- **Snippet**:

```typescript
// In JsonDataViewer.tsx - enhance search logic
const searchableData = useMemo(() => {
  const flattenObject = (
    obj: any,
    prefix = "",
  ): Array<{ key: string; value: any; path: string }> => {
    // Flatten nested objects for searching
    // Implementation details...
  };
  return flattenObject(data);
}, [data]);

const fuse = useMemo(() => {
  return new Fuse(searchableData, {
    keys: ["key", "value"],
    threshold: 0.3,
  });
}, [searchableData]);
```

### 11. Add Export Functionality

- **Index**: 11
- **Name**: Add data export capabilities
- **Description**: Allow users to export filtered/searched data
- **Justification**: Useful for external analysis of replay data
- **Snippet**:

```typescript
// In JsonDataViewer.tsx - add export button
const exportData = () => {
  const dataStr = JSON.stringify(filteredData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const exportFileDefaultName = 'replay-data.json';

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

return (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <Input />
      <Button variant="outline" size="sm" onClick={exportData}>
        Export JSON
      </Button>
    </div>
    {/* ReactJson component */}
  </div>
);
```

### 12. Add Performance Optimizations

- **Index**: 12
- **Name**: Add virtualization for large datasets
- **Description**: Implement react-window for large JSON trees
- **Justification**: Prevents UI lag with large replay datasets
- **Snippet**:

```typescript
// Optional enhancement - install react-window
// bun add react-window @types/react-window

// In JsonDataViewer.tsx for very large datasets
import { FixedSizeList } from "react-window";

// Implement virtualized list for search results when needed
```

### 13. Add Keyboard Shortcuts

- **Index**: 13
- **Name**: Implement keyboard shortcuts for explorer
- **Description**: Add hotkeys for toggling visibility options
- **Justification**: Improves user experience for power users
- **Snippet**:

```typescript
// In SimulationControls.tsx
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "1":
          e.preventDefault();
          toggleWorkers();
          break;
        case "2":
          e.preventDefault();
          toggleMilitary();
          break;
        // ... more shortcuts
      }
    }
  };

  window.addEventListener("keydown", handleKeyPress);
  return () => window.removeEventListener("keydown", handleKeyPress);
}, []);
```

### 14. Add Settings Persistence

- **Index**: 14
- **Name**: Persist user preferences in localStorage
- **Description**: Save visibility settings between sessions
- **Justification**: Better user experience by remembering preferences
- **Snippet**:

```typescript
// In simulationStore.ts - add persistence
import { persist } from "zustand/middleware";

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set) => ({
      // ... state definition
    }),
    {
      name: "simulation-settings",
    },
  ),
);
```

### 15. Update Type Definitions

- **Index**: 15
- **Name**: Add TypeScript interfaces for new components
- **Description**: Define proper types for explorer component props
- **Justification**: Ensures type safety and better developer experience
- **Snippet**:

```typescript
// In components or types file
export interface ReplayExplorerProps {
  replayData: ReplayAnalysisResult;
  timeSeriesData: TimeSeriesSnapshot[];
}

export interface SimulationSettings {
  showWorkers: boolean;
  showMilitary: boolean;
  showBuildings: boolean;
  showTeam0: boolean;
  showTeam1: boolean;
  showPaths: boolean;
}

// Update ReplayViewerWrapperProps
interface ReplayViewerWrapperProps {
  timeSeriesData: TimeSeriesSnapshot[];
  gameDuration: number;
  replayData: ReplayAnalysisResult; // Add this
}
```

## File Structure After Implementation

```
src/
├── app/replays/[replaySlug]/
│   ├── components/
│   │   ├── RawDataExplorer.tsx (new)
│   │   ├── SimulationControls.tsx (new)
│   │   ├── JsonDataViewer.tsx (new)
│   │   ├── ReplayExplorerPanel.tsx (new)
│   │   ├── ReplayViewerWrapper.tsx (updated)
│   │   └── PixiReplayViewer.tsx (updated)
│   └── page.tsx (updated)
├── stores/
│   └── simulationStore.ts (new)
└── implementation_plans/
    └── raw-data-explorer-component.md (this file)
```

## Benefits

1. **Enhanced Debugging**: Deep inspection of replay analysis data
2. **Flexible Visualization**: Granular control over what's displayed
3. **Performance**: Only render what's needed based on filters
4. **User Experience**: Intuitive controls with keyboard shortcuts
5. **Extensibility**: Easy to add new visualization options
6. **Data Export**: Enable external analysis workflows

## Testing Considerations

- Test with large replay files to ensure performance
- Verify state persistence across page reloads
- Test keyboard shortcuts don't conflict with existing controls
- Ensure responsive design on different screen sizes
- Test search functionality with various data structures
