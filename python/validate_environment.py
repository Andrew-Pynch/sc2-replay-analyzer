#!/usr/bin/env python3
"""
Environment validation script for SC2 Replay Analyzer

This script checks if the Python environment has all required dependencies
for replay analysis.
"""

import sys
import json
from typing import Dict, Any

def validate_environment() -> Dict[str, Any]:
    """Validate that all required packages are available"""
    validation_result = {
        "valid": True,
        "python_version": sys.version,
        "issues": [],
        "packages": {}
    }
    
    # Check Python version
    if sys.version_info < (3, 7):
        validation_result["valid"] = False
        validation_result["issues"].append("Python 3.7+ required, found " + sys.version)
    
    # Check required packages
    required_packages = [
        ("sc2reader", "1.8.0"),
    ]
    
    for package_name, min_version in required_packages:
        try:
            module = __import__(package_name)
            if hasattr(module, '__version__'):
                version = module.__version__
            else:
                version = "unknown"
            
            validation_result["packages"][package_name] = {
                "available": True,
                "version": version,
                "required": min_version
            }
            
        except ImportError as e:
            validation_result["valid"] = False
            validation_result["packages"][package_name] = {
                "available": False,
                "version": None,
                "required": min_version,
                "error": str(e)
            }
            validation_result["issues"].append(f"Missing package: {package_name}")
    
    return validation_result

def main():
    """Main entry point"""
    result = validate_environment()
    print(json.dumps(result, indent=2))
    
    if not result["valid"]:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()