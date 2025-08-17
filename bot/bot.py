from sc2.bot_ai import BotAI, UnitTypeId
from game_state import GameState
from scouting.manager import ScoutManager
from macro.build_order.manager import BuildOrderManager

class AndrewBot(BotAI):
    def __init__(self):
        pass  # Init is clean
        
    async def on_start(self):
        """Initialize bot state"""
        self.game_state = GameState()
        self.scout_manager = ScoutManager(self, self.game_state)
        self.build_manager = BuildOrderManager(self)
        
        print(f"Game started on {self.game_info.map_name}")
        print(f"Playing against {self.enemy_race}")

    async def emergency_supply_depot(self):
        """Build a supply depot if we're low on supply"""
        if self.supply_left < 3 and not self.already_pending(UnitTypeId.SUPPLYDEPOT):
            if self.can_afford(UnitTypeId.SUPPLYDEPOT) and self.workers:
                await self.build(UnitTypeId.SUPPLYDEPOT, near=self.townhalls.first)
        
    async def on_step(self, iteration: int):
        await self.emergency_supply_depot()

        # Core economy (always runs)
        await self.distribute_workers()
        await self._train_workers()
        
        # Execute our build order
        await self.build_manager.execute()
        
        # Scout and gather intel
        self.scout_manager.execute()
        
    async def _train_workers(self):
        """Keep making SCVs"""
        if self.supply_workers < 50 and self.townhalls:
            for th in self.townhalls.ready.idle:
                if self.can_afford(UnitTypeId.SCV):
                    th.train(UnitTypeId.SCV)
