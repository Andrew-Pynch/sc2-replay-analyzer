#!/usr/bin/env python3
import os
from pathlib import Path

# Set the SC2 path and wine environment for Steam/Proton
SC2_PATH = Path("/home/andrew/.steam/debian-installation/steamapps/compatdata/2291947483/pfx/drive_c/Program Files (x86)/StarCraft II")
WINE_PREFIX = Path("/home/andrew/.steam/debian-installation/steamapps/compatdata/2291947483/pfx")

os.environ["SC2PATH"] = str(SC2_PATH)
os.environ["SC2PF"] = "WineLinux"
os.environ["WINE"] = "/usr/bin/wine"
os.environ["WINEPREFIX"] = str(WINE_PREFIX)
os.environ["WINEDLLOVERRIDES"] = "mscoree,mshtml="
# Additional wine settings to reduce graphics issues
os.environ["PROTON_USE_WINED3D"] = "1"  # Use Wine3D instead of DXVK
os.environ["WINE_LARGE_ADDRESS_AWARE"] = "1"
os.environ["__GL_SHADER_DISK_CACHE"] = "1"

from sc2.main import run_replay
from sc2.observer_ai import ObserverAI
from sc2.ids.unit_typeid import UnitTypeId

REPLAY_PATH = Path("/home/andrew/Documents/StarCraft II/Replays/game.SC2Replay")

class ReplayViewer(ObserverAI):
    def __init__(self):
        super().__init__()
        self.last_log_time = 0
        
    async def on_start(self):
        print(f"=== Replay Viewer Started ===")
        print(f"Map: {self.game_info.map_name}")
        print(f"Players:")
        for player in self.game_info.players:
            print(f"  Player {player.player_id}: {player.name} ({player.race})")
        print("=" * 40)
        
    async def on_step(self, iteration: int):
        # Log every 2 seconds (44 iterations at normal speed)
        if iteration % 44 == 0:
            game_time = self.time_formatted
            
            print(f"\n--- Game Time: {game_time} ---")
            
            # Display supply and resources for each player
            for player_id in [1, 2]:  # Assuming 2 players
                if player_id == 1:
                    # Player 1 (bot)
                    supply_info = f"{self.supply_used}/{self.supply_cap}"
                    print(f"Player 1: Minerals: {self.minerals}, Gas: {self.vespene}, Supply: {supply_info}")
                    
                    # Count units
                    workers = self.units(UnitTypeId.SCV).amount
                    marines = self.units(UnitTypeId.MARINE).amount
                    barracks = self.structures(UnitTypeId.BARRACKS).amount
                    supply_depots = self.structures(UnitTypeId.SUPPLYDEPOT).amount
                    
                    print(f"  Units: {workers} SCVs, {marines} Marines")
                    print(f"  Buildings: {supply_depots} Supply Depots, {barracks} Barracks")
                    
    async def on_end(self, game_result):
        print(f"\n=== Game Ended ===")
        print(f"Result: {game_result}")
        print(f"Final game time: {self.time_formatted}")

def main():
    replay_path = Path(REPLAY_PATH).resolve()
    
    if not replay_path.exists():
        print(f"Error: Replay file not found at {replay_path}")
        print("Run the bot first to generate a replay file.")
        return
        
    print(f"Loading replay from: {replay_path}")
    print(f"Using SC2 at: {SC2_PATH}")
    
    try:
        run_replay(
            ReplayViewer(),
            replay_path,
            realtime=True,  # Set to False for faster playback
            observed_id=1   # Observe player 1 (the bot)
        )
    except Exception as e:
        print(f"Error running replay: {e}")

if __name__ == "__main__":
    main()
