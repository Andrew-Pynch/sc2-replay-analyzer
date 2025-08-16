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

from sc2 import maps
from sc2.bot_ai import BotAI, UpgradeId
from sc2.data import Race, Difficulty
from sc2.ids.unit_typeid import UnitTypeId
from sc2.main import run_game
from sc2.player import Bot, Computer

SC2_MAP = "AcidPlantLE"

class MyBot(BotAI):
    def step_log(self, iteration: int):
        if iteration % 22 == 0:
            print(f"\nGame Time: {self.time_formatted}\nIteration: {iteration}, \nMinerals: {self.minerals}, Supply: {self.supply_used}/{self.supply_cap}")

    def build_worker(self):
        # Build workers
        if self.townhalls and self.can_afford(UnitTypeId.SCV) and self.supply_workers < 20:
            for townhall in self.townhalls.idle:
                townhall.train(UnitTypeId.SCV)

    def should_build_supply_depot(self):
        # Check if we need to build a supply depot
        if self.supply_left < 4 and not self.already_pending(UnitTypeId.SUPPLYDEPOT):
            return True
        return False

    async def build_supply_depots(self, amount: int):
        # select an SCV and build a supply depot
        produced_supply_depots = 0
        while produced_supply_depots < amount:
            if self.workers and self.can_afford(UnitTypeId.SUPPLYDEPOT):
                await self.build(UnitTypeId.SUPPLYDEPOT, near=self.townhalls[0])
                produced_supply_depots += 1
            else:
                # Break if we can't afford or have no workers
                break

    async def distribute_workers_on_interval(self, iteration: int):
        if iteration % 100 == 0:
            await self.distribute_workers()

    async def construct_barracks(self):
        if self.workers and self.can_afford(UnitTypeId.BARRACKS):
            await self.build(UnitTypeId.BARRACKS, near=self.townhalls[0])

    def train_marine(self):
        # Train marines from all barracks
        for rax in self.structures(UnitTypeId.BARRACKS).ready.idle:
            if self.can_afford(UnitTypeId.MARINE) and self.supply_left > 0:
                rax.train(UnitTypeId.MARINE)

    async def build_ebay(self):
        if self.workers and self.can_afford(UnitTypeId.ENGINEERINGBAY):
            await self.build(UnitTypeId.ENGINEERINGBAY, near=self.townhalls[0])

    def research_barracks_upgrades(self):
        for ebay in self.structures(UnitTypeId.ENGINEERINGBAY).ready.idle:
            if UpgradeId.TERRANINFANTRYWEAPONSLEVEL1 in self.game_data.upgrades:
                if self.can_afford(UpgradeId.TERRANINFANTRYWEAPONSLEVEL1):
                    ebay.research(UpgradeId.TERRANINFANTRYWEAPONSLEVEL1)
        

    async def on_step(self, iteration: int):
        self.step_log(iteration)
        self.build_worker()
        
        if self.should_build_supply_depot():
            await self.build_supply_depots(1)

        if self.supply_used >= 16 and self.structures(UnitTypeId.BARRACKS).amount == 0:
            await self.construct_barracks()
            
        self.train_marine()
        
        await self.distribute_workers_on_interval(iteration)


        

def main():
    print(f"Using SC2 at: {SC2_PATH}")
    
    print(f"Starting game on: {SC2_MAP}")
    # This will use SC2's built-in melee maps
    run_game(
        maps.get(SC2_MAP),  # This is a ladder map from Ladder2018Season3
        [Bot(Race.Terran, MyBot()), Computer(Race.Zerg, Difficulty.Easy)],
        realtime=False,
        save_replay_as="test_game.SC2Replay",
        disable_fog=True,  # Disable fog of war for easier debugging
        game_time_limit=300  # Limit game to 5 minutes
    )

if __name__ == "__main__":
    main()
