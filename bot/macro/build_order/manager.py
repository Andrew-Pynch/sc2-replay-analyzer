from sc2.bot_ai import BotAI
from sc2.ids.unit_typeid import UnitTypeId
from sc2.ids.ability_id import AbilityId
from sc2.position import Point2
from .builds import TERRAN_SAFE_1_1_1, BuildStep

class BuildOrderManager:
    def __init__(self, bot: BotAI):
        self.bot = bot
        self.build_order = TERRAN_SAFE_1_1_1
        self.current_step_index = 0
        self.completed_steps = []
        self.paused = False
        
    async def execute(self):
        """Execute the next step in our build order"""
        # Don't do anything if we're paused or finished
        if self.paused or self.current_step_index >= len(self.build_order):
            print(f"🚧 Build order paused at step {self.current_step_index}")
            return
            
        # Get current step
        current_step = self.build_order[self.current_step_index]
        
        # Check if we've reached the supply requirement
        if self.bot.supply_used >= current_step.supply:
            # Handle special STRATEGY_DECISION marker
            if current_step.action == "STRATEGY_DECISION":
                print("\n" + "="*50)
                print(f"🎯 STRATEGY DECISION POINT REACHED!")
                print(f"Supply: {self.bot.supply_used}/{self.bot.supply_cap}")
                print(f"Time: {self.bot.time_formatted}")
                print("Bot is pausing - strategy manager should take over!")
                print("="*50 + "\n")
                
                # Pause the simulation so you know it's working
                self.paused = True
                # In a real game, this is where StrategyManager would analyze and choose next build
                return
            
            # Check if conditions are met (if any)
            if current_step.condition and not self._check_condition(current_step.condition):
                print(f"🚧 Waiting for condition: {current_step.condition}")
                return  # Wait for condition
                
            # Try to execute the build step
            success = await self._execute_build_step(current_step)
            
            if success:
                print(f"[{self.bot.time_formatted}] ✅ Executed: {current_step.action} at {self.bot.supply_used} supply")
                self.completed_steps.append(current_step)
                self.current_step_index += 1
                
    def _check_condition(self, condition: str) -> bool:
        """Check if a build condition is met"""
        
        if condition == "barracks_ready":
            return self.bot.structures(UnitTypeId.BARRACKS).ready.exists
            
        elif condition == "factory_ready":
            return self.bot.structures(UnitTypeId.FACTORY).ready.exists
            
        elif condition == "starport_ready":
            return self.bot.structures(UnitTypeId.STARPORT).ready.exists
            
        elif condition == "factory_techlab":
            # Check if factory has a tech lab
            for factory in self.bot.structures(UnitTypeId.FACTORY).ready:
                if factory.has_techlab:
                    return True
            return False
            
        elif condition == "natural_expansion":
            # Check if we have a command center at natural
            return self.bot.townhalls.amount >= 2
            
        return True  # Unknown conditions pass by default
        
    async def _execute_build_step(self, step: BuildStep) -> bool:
        """Execute a specific build step"""
        
        action = step.action
        
        # === STRUCTURES ===
        if action == UnitTypeId.SUPPLYDEPOT:
            return await self._build_supply_depot()
            
        elif action == UnitTypeId.BARRACKS:
            return await self._build_barracks()
            
        elif action == UnitTypeId.REFINERY:
            return await self._build_refinery()
            
        elif action == UnitTypeId.COMMANDCENTER:
            return await self._build_command_center()
            
        elif action == UnitTypeId.FACTORY:
            return await self._build_factory()
            
        elif action == UnitTypeId.STARPORT:
            return await self._build_starport()
            
        elif action == UnitTypeId.BUNKER:
            return await self._build_bunker()
            
        elif action == UnitTypeId.ENGINEERINGBAY:
            return await self._build_engineering_bay()
            
        elif action == UnitTypeId.TECHLAB:
            return await self._build_techlab_on_factory()
            
        # === UNITS ===
        elif action == UnitTypeId.MARINE:
            return await self._train_marine()
            
        elif action == UnitTypeId.SIEGETANK:
            return await self._train_siege_tank()
            
        elif action == UnitTypeId.MEDIVAC:
            return await self._train_medivac()
            
        # === UPGRADES ===
        elif action == UnitTypeId.ORBITALCOMMAND:
            return await self._upgrade_to_orbital()
            
        return False
        
    # === Building Methods ===
    async def _build_supply_depot(self) -> bool:
        if not self.bot.can_afford(UnitTypeId.SUPPLYDEPOT):
            return False
        
        # Don't queue multiple depots
        if self.bot.already_pending(UnitTypeId.SUPPLYDEPOT):
            return False
            
        workers = self.bot.workers
        if workers:
            # Build near main base - use .position to ensure Point2
            target_position = Point2(self.bot.townhalls.first.position.towards(
                self.bot.game_info.map_center, 5
            ).position)
            
            location = await self.bot.find_placement(
                UnitTypeId.SUPPLYDEPOT,
                near=target_position
            )
            if location:
                worker = workers.closest_to(location)
                worker.build(UnitTypeId.SUPPLYDEPOT, location)
                return True
        return False
        
    async def _build_barracks(self) -> bool:
        if not self.bot.can_afford(UnitTypeId.BARRACKS):
            return False
            
        workers = self.bot.workers
        if not workers:
            return False
            
        # Try to build at ramp first
        if self.bot.main_base_ramp and self.bot.main_base_ramp.barracks_in_middle:
            location = await self.bot.find_placement(
                UnitTypeId.BARRACKS,
                near=self.bot.main_base_ramp.barracks_in_middle
            )
            if location:
                worker = workers.closest_to(location)
                worker.build(UnitTypeId.BARRACKS, location)
                return True
        
        # Fallback: build near main base
        location = await self.bot.find_placement(
            UnitTypeId.BARRACKS,
            near=Point2(self.bot.townhalls.first.position.towards(self.bot.game_info.map_center, 5).position)
        )
        if location:
            worker = workers.closest_to(location)
            worker.build(UnitTypeId.BARRACKS, location)
            return True
            
        return False
        
    async def _build_refinery(self) -> bool:
        if not self.bot.can_afford(UnitTypeId.REFINERY):
            return False
            
        # Find a free geyser
        for th in self.bot.townhalls:
            vespenes = self.bot.vespene_geyser.closer_than(10, th)
            for vespene in vespenes:
                if not self.bot.structures.closer_than(1, vespene).exists:
                    worker = self.bot.workers.closest_to(vespene)
                    worker.build(UnitTypeId.REFINERY, vespene)
                    return True
        return False

    async def _build_command_center(self) -> bool:
        if not self.bot.can_afford(UnitTypeId.COMMANDCENTER):
            return False
        
        # Use the built-in expand function!
        await self.bot.expand_now()
        return True

    async def _build_factory(self) -> bool:
        if not self.bot.can_afford(UnitTypeId.FACTORY):
            return False
        
        workers = self.bot.workers
        if not workers:
            return False
            
        # Build near main base
        location = await self.bot.find_placement(
            UnitTypeId.FACTORY,
            near=Point2(self.bot.townhalls.first.position.towards(self.bot.game_info.map_center, 8))
        )
        if location:
            worker = workers.closest_to(location)
            worker.build(UnitTypeId.FACTORY, location)
            return True
        return False

    async def _build_starport(self) -> bool:
        if not self.bot.can_afford(UnitTypeId.STARPORT):
            return False
        
        workers = self.bot.workers
        if not workers:
            return False
            
        location = await self.bot.find_placement(
            UnitTypeId.STARPORT,
            near=Point2(self.bot.townhalls.first.position.towards(self.bot.game_info.map_center, 10))
        )
        if location:
            worker = workers.closest_to(location)
            worker.build(UnitTypeId.STARPORT, location)
            return True
        return False

    async def _build_bunker(self) -> bool:
        if not self.bot.can_afford(UnitTypeId.BUNKER):
            return False
        
        # Build bunker at natural if we have one
        if self.bot.townhalls.amount >= 2:
            natural = self.bot.townhalls[1]
            workers = self.bot.workers
            if workers:
                location = await self.bot.find_placement(
                    UnitTypeId.BUNKER,
                    near=natural.position.towards(self.bot.enemy_start_locations[0], 8)
                )
                if location:
                    worker = workers.closest_to(location)
                    worker.build(UnitTypeId.BUNKER, location)
                    return True
        return False

    async def _build_engineering_bay(self) -> bool:
        if not self.bot.can_afford(UnitTypeId.ENGINEERINGBAY):
            return False
        
        workers = self.bot.workers
        if not workers:
            return False
            
        location = await self.bot.find_placement(
            UnitTypeId.ENGINEERINGBAY,
            near=Point2(self.bot.townhalls.first.position.towards(self.bot.game_info.map_center, 6))
        )
        if location:
            worker = workers.closest_to(location)
            worker.build(UnitTypeId.ENGINEERINGBAY, location)
            return True
        return False

    async def _build_techlab_on_factory(self) -> bool:
        # Find a factory without an addon
        for factory in self.bot.structures(UnitTypeId.FACTORY).ready.idle:
            if not factory.has_addon and self.bot.can_afford(UnitTypeId.FACTORYTECHLAB):
                factory.build(UnitTypeId.FACTORYTECHLAB)
                return True
        return False

    async def _upgrade_to_orbital(self) -> bool:
        # Find command centers that can be upgraded
        for cc in self.bot.townhalls(UnitTypeId.COMMANDCENTER).ready.idle:
            if self.bot.can_afford(UnitTypeId.ORBITALCOMMAND):
                cc(AbilityId.UPGRADETOORBITAL_ORBITALCOMMAND)  # Use the ability!
                return True
        return False

    # === Units ===
    async def _train_marine(self) -> bool:
        if not self.bot.can_afford(UnitTypeId.MARINE):
            return False

        barracks = self.bot.structures(UnitTypeId.BARRACKS).ready
        if not barracks:
            return False

        for rax in barracks:
            if self.bot.can_afford(UnitTypeId.MARINE):
                rax.train(UnitTypeId.MARINE)
                return True

        return False

    async def _train_siege_tank(self) -> bool:
        if not self.bot.can_afford(UnitTypeId.SIEGETANK):
            return False

        factories = self.bot.structures(UnitTypeId.FACTORY).ready
        if not factories:
            return False
            
        for factory in factories:
            if self.bot.can_afford(UnitTypeId.SIEGETANK):
                factory.train(UnitTypeId.SIEGETANK)
                return True
                
        return False

    async def _train_medivac(self) -> bool:
        if not self.bot.can_afford(UnitTypeId.MEDIVAC):
            return False
            
        starports = self.bot.structures(UnitTypeId.STARPORT).ready
        if not starports:
            return False
            
        for starport in starports:
            if self.bot.can_afford(UnitTypeId.MEDIVAC):
                starport.train(UnitTypeId.MEDIVAC)
                return True
                
        return False
        
