#!/bin/bash

# SC2 Replay Analyzer Test Script
# This script tests the analyzer via the API endpoint and direct Python execution

echo "🔧 SC2 Replay Analyzer Test Script"
echo "================================="

# Check if dev server is running
echo "📡 Testing API endpoint..."
API_RESPONSE=$(curl -s http://localhost:3000/api/test-analyzer 2>/dev/null)
API_EXIT_CODE=$?

if [ $API_EXIT_CODE -eq 0 ]; then
    echo "✅ API endpoint accessible"
    echo "🔍 API Response:"
    echo "$API_RESPONSE" | jq '.' 2>/dev/null || echo "$API_RESPONSE"
else
    echo "❌ API endpoint not accessible (is dev server running?)"
    echo "💡 Start with: npm run dev"
fi

echo ""
echo "🐍 Testing Python script directly..."

# Test Python script directly
REPLAY_FILE="replays/20250722 - Game1 - ByuN vs Lambo - Persephone.SC2Replay"

if [ -f "$REPLAY_FILE" ]; then
    echo "📁 Using replay: $REPLAY_FILE"
    python3 python/analyze_replay.py "$REPLAY_FILE" > /tmp/analyzer_output.json 2>&1
    PYTHON_EXIT_CODE=$?
    
    if [ $PYTHON_EXIT_CODE -eq 0 ]; then
        echo "✅ Python script executed successfully"
        echo "🔍 Python Output:"
        cat /tmp/analyzer_output.json | jq '.' 2>/dev/null || cat /tmp/analyzer_output.json
        
        # Extract key stats for quick verification
        echo ""
        echo "📊 Quick Stats Summary:"
        echo "Players:"
        cat /tmp/analyzer_output.json | jq -r '.players[]? | "  - \(.player.name) (\(.player.race)): APM=\(.player.apm), Resources=\(.player.resources_collected), Army=\(.player.army_value_max)"' 2>/dev/null
    else
        echo "❌ Python script failed"
        echo "🔍 Error output:"
        cat /tmp/analyzer_output.json
    fi
else
    echo "❌ Test replay file not found: $REPLAY_FILE"
fi

echo ""
echo "🎯 Test completed!"