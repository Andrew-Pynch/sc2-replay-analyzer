#!/usr/bin/env python3
"""
Script to download StarCraft 2 unit icons from various sources
"""

import os
import sys
import json
import requests
from pathlib import Path
from urllib.parse import urljoin, urlparse
import time

# SC2 unit data organized by race
SC2_UNITS = {
    "terran": {
        # Buildings
        "CommandCenter": "command_center",
        "OrbitalCommand": "orbital_command", 
        "PlanetaryFortress": "planetary_fortress",
        "SupplyDepot": "supply_depot",
        "Barracks": "barracks",
        "Factory": "factory",
        "Starport": "starport",
        "EngineeringBay": "engineering_bay",
        "Armory": "armory",
        "Refinery": "refinery",
        "Bunker": "bunker",
        "TechLab": "tech_lab",
        "Reactor": "reactor",
        "Academy": "academy",
        "FusionCore": "fusion_core",
        "GhostAcademy": "ghost_academy",
        
        # Units
        "SCV": "scv",
        "Marine": "marine",
        "Marauder": "marauder",
        "Reaper": "reaper",
        "Ghost": "ghost",
        "Hellion": "hellion",
        "Hellbat": "hellbat",
        "WidowMine": "widow_mine",
        "Cyclone": "cyclone",
        "SiegeTank": "siege_tank",
        "Thor": "thor",
        "Medivac": "medivac",
        "Liberator": "liberator",
        "Viking": "viking",
        "Raven": "raven",
        "Banshee": "banshee",
        "Battlecruiser": "battlecruiser",
    },
    
    "protoss": {
        # Buildings
        "Nexus": "nexus",
        "Pylon": "pylon",
        "Gateway": "gateway",
        "Warpgate": "warpgate",
        "Assimilator": "assimilator",
        "Forge": "forge",
        "PhotonCannon": "photon_cannon",
        "CyberneticsCore": "cybernetics_core",
        "Stargate": "stargate",
        "Robotics": "robotics_facility",
        "RoboticsBay": "robotics_bay",
        "FleetBeacon": "fleet_beacon",
        "TemplarArchives": "templar_archives",
        "DarkShrine": "dark_shrine",
        "TwilightCouncil": "twilight_council",
        "ShieldBattery": "shield_battery",
        
        # Units
        "Probe": "probe",
        "Zealot": "zealot",
        "Stalker": "stalker",
        "Sentry": "sentry",
        "Adept": "adept",
        "HighTemplar": "high_templar",
        "DarkTemplar": "dark_templar",
        "Archon": "archon",
        "Observer": "observer",
        "Immortal": "immortal",
        "WarpPrism": "warp_prism",
        "Colossus": "colossus",
        "Disruptor": "disruptor",
        "Phoenix": "phoenix",
        "Oracle": "oracle",
        "VoidRay": "void_ray",
        "Tempest": "tempest",
        "Carrier": "carrier",
        "Mothership": "mothership",
    },
    
    "zerg": {
        # Buildings
        "Hatchery": "hatchery",
        "Lair": "lair", 
        "Hive": "hive",
        "Extractor": "extractor",
        "SpawningPool": "spawning_pool",
        "EvolutionChamber": "evolution_chamber",
        "RoachWarren": "roach_warren",
        "BanelingNest": "baneling_nest",
        "CreepTumor": "creep_tumor",
        "SpineCrawler": "spine_crawler",
        "SporeCrawler": "spore_crawler",
        "HydraliskDen": "hydralisk_den",
        "LurkerDen": "lurker_den",
        "Infestation": "infestation_pit",
        "Spire": "spire",
        "GreaterSpire": "greater_spire",
        "NydusNetwork": "nydus_network",
        "UltraliskCavern": "ultralisk_cavern",
        
        # Units
        "Larva": "larva",
        "Drone": "drone",
        "Zergling": "zergling",
        "Baneling": "baneling",
        "Queen": "queen",
        "Roach": "roach",
        "Ravager": "ravager",
        "Hydralisk": "hydralisk",
        "Lurker": "lurker",
        "Infestor": "infestor",
        "SwarmHost": "swarm_host",
        "Ultralisk": "ultralisk",
        "Overseer": "overseer",
        "Overlord": "overlord",
        "Mutalisk": "mutalisk",
        "Corruptor": "corruptor",
        "BroodLord": "brood_lord",
        "Viper": "viper",
    }
}

def create_icon_directories():
    """Create the necessary directories for icons"""
    base_path = Path("public/icons/sc2")
    
    for race in ["terran", "protoss", "zerg", "neutral"]:
        race_path = base_path / race
        race_path.mkdir(parents=True, exist_ok=True)
    
    return base_path

def download_placeholder_icons():
    """Download placeholder icons from a free icon service"""
    base_path = create_icon_directories()
    
    # Use a simple colored square generator for placeholders
    placeholder_colors = {
        "terran": "4A90E2",    # Blue
        "protoss": "F5A623",   # Gold/Yellow  
        "zerg": "7B68EE"       # Purple
    }
    
    total_units = sum(len(units) for units in SC2_UNITS.values())
    downloaded = 0
    
    print(f"Creating placeholder icons for {total_units} units...")
    
    for race, units in SC2_UNITS.items():
        race_path = base_path / race
        color = placeholder_colors[race]
        
        for unit_name, filename in units.items():
            icon_path = race_path / f"{filename}.png"
            
            if not icon_path.exists():
                # Create a simple placeholder SVG and convert to PNG concept
                # For now, we'll create text files as placeholders that can be replaced later
                placeholder_content = f"""<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" fill="#{color}" rx="8"/>
    <text x="32" y="20" text-anchor="middle" fill="white" font-size="8" font-family="Arial">
        {unit_name[:8]}
    </text>
</svg>"""
                
                # Save as SVG for now (can be converted to PNG later)
                svg_path = race_path / f"{filename}.svg"
                with open(svg_path, 'w') as f:
                    f.write(placeholder_content)
                
                downloaded += 1
                if downloaded % 10 == 0:
                    print(f"Created {downloaded}/{total_units} placeholder icons...")
                
                time.sleep(0.01)  # Small delay to be respectful
    
    print(f"Successfully created {downloaded} placeholder icons!")
    print(f"Icons saved to: {base_path}")
    return downloaded

def create_icon_mapping():
    """Create a TypeScript mapping file for the icons"""
    mapping_content = """// Auto-generated icon mapping for StarCraft 2 units
export interface UnitIconMapping {
  [key: string]: string;
}

export const UNIT_ICON_MAPPING: UnitIconMapping = {
"""
    
    # Add all units with their icon paths
    for race, units in SC2_UNITS.items():
        mapping_content += f"  // {race.capitalize()} units\n"
        for unit_name, filename in units.items():
            mapping_content += f'  "{unit_name}": "/icons/sc2/{race}/{filename}.svg",\n'
        mapping_content += "\n"
    
    mapping_content += """};

export const getRaceFromUnit = (unitName: string): string => {
"""
    
    for race, units in SC2_UNITS.items():
        unit_names = '", "'.join(units.keys())
        mapping_content += f'  if (["{unit_names}"].includes(unitName)) return "{race}";\n'
    
    mapping_content += """  return "neutral";
};

export const getUnitIcon = (unitName: string): string => {
  return UNIT_ICON_MAPPING[unitName] || "/icons/sc2/neutral/unknown.svg";
};
"""
    
    # Write the TypeScript file
    mapping_path = Path("src/lib/unit-icons.ts")
    mapping_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(mapping_path, 'w') as f:
        f.write(mapping_content)
    
    print(f"Created icon mapping file: {mapping_path}")

def main():
    """Main function"""
    print("SC2 Icon Downloader")
    print("===================")
    
    try:
        # Create placeholder icons
        download_placeholder_icons()
        
        # Create the TypeScript mapping
        create_icon_mapping()
        
        print("\n✅ Icon setup complete!")
        print("📁 Icons saved to: public/icons/sc2/")
        print("🔗 Mapping created: src/lib/unit-icons.ts")
        print("\nNote: These are placeholder SVG icons. You can replace them with")
        print("actual game icons by downloading from Liquipedia or other sources.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()