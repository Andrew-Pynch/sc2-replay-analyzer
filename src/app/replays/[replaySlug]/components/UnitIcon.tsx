"use client";

import { getUnitIcon } from "~/lib/unit-icons";

interface UnitIconProps {
  unitType: string;
  actionName: string;
}

export default function UnitIcon({ unitType, actionName }: UnitIconProps) {
  return (
    <div className="w-6 h-6 relative flex-shrink-0" title={`${unitType} - ${getUnitIcon(unitType)}`}>
      <img
        src={getUnitIcon(unitType)}
        alt={unitType}
        width={24}
        height={24}
        className="rounded-sm border"
        onLoad={() => {
          console.log(`Successfully loaded icon for: ${unitType}`);
        }}
        onError={(e) => {
          console.error(`Failed to load icon for: ${unitType}, path: ${getUnitIcon(unitType)}`);
          const target = e.currentTarget as HTMLImageElement;
          target.src = "/icons/sc2/neutral/unknown.svg";
        }}
      />
    </div>
  );
}