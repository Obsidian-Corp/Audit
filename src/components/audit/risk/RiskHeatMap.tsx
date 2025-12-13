// Risk Heat Map Component
// Phase 1: Foundation - Visual risk representation

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RiskAreaAssessment, RiskLevel } from '@/types/risk-assessment';
import { getRiskColor, RISK_LEVELS } from '@/types/risk-assessment';

interface RiskHeatMapProps {
  riskAreas: RiskAreaAssessment[];
  onAreaClick?: (area: RiskAreaAssessment) => void;
  highlightMaterialAreas?: boolean;
}

export const RiskHeatMap: React.FC<RiskHeatMapProps> = ({
  riskAreas,
  onAreaClick,
  highlightMaterialAreas = true
}) => {
  const materialAreas = riskAreas.filter(area => area.is_material_area);

  // Group areas by combined risk level
  const areasByRisk = {
    significant: materialAreas.filter(a => a.combined_risk === 'significant'),
    high: materialAreas.filter(a => a.combined_risk === 'high'),
    medium: materialAreas.filter(a => a.combined_risk === 'medium'),
    low: materialAreas.filter(a => a.combined_risk === 'low')
  };

  // Calculate statistics
  const stats = {
    total: materialAreas.length,
    significant: areasByRisk.significant.length,
    high: areasByRisk.high.length,
    medium: areasByRisk.medium.length,
    low: areasByRisk.low.length
  };

  const getRiskLevelColor = (level: RiskLevel): string => {
    const colors = {
      low: 'bg-green-100 border-green-300',
      medium: 'bg-yellow-100 border-yellow-300',
      high: 'bg-orange-100 border-orange-300',
      significant: 'bg-red-100 border-red-300'
    };
    return colors[level];
  };

  const getRiskTextColor = (level: RiskLevel): string => {
    const colors = {
      low: 'text-green-800',
      medium: 'text-yellow-800',
      high: 'text-orange-800',
      significant: 'text-red-800'
    };
    return colors[level];
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Summary</CardTitle>
          <CardDescription>
            Distribution of risk across {stats.total} material financial statement areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.significant}</div>
              <div className="text-sm text-gray-600">Significant</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.high}</div>
              <div className="text-sm text-gray-600">High</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.medium}</div>
              <div className="text-sm text-gray-600">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.low}</div>
              <div className="text-sm text-gray-600">Low</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Heat Map Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Heat Map</CardTitle>
          <CardDescription>
            Click on any area to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {RISK_LEVELS.slice().reverse().map(({ value: riskLevel, label }) => {
              const areas = areasByRisk[riskLevel as keyof typeof areasByRisk];

              if (areas.length === 0) return null;

              return (
                <div key={riskLevel} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={riskLevel === 'significant' || riskLevel === 'high' ? 'destructive' : 'outline'}>
                      {label} Risk
                    </Badge>
                    <span className="text-sm text-gray-500">({areas.length} areas)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {areas.map((area) => (
                      <div
                        key={area.id}
                        onClick={() => onAreaClick?.(area)}
                        className={`
                          p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${getRiskLevelColor(riskLevel as RiskLevel)}
                          hover:shadow-md hover:scale-105
                        `}
                      >
                        <div className={`font-semibold ${getRiskTextColor(riskLevel as RiskLevel)}`}>
                          {area.area_name}
                        </div>
                        {area.risk_rationale && (
                          <div className="text-xs mt-2 text-gray-600 line-clamp-2">
                            {area.risk_rationale}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                          <span>I: {area.inherent_risk}</span>
                          <span>|</span>
                          <span>C: {area.control_risk}</span>
                        </div>
                        {area.key_risk_factors && area.key_risk_factors.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {area.key_risk_factors.slice(0, 2).map((factor, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white/50"
                              >
                                {factor}
                              </span>
                            ))}
                            {area.key_risk_factors.length > 2 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white/50">
                                +{area.key_risk_factors.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {materialAreas.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No risk areas have been assessed yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Matrix Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Risk Matrix Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">I:</span> Inherent Risk (risk before controls)
            </div>
            <div>
              <span className="font-semibold">C:</span> Control Risk (risk controls won't prevent/detect)
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {RISK_LEVELS.map(({ value, label, color }) => (
                <div key={value} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${getRiskLevelColor(value)}`} />
                  <span>{label} Risk</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskHeatMap;
