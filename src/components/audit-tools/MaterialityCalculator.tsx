/**
 * MaterialityCalculator Component
 * AU-C 320 compliant materiality calculator for financial statement audits
 * Issue #6: Materiality Calculator
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  useMaterialityCalculation,
  useSaveMateriality,
  useIndustryGuidance,
  useMaterialityHistory,
  useApproveMateriality,
} from '@/hooks/useMateriality';
import type { BenchmarkType, MaterialityFormData, RiskLevel } from '@/types/materiality';
import { Calculator, Save, CheckCircle, History, Info, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';

interface MaterialityCalculatorProps {
  engagementId: string;
  firmId: string;
  industry?: string;
  clientName: string;
}

const BENCHMARK_TYPES: { value: BenchmarkType; label: string }[] = [
  { value: 'revenue', label: 'Revenue/Sales' },
  { value: 'total_assets', label: 'Total Assets' },
  { value: 'net_income', label: 'Net Income' },
  { value: 'equity', label: 'Total Equity' },
  { value: 'expenses', label: 'Total Expenses' },
];

const INDUSTRIES = [
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'wholesale', label: 'Wholesale Distribution' },
  { value: 'financial_services', label: 'Financial Services' },
  { value: 'banking', label: 'Banking' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'technology', label: 'Technology' },
  { value: 'saas', label: 'SaaS/Software' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' },
];

export function MaterialityCalculator({
  engagementId,
  firmId,
  industry: defaultIndustry,
  clientName,
}: MaterialityCalculatorProps) {
  const { data: currentMateriality, isLoading } = useMaterialityCalculation(engagementId);
  const { data: history } = useMaterialityHistory(engagementId);
  const saveMateriality = useSaveMateriality();
  const approveMateriality = useApproveMateriality();

  // Form state
  const [formData, setFormData] = useState<MaterialityFormData>({
    benchmark_type: 'revenue',
    benchmark_value: 0,
    overall_materiality_percentage: 5.0,
    performance_materiality_percentage: 75.0,
    clearly_trivial_percentage: 5.0,
    industry: defaultIndustry || 'other',
    risk_level: 'medium',
  });

  // Calculated values
  const [calculatedValues, setCalculatedValues] = useState({
    overallMateriality: 0,
    performanceMateriality: 0,
    clearlyTrivial: 0,
  });

  // Get industry guidance
  const { data: guidance } = useIndustryGuidance(
    formData.industry || 'other',
    formData.benchmark_type
  );

  // Load existing materiality if available
  useEffect(() => {
    if (currentMateriality) {
      setFormData({
        benchmark_type: currentMateriality.benchmark_type,
        benchmark_value: currentMateriality.benchmark_value,
        benchmark_year: currentMateriality.benchmark_year,
        overall_materiality_percentage: currentMateriality.overall_materiality_percentage,
        performance_materiality_percentage: currentMateriality.performance_materiality_percentage,
        clearly_trivial_percentage: currentMateriality.clearly_trivial_percentage,
        benchmark_rationale: currentMateriality.benchmark_rationale,
        percentage_rationale: currentMateriality.percentage_rationale,
        additional_notes: currentMateriality.additional_notes,
        industry: currentMateriality.industry,
        risk_level: currentMateriality.risk_level,
        component_materiality: currentMateriality.component_materiality,
      });
    }
  }, [currentMateriality]);

  // Recalculate when inputs change
  useEffect(() => {
    const overall =
      (formData.benchmark_value * formData.overall_materiality_percentage) / 100;
    const performance = (overall * formData.performance_materiality_percentage) / 100;
    const trivial = (overall * formData.clearly_trivial_percentage) / 100;

    setCalculatedValues({
      overallMateriality: overall,
      performanceMateriality: performance,
      clearlyTrivial: trivial,
    });
  }, [
    formData.benchmark_value,
    formData.overall_materiality_percentage,
    formData.performance_materiality_percentage,
    formData.clearly_trivial_percentage,
  ]);

  const handleSave = async () => {
    await saveMateriality.mutateAsync({
      engagementId,
      firmId,
      formData,
    });
  };

  const handleApprove = async () => {
    if (currentMateriality) {
      await approveMateriality.mutateAsync({
        materialityId: currentMateriality.id,
        engagementId,
      });
    }
  };

  const applyGuidance = () => {
    if (guidance) {
      setFormData((prev) => ({
        ...prev,
        overall_materiality_percentage: guidance.recommended_overall_percentage,
        performance_materiality_percentage: guidance.recommended_performance_percentage,
        clearly_trivial_percentage: guidance.recommended_trivial_percentage,
      }));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading materiality calculator...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Materiality Calculator
              </CardTitle>
              <CardDescription>
                Calculate audit materiality per AU-C Section 320 for {clientName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {currentMateriality?.approved_at && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              )}
              {history && history.length > 1 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <History className="h-4 w-4 mr-2" />
                      Version {currentMateriality?.version || 1}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Materiality Calculation History</DialogTitle>
                      <DialogDescription>
                        View all versions of materiality calculations for this engagement
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {history.map((calc) => (
                        <Card key={calc.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">Version {calc.version}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(calc.created_at), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                              {calc.is_current && (
                                <Badge variant="default">Current</Badge>
                              )}
                            </div>
                            <Separator className="my-4" />
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Overall Materiality</p>
                                <p className="font-semibold">
                                  ${calc.overall_materiality.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Performance Materiality</p>
                                <p className="font-semibold">
                                  ${calc.performance_materiality.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Benchmark</p>
                                <p className="font-medium capitalize">
                                  {calc.benchmark_type.replace('_', ' ')}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Benchmark Value</p>
                                <p className="font-medium">
                                  ${calc.benchmark_value.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Select Benchmark</CardTitle>
              <CardDescription>
                Choose the financial statement benchmark for calculating materiality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, industry: value }))
                    }
                  >
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind.value} value={ind.value}>
                          {ind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="benchmark-type">Benchmark Type</Label>
                  <Select
                    value={formData.benchmark_type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, benchmark_type: value as BenchmarkType }))
                    }
                  >
                    <SelectTrigger id="benchmark-type">
                      <SelectValue placeholder="Select benchmark" />
                    </SelectTrigger>
                    <SelectContent>
                      {BENCHMARK_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="benchmark-value">Benchmark Value ($)</Label>
                  <Input
                    id="benchmark-value"
                    type="number"
                    value={formData.benchmark_value}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        benchmark_value: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="benchmark-year">Fiscal Year (optional)</Label>
                  <Input
                    id="benchmark-year"
                    type="number"
                    value={formData.benchmark_year || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        benchmark_year: parseInt(e.target.value) || undefined,
                      }))
                    }
                    placeholder="2024"
                  />
                </div>
              </div>

              {guidance && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-1">Industry Guidance</p>
                    <p className="text-sm">{guidance.rationale}</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="px-0 mt-2"
                      onClick={applyGuidance}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Apply recommended percentages
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="benchmark-rationale">Benchmark Rationale</Label>
                <Textarea
                  id="benchmark-rationale"
                  value={formData.benchmark_rationale || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, benchmark_rationale: e.target.value }))
                  }
                  placeholder="Explain why this benchmark was selected..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 2: Set Percentages</CardTitle>
              <CardDescription>
                Define materiality percentages based on risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="overall-pct">Overall Materiality %</Label>
                  <Input
                    id="overall-pct"
                    type="number"
                    step="0.1"
                    value={formData.overall_materiality_percentage}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        overall_materiality_percentage: parseFloat(e.target.value) || 0,
                      }))
                    }
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground">Typical: 0.5-5%</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="performance-pct">Performance Materiality %</Label>
                  <Input
                    id="performance-pct"
                    type="number"
                    step="1"
                    value={formData.performance_materiality_percentage}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        performance_materiality_percentage: parseFloat(e.target.value) || 0,
                      }))
                    }
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground">Typical: 50-75%</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trivial-pct">Clearly Trivial %</Label>
                  <Input
                    id="trivial-pct"
                    type="number"
                    step="0.1"
                    value={formData.clearly_trivial_percentage}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clearly_trivial_percentage: parseFloat(e.target.value) || 0,
                      }))
                    }
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground">Typical: 3-5%</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="risk-level">Risk Level</Label>
                <Select
                  value={formData.risk_level}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, risk_level: value as RiskLevel }))
                  }
                >
                  <SelectTrigger id="risk-level">
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage-rationale">Percentage Rationale</Label>
                <Textarea
                  id="percentage-rationale"
                  value={formData.percentage_rationale || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, percentage_rationale: e.target.value }))
                  }
                  placeholder="Document why these percentages were selected..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional-notes">Additional Notes</Label>
                <Textarea
                  id="additional-notes"
                  value={formData.additional_notes || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, additional_notes: e.target.value }))
                  }
                  placeholder="Any other considerations or documentation..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calculated Materiality</CardTitle>
              <CardDescription>
                Based on your inputs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Overall Materiality</p>
                <p className="text-3xl font-bold">
                  ${calculatedValues.overallMateriality.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formData.overall_materiality_percentage}% of {formData.benchmark_type.replace('_', ' ')}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Performance Materiality</p>
                <p className="text-2xl font-semibold">
                  ${calculatedValues.performanceMateriality.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formData.performance_materiality_percentage}% of overall materiality
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Clearly Trivial Threshold</p>
                <p className="text-2xl font-semibold">
                  ${calculatedValues.clearlyTrivial.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formData.clearly_trivial_percentage}% of overall materiality
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <p className="font-medium mb-1">Professional Guidance</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Overall materiality: Financial statements as a whole</li>
                      <li>Performance materiality: Reduces aggregation risk</li>
                      <li>Clearly trivial: Accumulation threshold</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saveMateriality.isPending}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveMateriality.isPending ? 'Saving...' : 'Save Materiality'}
                </Button>

                {currentMateriality && !currentMateriality.approved_at && (
                  <Button
                    variant="outline"
                    onClick={handleApprove}
                    disabled={approveMateriality.isPending}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
