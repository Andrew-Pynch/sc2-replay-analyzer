from dataclasses import dataclass
from typing import Optional, Union
from sc2.ids.unit_typeid import UnitTypeId
from sc2.ids.upgrade_id import UpgradeId

@dataclass
class BuildStep:
    supply: int
    action: Union[UnitTypeId, UpgradeId, str]  # Can be unit, upgrade, or special marker
    condition: Optional[str] = None  # Optional condition like "barracks_ready"

    def __str__(self):
        return f"{self.supply} - {self.action}"

# Defensive 1-1-1 build that's safe against most openings
TERRAN_SAFE_1_1_1 = [
    # === OPENING (14-22 supply) ===
    BuildStep(14, UnitTypeId.SUPPLYDEPOT),
    BuildStep(16, UnitTypeId.BARRACKS),
    BuildStep(16, UnitTypeId.REFINERY),  # Gas for tech
    BuildStep(19, UnitTypeId.ORBITALCOMMAND, "barracks_ready"),
    BuildStep(19, UnitTypeId.MARINE),  # First marine for scouting
    BuildStep(20, UnitTypeId.COMMANDCENTER),  # Natural expand
    BuildStep(21, UnitTypeId.SUPPLYDEPOT),
    BuildStep(22, UnitTypeId.MARINE),
    
    # === TECH INFRASTRUCTURE (23-35 supply) ===
    BuildStep(23, UnitTypeId.FACTORY),  # Factory for tanks/hellions
    BuildStep(23, UnitTypeId.REFINERY),  # Second gas
    BuildStep(24, UnitTypeId.MARINE),
    BuildStep(26, UnitTypeId.BUNKER, "natural_expansion"),  # Bunker at natural
    BuildStep(27, UnitTypeId.SUPPLYDEPOT),
    BuildStep(30, UnitTypeId.STARPORT, "factory_ready"),  # Starport for medivacs/vikings
    BuildStep(31, UnitTypeId.TECHLAB, "factory_ready"),  # Tech lab on factory for tanks
    BuildStep(32, UnitTypeId.MARINE),
    BuildStep(33, UnitTypeId.SUPPLYDEPOT),
    
    # === DEFENSIVE UNITS (36-50 supply) ===
    BuildStep(36, UnitTypeId.SIEGETANK, "factory_techlab"),  # First tank!
    BuildStep(38, UnitTypeId.MARINE),
    BuildStep(39, UnitTypeId.SUPPLYDEPOT),
    BuildStep(40, UnitTypeId.MEDIVAC, "starport_ready"),  # First medivac
    BuildStep(42, UnitTypeId.BARRACKS),  # Second barracks
    BuildStep(44, UnitTypeId.SIEGETANK),  # Second tank
    BuildStep(46, UnitTypeId.SUPPLYDEPOT),
    BuildStep(47, UnitTypeId.MARINE),
    BuildStep(48, UnitTypeId.MARINE),
    BuildStep(49, UnitTypeId.ENGINEERINGBAY),  # For upgrades
    
    # === DECISION POINT ===
    BuildStep(50, "STRATEGY_DECISION"),  # Time to choose our path!
]
