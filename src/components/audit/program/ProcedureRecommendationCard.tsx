import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Clock, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { ProcedureRecommendation } from '@/types/procedures';
import { getPriorityColor } from '@/types/procedures';

interface ProcedureRecommendationCardProps {
  recommendation: ProcedureRecommendation;
  isSelected: boolean;
  onToggle: (procedureId: string) => void;
  showRiskRationale?: boolean;
}

export function ProcedureRecommendationCard({
  recommendation,
  isSelected,
  onToggle,
  showRiskRationale = true
}: ProcedureRecommendationCardProps) {
  const { procedure, priority, recommendation_reason, adjusted_hours, adjusted_sample_size, risk_areas } = recommendation;

  const priorityIcon = priority === 'required' ? (
    <AlertCircle className="h-4 w-4 text-red-600" />
  ) : priority === 'recommended' ? (
    <CheckCircle2 className="h-4 w-4 text-blue-600" />
  ) : (
    <Info className="h-4 w-4 text-gray-600" />
  );

  return (
    <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            id={procedure.id}
            checked={isSelected}
            onCheckedChange={() => onToggle(procedure.id)}
            className="mt-1"
          />

          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <label
                  htmlFor={procedure.id}
                  className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                >
                  {procedure.procedure_name}
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {procedure.procedure_code}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={getPriorityColor(priority)}>
                  <span className="flex items-center gap-1">
                    {priorityIcon}
                    {priority.toUpperCase()}
                  </span>
                </Badge>
              </div>
            </div>

            {/* Risk Rationale */}
            {showRiskRationale && recommendation_reason && (
              <div className="bg-muted/50 rounded-md p-3 space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  Why this procedure?
                </p>
                <p className="text-sm text-muted-foreground">{recommendation_reason}</p>

                {risk_areas && risk_areas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {risk_areas.map((area, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Procedure Details */}
            {procedure.objective && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Objective:</p>
                <p className="text-sm">{procedure.objective}</p>
              </div>
            )}

            <Separator />

            {/* Adjusted Parameters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Estimated Hours</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">
                    {adjusted_hours || procedure.estimated_hours}h
                  </span>
                  {adjusted_hours && adjusted_hours !== procedure.estimated_hours && (
                    <span className="text-xs text-muted-foreground line-through">
                      {procedure.estimated_hours}h
                    </span>
                  )}
                </div>
              </div>

              {adjusted_sample_size && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Sample Size</p>
                  <p className="text-sm font-medium">{adjusted_sample_size}</p>
                </div>
              )}
            </div>

            {/* Industry Specific */}
            {recommendation.is_industry_specific && (
              <Badge variant="outline" className="text-xs">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Industry-Specific
                </span>
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
