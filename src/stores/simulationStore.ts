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
  toggleBuildings: () => void;
  toggleTeam0: () => void;
  toggleTeam1: () => void;
  togglePaths: () => void;
  setPlaybackSpeed: (speed: number) => void;

  reset: () => void;
}

export const useSimulationStore = create<SimulationState>()((set) => ({
  showWorkers: true,
  showMilitary: true,
  showBuildings: true,
  showTeam0: true,
  showTeam1: true,
  showPaths: true,
  playbackSpeed: 1,

  toggleWorkers: () => set((state) => ({ showWorkers: !state.showWorkers })),
  toggleMilitary: () => set((state) => ({ showMilitary: !state.showMilitary })),
  toggleBuildings: () =>
    set((state) => ({ showBuildings: !state.showBuildings })),
  toggleTeam0: () => set((state) => ({ showTeam0: !state.showTeam0 })),
  toggleTeam1: () => set((state) => ({ showTeam1: !state.showTeam1 })),
  togglePaths: () => set((state) => ({ showPaths: !state.showPaths })),
  setPlaybackSpeed: (speed) => set((state) => ({ playbackSpeed: speed })),

  reset: () =>
    set((state) => ({
      showWorkers: true,
      showMilitary: true,
      showBuildings: true,
      showTeam0: true,
      showTeam1: true,
      showPaths: true,
      playbackSpeed: 1,
    })),
}));
