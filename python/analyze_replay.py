#!/usr/bin/env python3
"""
SC2 Replay Analyzer Script

This script parses StarCraft II replay files and extracts game information,
player statistics, and build orders using sc2reader library.

Usage: python analyze_replay.py <replay_file_path>
"""

import sys
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

try:
    import sc2reader
except ImportError:
    print(json.dumps({"error": "sc2reader not installed. Run: pip install sc2reader"}))
    sys.exit(1)


def format_timestamp(seconds: int) -> str:
    """Convert seconds to MM:SS format"""
    minutes = seconds // 60
    seconds = seconds % 60
    return f"{minutes:02d}:{seconds:02d}"


def extract_time_series(replay) -> List[Dict[str, Any]]:
    """Extract time series data showing units and buildings positions at 0.1-second intervals"""
    time_series = []
    
    if not hasattr(replay, 'tracker_events'):
        return time_series
        
    # Get game duration in seconds with higher precision
    duration = replay.game_length.total_seconds() if hasattr(replay, 'game_length') else 0
    
    # Track active units by ID with position history and velocity
    active_units = {}  # unit_id -> {type, x, y, control_pid, is_building, last_update, vx, vy}
    
    # Initialize snapshots for each 0.1 second (10 FPS)
    interval = 0.1
    current_time = 0.0
    while current_time <= duration:
        snapshot = {
            "timestamp": round(current_time, 1),
            "players": {}
        }
        
        # Initialize player data using control_pid
        for player in replay.players:
            if hasattr(player, 'result') and player.result != 'Unknown':
                snapshot["players"][str(player.pid)] = {
                    "name": player.name,
                    "race": player.pick_race if hasattr(player, 'pick_race') else player.play_race,
                    "team": player.team_id if hasattr(player, 'team_id') else 0,
                    "units": [],
                    "buildings": []
                }
        
        time_series.append(snapshot)
        current_time += interval
    
    # Track units created/destroyed at each timestamp using decimal precision
    unit_changes_by_time = {}  # snapshot_index -> {created: [], destroyed: []}
    
    # Process tracker events to build unit lifecycle data
    for event in replay.tracker_events:
        if not hasattr(event, 'second'):
            continue
            
        event_time = float(event.second)
        if event_time < 0 or event_time > duration:
            continue
            
        # Find closest snapshot index
        snapshot_index = int(event_time / interval)
        if snapshot_index >= len(time_series):
            continue
            
        if snapshot_index not in unit_changes_by_time:
            unit_changes_by_time[snapshot_index] = {"created": [], "destroyed": []}
        
        # Handle unit creation events
        if event.name in ['UnitBornEvent', 'UnitInitEvent'] and hasattr(event, 'unit'):
            if hasattr(event, 'control_pid') and event.control_pid in [1, 2]:
                unit_name = event.unit.name if hasattr(event.unit, 'name') else "Unknown"
                if is_game_unit(unit_name):
                    unit_id = event.unit_id if hasattr(event, 'unit_id') else None
                    if unit_id:
                        # Store unit data in active_units
                        active_units[unit_id] = {
                            "type": unit_name,
                            "x": event.x if hasattr(event, 'x') else 0,
                            "y": event.y if hasattr(event, 'y') else 0,
                            "control_pid": event.control_pid,
                            "is_building": is_building(unit_name),
                            "last_update": event_time,
                            "vx": 0.0,
                            "vy": 0.0
                        }
                        unit_changes_by_time[snapshot_index]["created"].append(unit_id)
        
        # Handle unit death events
        elif event.name == 'UnitDiedEvent' and hasattr(event, 'unit_id'):
            unit_id = event.unit_id
            if unit_id in active_units:
                unit_changes_by_time[snapshot_index]["destroyed"].append(unit_id)
        
        # Handle position update events with velocity calculation
        elif event.name == 'UnitPositionsEvent' and hasattr(event, 'units'):
            for unit_obj, (x, y) in event.units.items():
                # Extract unit ID from unit object
                unit_id = None
                if hasattr(unit_obj, 'id'):
                    unit_id = unit_obj.id
                elif hasattr(unit_obj, 'unit_id'):
                    unit_id = unit_obj.unit_id
                
                if unit_id and unit_id in active_units:
                    unit_info = active_units[unit_id]
                    old_x, old_y = unit_info["x"], unit_info["y"]
                    time_delta = event_time - unit_info["last_update"]
                    
                    # Calculate velocity if enough time has passed
                    if time_delta > 0.01:  # Avoid division by very small numbers
                        unit_info["vx"] = (x - old_x) / time_delta
                        unit_info["vy"] = (y - old_y) / time_delta
                    
                    unit_info["x"] = x
                    unit_info["y"] = y
                    unit_info["last_update"] = event_time
    
    # Build snapshots progressively
    current_active_units = {}
    
    for snapshot_idx, snapshot in enumerate(time_series):
        # Apply changes for this timestamp
        if snapshot_idx in unit_changes_by_time:
            changes = unit_changes_by_time[snapshot_idx]
            
            # Add newly created units
            for unit_id in changes["created"]:
                if unit_id in active_units:
                    current_active_units[unit_id] = active_units[unit_id].copy()
            
            # Remove destroyed units
            for unit_id in changes["destroyed"]:
                if unit_id in current_active_units:
                    del current_active_units[unit_id]
        
        # Populate snapshot with current active units
        for unit_id, unit_info in current_active_units.items():
            player_id = str(unit_info["control_pid"])
            if player_id in snapshot["players"]:
                unit_data = {
                    "type": unit_info["type"],
                    "x": unit_info["x"],
                    "y": unit_info["y"],
                    "unit_id": unit_id,
                    "vx": unit_info.get("vx", 0.0),
                    "vy": unit_info.get("vy", 0.0)
                }
                
                if unit_info["is_building"]:
                    snapshot["players"][player_id]["buildings"].append(unit_data)
                else:
                    snapshot["players"][player_id]["units"].append(unit_data)
    
    return time_series


def is_game_unit(unit_type: str) -> bool:
    """Determine if a unit type is a real game unit (not UI elements or map features)"""
    excluded_prefixes = [
        'Beacon', 'Mineral', 'Vespene', 'XelNaga', 'Destructible', 
        'Acceleration', 'Collapsible', 'Purifier', 'Rock'
    ]
    
    return not any(unit_type.startswith(prefix) for prefix in excluded_prefixes)


def is_building(unit_type: str) -> bool:
    """Determine if a unit type is a building"""
    buildings = {
        # Terran buildings
        "CommandCenter", "OrbitalCommand", "PlanetaryFortress", "SupplyDepot", 
        "Barracks", "Factory", "Starport", "EngineeringBay", "Armory", "Refinery", 
        "Bunker", "MissileTurret", "SensorTower", "TechLab", "Reactor", "Academy", 
        "FusionCore", "GhostAcademy",
        
        # Protoss buildings
        "Nexus", "Pylon", "Gateway", "Warpgate", "Assimilator", "Forge", 
        "PhotonCannon", "CyberneticsCore", "Stargate", "Robotics", "RoboticsBay", 
        "FleetBeacon", "TemplarArchives", "DarkShrine", "TwilightCouncil", "ShieldBattery",
        
        # Zerg buildings
        "Hatchery", "Lair", "Hive", "Extractor", "SpawningPool", "EvolutionChamber", 
        "RoachWarren", "BanelingNest", "CreepTumor", "SpineCrawler", "SporeCrawler", 
        "HydraliskDen", "LurkerDen", "LurkerDenMP", "Infestation", "InfestationPit", 
        "Spire", "GreaterSpire", "NydusNetwork", "NydusCanal", "UltraliskCavern"
    }
    return unit_type in buildings


def extract_build_order(player, max_actions: int = None) -> List[Dict[str, Any]]:
    """Extract build order from player events"""
    build_actions = []
    action_count = 0
    
    # Get relevant events from the player
    for event in player.events:
        if max_actions and action_count >= max_actions:
            break
            
        action_name = None
        unit_type = None
        timestamp = event.second if hasattr(event, 'second') else 0
        
        # Check different event types and extract meaningful build actions
        if hasattr(event, 'unit') and hasattr(event.unit, 'name'):
            if event.name in ['UnitBornEvent', 'UnitInitEvent']:
                action_name = f"Build {event.unit.name}"
                unit_type = event.unit.name
            elif event.name == 'UnitDoneEvent':
                action_name = f"Complete {event.unit.name}"
                unit_type = event.unit.name
            elif event.name == 'UnitDiedEvent' and hasattr(event, 'killer'):
                # Skip death events for build order
                continue
                
        elif hasattr(event, 'ability') and hasattr(event.ability, 'name'):
            ability_name = event.ability.name
            if 'Train' in ability_name:
                # Extract unit name from ability (e.g., "TrainMarine" -> "Marine")
                unit_name = ability_name.replace('Train', '')
                action_name = f"Train {unit_name}"
                unit_type = unit_name
            elif 'Build' in ability_name:
                # Extract building name from ability (e.g., "BuildSupplyDepot" -> "SupplyDepot")
                building_name = ability_name.replace('Build', '')
                action_name = f"Build {building_name}"
                unit_type = building_name
            elif 'Research' in ability_name:
                # Extract research name from ability
                research_name = ability_name.replace('Research', '')
                action_name = f"Research {research_name}"
                unit_type = research_name
                
        elif hasattr(event, 'upgrade') and hasattr(event.upgrade, 'name'):
            if event.name == 'UpgradeCompleteEvent':
                action_name = f"Upgrade {event.upgrade.name}"
                unit_type = event.upgrade.name
        
        if action_name and timestamp > 0:
            build_actions.append({
                "action_name": action_name,
                "unit_type": unit_type,
                "timestamp": timestamp,
                "order_index": action_count + 1,
                "formatted_time": format_timestamp(timestamp)
            })
            action_count += 1
    
    return build_actions


def analyze_replay(replay_path: str) -> Dict[str, Any]:
    """
    Analyze a single SC2 replay file and return structured data
    """
    try:
        # Validate input
        if not replay_path or not isinstance(replay_path, str):
            return {"error": "Invalid replay path provided"}
        
        # Load the replay
        if not os.path.exists(replay_path):
            return {"error": f"Replay file not found: {replay_path}"}
        
        # Check file size (basic validation)
        file_size = os.path.getsize(replay_path)
        if file_size == 0:
            return {"error": "Replay file is empty"}
        
        if file_size < 1024:  # Less than 1KB seems suspicious
            return {"error": "Replay file appears to be corrupted (too small)"}
        
        # Load replay with tracker events for proper stats extraction
        replay = sc2reader.load_replay(replay_path, load_level=4)
        
        if not replay:
            return {"error": "Failed to load replay file - possibly corrupted or unsupported format"}
        
        # Extract basic game information
        game_info = {
            "filename": os.path.basename(replay_path),
            "map_name": replay.map_name if hasattr(replay, 'map_name') else "Unknown",
            "game_version": f"{replay.release_string}" if hasattr(replay, 'release_string') else "Unknown",
            "duration": replay.game_length.total_seconds() if hasattr(replay, 'game_length') else 0,
            "played_at": int(replay.start_time.timestamp()) if hasattr(replay, 'start_time') else None,
        }
        
        # Initialize player stats tracking from tracker events
        player_stats_data = {}
        
        # Process tracker events for accurate resource and army stats
        if hasattr(replay, 'tracker_events'):
            for event in replay.tracker_events:
                # Import the event class for type checking
                try:
                    if hasattr(event, 'pid') and event.name == 'PlayerStatsEvent':
                        pid = event.pid
                        if pid not in player_stats_data:
                            player_stats_data[pid] = {
                                'minerals_collected': 0,
                                'vespene_collected': 0,
                                'units_killed_value': 0,
                                'army_value_max': 0
                            }
                        
                        stats = player_stats_data[pid]
                        
                        # Track maximum values over time
                        if hasattr(event, 'minerals_collection_rate') and hasattr(event, 'second'):
                            total_mins = event.minerals_collection_rate * event.second / 60 if event.second > 0 else 0
                            stats['minerals_collected'] = max(stats['minerals_collected'], total_mins)
                        
                        if hasattr(event, 'vespene_collection_rate') and hasattr(event, 'second'):
                            total_vesp = event.vespene_collection_rate * event.second / 60 if event.second > 0 else 0
                            stats['vespene_collected'] = max(stats['vespene_collected'], total_vesp)
                        
                        # Units killed value
                        if hasattr(event, 'minerals_killed') and hasattr(event, 'vespene_killed'):
                            killed_value = event.minerals_killed + event.vespene_killed
                            stats['units_killed_value'] = max(stats['units_killed_value'], killed_value)
                        
                        # Army value
                        if hasattr(event, 'minerals_used_current_army') and hasattr(event, 'vespene_used_current_army'):
                            army_value = event.minerals_used_current_army + event.vespene_used_current_army
                            stats['army_value_max'] = max(stats['army_value_max'], army_value)
                except:
                    # Skip events that don't match our pattern
                    pass
        
        # Extract time series data for replay visualization
        time_series = extract_time_series(replay)
        
        # Extract player information
        players_data = []
        game_minutes = game_info["duration"] / 60 if game_info["duration"] > 0 else 1
        
        for player in replay.players:
            # Skip observers
            if not hasattr(player, 'result') or player.result == 'Unknown':
                continue
                
            # Calculate APM from player events
            apm = 0
            if hasattr(player, 'events'):
                # Count Command and Selection events as actions (standard APM calculation)
                action_events = [e for e in player.events if any(x in type(e).__name__ for x in ['Command', 'Selection'])]
                apm = int(len(action_events) / game_minutes) if game_minutes > 0 else 0
                
            # Get stats from tracker events
            player_tracker_stats = player_stats_data.get(player.pid, {
                'minerals_collected': 0,
                'vespene_collected': 0,
                'units_killed_value': 0,
                'army_value_max': 0
            })
                
            # Build player stats object
            player_stats = {
                "name": player.name,
                "race": player.pick_race if hasattr(player, 'pick_race') else player.play_race,
                "team": player.team_id if hasattr(player, 'team_id') else 0,
                "result": player.result,
                "apm": apm,
                "resources_collected": int(player_tracker_stats['minerals_collected'] + player_tracker_stats['vespene_collected']),
                "units_killed": int(player_tracker_stats['units_killed_value']),
                "army_value_max": int(player_tracker_stats['army_value_max'])
            }
            
            # Extract build order
            build_order = extract_build_order(player)
            
            players_data.append({
                "player": player_stats,
                "build_order": build_order
            })
        
        return {
            "success": True,
            "game_info": game_info,
            "players": players_data,
            "time_series": time_series
        }
        
    except Exception as e:
        return {"error": f"Error analyzing replay: {str(e)}"}


def main():
    """Main entry point"""
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python analyze_replay.py <replay_file_path>"}))
        sys.exit(1)
    
    replay_path = sys.argv[1]
    result = analyze_replay(replay_path)
    
    # Output JSON to stdout for Node.js to capture
    print(json.dumps(result, indent=2))
    
    # Exit with appropriate code
    if "error" in result:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()