# bot.py - Start simple, get it running
from sc2.bot_ai import BotAI
from sc2.ids.unit_typeid import UnitTypeId
from sc2.ids.ability_id import AbilityId
from sc2.ids.upgrade_id import UpgradeId
from sc2.position import Point2
from game_state import GameState
from strategy.build_orders import TERRAN_1RAX_FE
from scouting.manager import ScoutManager
import random

class AndrewBot(BotAI):
    def __init__(self):
        # Game state tracking
        self.scout_sent = False
        self.strategy = "macro"  # Start with macro focus
        self.enemy_composition = set()
        
    async def on_start(self):
        """Initialize bot state"""
        self.game_state = GameState()
        self.scout_manager = ScoutManager(self, self.game_state)
        self.build_order = TERRAN_1RAX_FE
        self.build_index = 0


        print(f"Game started on {self.game_info.map_name}")
        print(f"Playing against {self.enemy_race}")
        
    async def on_step(self, iteration: int):
        # Core loop - order matters!
        await self.manage_economy()
        await self.manage_supply()
        await self.execute_build_order()
        await self.produce_army()
        await self.scout()
        await self.control_army()
        
        # other updates
        self.scout_manager.update()
        
    async def manage_economy(self):
        """Handle workers and expansions"""
        # Build workers
        if self.supply_workers < 70 and self.townhalls:
            for th in self.townhalls.ready.idle:
                if self.can_afford(UnitTypeId.SCV):
                    th.train(UnitTypeId.SCV)
        
        # Distribute workers
        await self.distribute_workers()
        
        # Expand when ready (simple version)
        if self.minerals > 400 and self.townhalls.amount < 3:
            await self.expand_now()
    
    async def manage_supply(self):
        """Never get supply blocked!"""
        # Terran example
        if self.supply_left < 6 and not self.already_pending(UnitTypeId.SUPPLYDEPOT):
            if self.can_afford(UnitTypeId.SUPPLYDEPOT) and self.workers:
                await self.build(
                    UnitTypeId.SUPPLYDEPOT,
                    near=self.townhalls.first.position.towards_with_random_angle(
                        self.game_info.map_center
                    )
                )
    
    async def execute_build_order(self):
        """Basic 1-1-1 opener for Terran"""
        # This is where your build order logic goes
        # Start simple, we'll expand this
        
        # First barracks
        if not self.structures(UnitTypeId.BARRACKS) and self.supply_used >= 15:
            if self.can_afford(UnitTypeId.BARRACKS) and self.workers:
                await self.build(UnitTypeId.BARRACKS, near=self.townhalls.first)
                
        # Factory after barracks
        if self.structures(UnitTypeId.BARRACKS).ready and not self.structures(UnitTypeId.FACTORY):
            if self.can_afford(UnitTypeId.FACTORY) and self.workers:
                await self.build(UnitTypeId.FACTORY, near=self.townhalls.first)
                
        # Starport after factory  
        if self.structures(UnitTypeId.FACTORY).ready and not self.structures(UnitTypeId.STARPORT):
            if self.can_afford(UnitTypeId.STARPORT) and self.workers:
                await self.build(UnitTypeId.STARPORT, near=self.townhalls.first)
    
    async def produce_army(self):
        """Constantly produce units"""
        # Marines from barracks
        for rax in self.structures(UnitTypeId.BARRACKS).ready.idle:
            if self.can_afford(UnitTypeId.MARINE) and self.supply_left > 0:
                rax.train(UnitTypeId.MARINE)
        
        # Tanks from factory
        for factory in self.structures(UnitTypeId.FACTORY).ready.idle:
            if self.can_afford(UnitTypeId.SIEGETANK) and self.supply_left > 2:
                factory.train(UnitTypeId.SIEGETANK)
                
        # Medivacs from starport
        for starport in self.structures(UnitTypeId.STARPORT).ready.idle:
            if self.can_afford(UnitTypeId.MEDIVAC) and self.supply_left > 1:
                starport.train(UnitTypeId.MEDIVAC)
    
    async def scout(self):
        """Send a worker to scout at 14 supply"""
        if not self.scout_sent and self.supply_used >= 14 and self.workers:
            scout = self.workers.random
            scout.move(self.enemy_start_locations[0])
            self.scout_sent = True
            
    async def control_army(self):
        """Basic army control"""
        # Group up army
        army = self.units.filter(lambda u: u.can_attack)
        
        if army.amount > 15:  # Attack when we have decent army
            for unit in army.idle:
                unit.attack(self.enemy_start_locations[0])
        else:
            # Defend
            if self.enemy_units and army:
                for unit in army.idle:
                    unit.attack(self.enemy_units.closest_to(self.townhalls.first))
