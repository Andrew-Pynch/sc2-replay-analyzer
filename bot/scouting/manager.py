from sc2.bot_ai import BotAI
from game_state import GameState


class ScoutManager:
    def __init__(self, bot: BotAI, game_state: GameState):
        self.bot = bot
        self.game_state = game_state

    def execute(self): 
        """Updates the game state with what we see"""
        # Track visible enemies
        for unit in self.bot.enemy_units:
            # Add to seen set
            self.game_state.enemy_units_seen.add(unit.type_id)
            
            # Count units
            self.game_state.enemy_unit_counts[unit.type_id] = self.game_state.enemy_unit_counts.get(unit.type_id, 0) + 1
            
            # Track positions
            if unit.type_id not in self.game_state.enemy_positions:
                self.game_state.enemy_positions[unit.type_id] = []
            self.game_state.enemy_positions[unit.type_id].append(unit.position)
