import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, X, CheckCircle2, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useProcedures } from '@/hooks/useProcedures';

interface ProgramBuilderWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementId: string;
  onSuccess?: () => void;
}

interface SelectedProcedure {
  id: string;
  procedure_code: string;
  procedure_name: string;
  category: string;
  estimated_hours: number | null;
  defaultAssignee?: string;
  requiresReview: boolean;
}

function SortableProcedureItem({ procedure, onRemove }: { procedure: SelectedProcedure; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: procedure.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-background border rounded-lg hover:bg-accent/50 transition-colors"
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{procedure.procedure_code}</span>
          <Badge variant="outline" className="text-xs">{procedure.category}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{procedure.procedure_name}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {procedure.estimated_hours && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {procedure.estimated_hours}h
            </span>
          )}
          {procedure.requiresReview && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Requires Review
            </span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function ProgramBuilderWizard({ open, onOpenChange, engagementId, onSuccess }: ProgramBuilderWizardProps) {
  const { procedures = [], isLoading } = useProcedures();
  const [step, setStep] = useState(1);
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcedures, setSelectedProcedures] = useState<SelectedProcedure[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get unique categories
  const categories = Array.from(new Set(procedures.map(p => p.category)));

  // Filter available procedures
  const availableProcedures = procedures.filter(proc => {
    const isNotSelected = !selectedProcedures.find(sp => sp.id === proc.id);
    const matchesCategory = selectedCategory === 'all' || proc.category === selectedCategory;
    const matchesSearch = proc.procedure_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proc.procedure_code.toLowerCase().includes(searchTerm.toLowerCase());
    return isNotSelected && matchesCategory && matchesSearch;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedProcedures((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addProcedure = (proc: any) => {
    setSelectedProcedures([...selectedProcedures, {
      id: proc.id,
      procedure_code: proc.procedure_code,
      procedure_name: proc.procedure_name,
      category: proc.category,
      estimated_hours: proc.estimated_hours,
      requiresReview: true,
    }]);
  };

  const removeProcedure = (id: string) => {
    setSelectedProcedures(selectedProcedures.filter(p => p.id !== id));
  };

  const handleNext = () => {
    if (step === 1 && (!programName || !programDescription)) {
      toast.error('Please provide program name and description');
      return;
    }
    if (step === 2 && selectedProcedures.length === 0) {
      toast.error('Please select at least one procedure');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      // Here you would create the engagement program and procedures
      toast.success('Program created successfully');
      onSuccess?.();
      onOpenChange(false);
      
      // Reset state
      setStep(1);
      setProgramName('');
      setProgramDescription('');
      setSelectedProcedures([]);
    } catch (error) {
      toast.error('Failed to create program');
    }
  };

  const totalEstimatedHours = selectedProcedures.reduce((sum, p) => sum + (p.estimated_hours || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Build Audit Program</DialogTitle>
          <DialogDescription>
            Step {step} of 3: {step === 1 ? 'Program Details' : step === 2 ? 'Select & Order Procedures' : 'Review & Configure'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Step 1: Program Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="programName">Program Name</Label>
                <Input
                  id="programName"
                  placeholder="e.g., SOC 2 Type II Audit Program"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="programDescription">Description</Label>
                <Textarea
                  id="programDescription"
                  placeholder="Describe the purpose and scope of this audit program..."
                  value={programDescription}
                  onChange={(e) => setProgramDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <Label>Program Type</Label>
                <Select defaultValue="compliance">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compliance">Compliance Audit</SelectItem>
                    <SelectItem value="financial">Financial Audit</SelectItem>
                    <SelectItem value="operational">Operational Audit</SelectItem>
                    <SelectItem value="it">IT Audit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Select & Order Procedures */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-4 h-[500px]">
              {/* Available Procedures */}
              <div className="flex flex-col">
                <h3 className="font-semibold mb-3">Available Procedures</h3>
                <div className="space-y-2 mb-3">
                  <Input
                    placeholder="Search procedures..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ScrollArea className="flex-1 border rounded-lg p-2">
                  <div className="space-y-2">
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading procedures...</div>
                    ) : availableProcedures.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No procedures available</div>
                    ) : (
                      availableProcedures.map(proc => (
                        <div
                          key={proc.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{proc.procedure_code}</span>
                              <Badge variant="outline" className="text-xs">{proc.category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{proc.procedure_name}</p>
                            {proc.estimated_hours && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {proc.estimated_hours}h
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addProcedure(proc)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Selected Procedures (Drag & Drop) */}
              <div className="flex flex-col">
                <h3 className="font-semibold mb-3">
                  Program Procedures ({selectedProcedures.length})
                </h3>
                <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Procedures:</span>
                      <span className="font-medium">{selectedProcedures.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. Total Hours:</span>
                      <span className="font-medium">{totalEstimatedHours}h</span>
                    </div>
                  </div>
                </div>
                <ScrollArea className="flex-1 border rounded-lg p-2">
                  {selectedProcedures.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Plus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Drag procedures here or click + to add</p>
                    </div>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={selectedProcedures.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {selectedProcedures.map((proc) => (
                            <SortableProcedureItem
                              key={proc.id}
                              procedure={proc}
                              onRemove={() => removeProcedure(proc.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Step 3: Review & Configure */}
          {step === 3 && (
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Program Summary</h3>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Name:</span>
                      <p className="font-medium">{programName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Description:</span>
                      <p className="text-sm">{programDescription}</p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Procedures:</span>
                        <p className="font-semibold text-lg">{selectedProcedures.length}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Est. Hours:</span>
                        <p className="font-semibold text-lg">{totalEstimatedHours}h</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Require Review:</span>
                        <p className="font-semibold text-lg">
                          {selectedProcedures.filter(p => p.requiresReview).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Procedure Configuration</h3>
                  <div className="space-y-2">
                    {selectedProcedures.map((proc, index) => (
                      <div key={proc.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{index + 1}</Badge>
                              <span className="font-medium">{proc.procedure_code}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{proc.procedure_name}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">{proc.category}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Default Assignee Role</Label>
                            <Select defaultValue="staff_auditor">
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="senior_auditor">Senior Auditor</SelectItem>
                                <SelectItem value="staff_auditor">Staff Auditor</SelectItem>
                                <SelectItem value="engagement_manager">Manager</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Est. Hours</Label>
                            <Input
                              type="number"
                              defaultValue={proc.estimated_hours || 0}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                Create Program
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
