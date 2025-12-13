import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AuditProcedure } from '@/hooks/useProcedures';
import { Clock, Target, AlertCircle, CheckCircle2, FileText, Edit } from 'lucide-react';

interface ProcedureDetailDialogProps {
  procedure: AuditProcedure | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export function ProcedureDetailDialog({
  procedure,
  open,
  onOpenChange,
  onEdit,
}: ProcedureDetailDialogProps) {
  if (!procedure) return null;

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const renderInstructions = () => {
    if (!procedure.instructions) return null;

    try {
      // Handle Tiptap JSON format
      if (typeof procedure.instructions === 'object' && procedure.instructions.type === 'doc') {
        const content = procedure.instructions.content || [];
        return (
          <div className="space-y-2">
            {content.map((node: any, idx: number) => {
              if (node.type === 'paragraph') {
                return (
                  <p key={idx} className="text-sm">
                    {node.content?.map((c: any) => c.text).join('') || ''}
                  </p>
                );
              }
              if (node.type === 'heading') {
                const level = node.attrs?.level || 1;
                const Tag = `h${level}` as keyof JSX.IntrinsicElements;
                return (
                  <Tag key={idx} className="font-semibold">
                    {node.content?.map((c: any) => c.text).join('') || ''}
                  </Tag>
                );
              }
              return null;
            })}
          </div>
        );
      }

      // Fallback for plain text
      return <p className="text-sm">{String(procedure.instructions)}</p>;
    } catch (e) {
      return <p className="text-sm text-muted-foreground">Instructions not available</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {procedure.procedure_code}
                </Badge>
                <Badge variant={getRiskBadgeColor(procedure.risk_level)}>
                  {procedure.risk_level.toUpperCase()} RISK
                </Badge>
                <Badge variant="secondary">
                  {procedure.category.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <DialogTitle className="text-2xl">{procedure.procedure_name}</DialogTitle>
              {procedure.objective && (
                <DialogDescription className="text-base">
                  {procedure.objective}
                </DialogDescription>
              )}
            </div>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Estimated Time</p>
                  <p className="text-lg font-semibold">{procedure.estimated_hours}h</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                <Target className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-lg font-semibold capitalize">
                    {procedure.procedure_type}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Instructions */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Step-by-Step Instructions
              </h4>
              <div className="prose prose-sm max-w-none">
                {renderInstructions()}
              </div>
            </div>

            {/* Sample Size Guidance */}
            {procedure.sample_size_guidance && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Sample Size Guidance
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {procedure.sample_size_guidance}
                  </p>
                </div>
              </>
            )}

            {/* Evidence Requirements */}
            {procedure.evidence_requirements && Array.isArray(procedure.evidence_requirements) && procedure.evidence_requirements.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Evidence Requirements
                  </h4>
                  <ul className="space-y-2">
                    {procedure.evidence_requirements.map((req: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <span>{typeof req === 'string' ? req : req.description || 'Evidence item'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Expected Outcomes */}
            {procedure.expected_outcomes && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Expected Outcomes
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {procedure.expected_outcomes}
                  </p>
                </div>
              </>
            )}

            {/* Control Objectives */}
            {procedure.control_objectives && Array.isArray(procedure.control_objectives) && procedure.control_objectives.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3">Control Objectives</h4>
                  <div className="flex flex-wrap gap-2">
                    {procedure.control_objectives.map((obj: any, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {typeof obj === 'string' ? obj : obj.code || 'Objective'}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
