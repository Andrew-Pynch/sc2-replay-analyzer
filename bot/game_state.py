
from typing import Set, Dict, TYPE_CHECKING
from sc2.ids.unit_typeid import UnitTypeId
from sc2.position import Point2

class GameState:
    def __init__(self) -> None:
        # Enemy tracking
        self.enemy_expansion_count: int = 1
        self.enemy_expansions_scouted = set() # track which of them we have seen

        self.enemy_units_seen: Set[UnitTypeId] = set()
        self.enemy_unit_counts: Dict[UnitTypeId, int] = {}
        self.enemy_positions: Dict[UnitTypeId, list[Point2]] = {}
