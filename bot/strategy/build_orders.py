from dataclasses import dataclass
from typing import List
from sc2.ids.unit_typeid import UnitTypeId

@dataclass
class BuildStep:
    supply: int
    action: UnitTypeId
    condition: str | None = None

TERRAN_1RAX_FE = [
    BuildStep(14, UnitTypeId.SUPPLYDEPOT),
    BuildStep(16, UnitTypeId.BARRACKS),
    BuildStep(16, UnitTypeId.REFINERY),
    BuildStep(19, UnitTypeId.ORBITALCOMMAND, "barracks_ready"),
    BuildStep(20, UnitTypeId.COMMANDCENTER),  # Expand
    BuildStep(21, UnitTypeId.MARINE),
    BuildStep(22, UnitTypeId.SUPPLYDEPOT),
]
