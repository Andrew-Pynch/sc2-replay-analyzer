
from typing import Set, Dict, TYPE_CHECKING
from sc2.ids.unit_typeid import UnitTypeId
from sc2.position import Point2

class GameState:
    def __init__(self) -> None:
        # Enemy tracking
        self.enemy_units_seen: Set[UnitTypeId] = set()
        self.enemy_unit_counts: Dict[UnitTypeId, int] = {}
        self.enemy_positions: Dict[UnitTypeId, list[Point2]] = {}
