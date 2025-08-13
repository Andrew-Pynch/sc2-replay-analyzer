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


def extract_build_order(player, max_actions: int = 15) -> List[Dict[str, Any]]:
    """Extract build order from player events"""
    build_actions = []
    action_count = 0
    
    # Get relevant events from the player
    for event in player.events:
        if action_count >= max_actions:
            break
            
        action_name = None
        timestamp = event.second if hasattr(event, 'second') else 0
        
        # Check different event types and extract meaningful build actions
        if hasattr(event, 'unit') and hasattr(event.unit, 'name'):
            if event.name in ['UnitBornEvent', 'UnitInitEvent']:
                action_name = f"Build {event.unit.name}"
            elif event.name == 'UnitDiedEvent' and hasattr(event, 'killer'):
                # Skip death events for build order
                continue
                
        elif hasattr(event, 'ability') and hasattr(event.ability, 'name'):
            if 'Train' in event.ability.name or 'Build' in event.ability.name:
                action_name = event.ability.name.replace('Train', 'Train ').replace('Build', 'Build ')
                
        elif hasattr(event, 'upgrade') and hasattr(event.upgrade, 'name'):
            if event.name == 'UpgradeCompleteEvent':
                action_name = f"Upgrade {event.upgrade.name}"
        
        if action_name and timestamp > 0:
            build_actions.append({
                "action_name": action_name,
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
            "players": players_data
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