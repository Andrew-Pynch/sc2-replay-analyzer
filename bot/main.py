#!/usr/bin/env python3
import os
from pathlib import Path

# Set the SC2 path and wine environment for Steam/Proton
SC2_PATH = Path("/home/andrew/.steam/debian-installation/steamapps/compatdata/2291947483/pfx/drive_c/Program Files (x86)/StarCraft II")
WINE_PREFIX = Path("/home/andrew/.steam/debian-installation/steamapps/compatdata/2291947483/pfx")

# render settings
os.environ["SC2_HEADLESS"] = "0"
os.environ["SC2_WINDOWWIDTH"] = "1920"
os.environ["SC2_WINDOWHEIGHT"] = "1080"
os.environ["SC2_WINDOWX"] = "0"
os.environ["SC2_WINDOWY"] = "0"

os.environ["SC2PATH"] = str(SC2_PATH)
os.environ["SC2PF"] = "WineLinux"
os.environ["WINE"] = "/usr/bin/wine"
os.environ["WINEPREFIX"] = str(WINE_PREFIX)
os.environ["WINEDLLOVERRIDES"] = "mscoree,mshtml="
# Additional wine settings to reduce graphics issues
os.environ["PROTON_USE_WINED3D"] = "1"  # Use Wine3D instead of DXVK
os.environ["WINE_LARGE_ADDRESS_AWARE"] = "1"
os.environ["__GL_SHADER_DISK_CACHE"] = "1"

from sc2 import maps
from sc2.bot_ai import BotAI, UpgradeId
from sc2.data import Race, Difficulty
from sc2.ids.unit_typeid import UnitTypeId
from sc2.main import run_game
from sc2.player import Bot, Computer
from bot import AndrewBot

SC2_MAP = "AcidPlantLE"

def main():
    print(f"Using SC2 at: {SC2_PATH}")
    
    print(f"Starting game on: {SC2_MAP}")
    # This will use SC2's built-in melee maps
    run_game(
        maps.get(SC2_MAP),  # This is a ladder map from Ladder2018Season3
        [Bot(Race.Terran, AndrewBot()), Computer(Race.Zerg, Difficulty.Easy)],
        realtime=False,
        save_replay_as="game.SC2Replay",
        disable_fog=False,  # Disable fog of war for easier debugging
    )

if __name__ == "__main__":
    main()
