/**
 * ==================================================================
 * SAMPLING CALCULATOR
 * ==================================================================
 * Audit sampling calculator per AU-C 530
 * - MUS (Monetary Unit Sampling)
 * - Classical Variables Sampling
 * - Attribute Sampling
 * - Reliability factors
 * - Sample size calculations
 * - Error projection
 * ==================================================================
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Save, AlertCircle, TrendingUp, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SamplingCalculatorProps {
  engagementId?: string;
}

// Reliability factors for different confidence levels
const RELIABILITY_FACTORS: Record<string, Record<number, number>> = {
  '90': { 0: 2.31, 1: 3.89, 2: 5.33, 3: 6.69 },
  '95': { 0: 3.00, 1: 4.75, 2: 6.30, 3: 7.76 },
  '99': { 0: 4.61, 1: 6.64, 2: 8.41, 3: 10.05 },
};

export function SamplingCalculator({ engagementId }: SamplingCalculatorProps) {
  const { toast } = useToast();

  // Form state
  const [samplingMethod, setSamplingMethod] = useState<string>('MUS');
  const [account, setAccount] = useState<string>('Accounts Receivable');
  const [populationSize, setPopulationSize] = useState<string>('500');
  const [populationValue, setPopulationValue] = useState<string>('5000000');
  const [confidenceLevel, setConfidenceLevel] = useState<string>('95');
  const [expectedErrors, setExpectedErrors] = useState<string>('0');
  const [tolerableError, setTolerableError] = useState<string>('250000');
  const [expectedErrorRate, setExpectedErrorRate] = useState<string>('2');

  // Reset form to defaults
  const resetForm = () => {
    setSamplingMethod('MUS');
    setAccount('Accounts Receivable');
    setPopulationSize('500');
    setPopulationValue('5000000');
    setConfidenceLevel('95');
    setExpectedErrors('0');
    setTolerableError('250000');
    setExpectedErrorRate('2');
  };

  // MUS Calculations
  const calculateMUS = () => {
    const popValue = parseFloat(populationValue) || 0;
    const tolError = parseFloat(tolerableError) || 0;
    const expErrors = parseInt(expectedErrors) || 0;
    const conf = confidenceLevel as '90' | '95' | '99';

    if (!popValue || !tolError) return { sampleSize: 0, samplingInterval: 0 };

    const reliabilityFactor = RELIABILITY_FACTORS[conf][expErrors] || 3.0;
    const samplingInterval = Math.floor(tolError / reliabilityFactor);
    const sampleSize = Math.ceil(popValue / samplingInterval);

    return { sampleSize, samplingInterval, reliabilityFactor };
  };

  // Classical Variables Sampling
  const calculateClassical = () => {
    const popSize = parseInt(populationSize) || 0;
    const popValue = parseFloat(populationValue) || 0;
    const tolError = parseFloat(tolerableError) || 0;

    if (!popSize || !popValue || !tolError) return { sampleSize: 0 };

    // Simplified calculation using normal distribution
    const zValue = confidenceLevel === '95' ? 1.96 : confidenceLevel === '99' ? 2.58 : 1.65;
    const stdDev = popValue * 0.15; // Assumed standard deviation
    const sampleSize = Math.ceil(Math.pow((zValue * stdDev) / tolError, 2));

    return { sampleSize: Math.min(sampleSize, popSize) };
  };

  // Attribute Sampling
  const calculateAttribute = () => {
    const popSize = parseInt(populationSize) || 0;
    const expRate = parseFloat(expectedErrorRate) || 0;
    const tolRate = expRate + 5; // Tolerable rate = expected + 5%

    if (!popSize) return { sampleSize: 0 };

    // Simplified attribute sampling formula
    const conf = confidenceLevel as '90' | '95' | '99';
    const reliabilityFactor = RELIABILITY_FACTORS[conf][0] || 3.0;
    const sampleSize = Math.ceil((reliabilityFactor / (tolRate / 100)) * popSize / 100);

    return { sampleSize: Math.min(sampleSize, popSize), tolerableRate: tolRate };
  };

  // Get results based on method
  let results: any = {};
  if (samplingMethod === 'MUS') {
    results = calculateMUS();
  } else if (samplingMethod === 'classical_variables') {
    results = calculateClassical();
  } else if (samplingMethod === 'attribute') {
    results = calculateAttribute();
  }

  // Format currency
  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  // Handle save - for demo, we just show a toast
  const handleSave = () => {
    toast({
      title: 'Sampling Plan Saved',
      description: `${samplingMethod} sampling plan for ${account} saved with sample size of ${results.sampleSize}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Sampling Calculator
            </CardTitle>
            <CardDescription>Calculate audit sample sizes per AU-C 530</CardDescription>
          </div>
          <Badge variant="outline">AU-C 530</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={samplingMethod} onValueChange={setSamplingMethod}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="MUS">MUS</TabsTrigger>
            <TabsTrigger value="classical_variables">Classical</TabsTrigger>
            <TabsTrigger value="attribute">Attribute</TabsTrigger>
          </TabsList>

          {/* MUS Sampling */}
          <TabsContent value="MUS" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input value={account} onChange={(e) => setAccount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Confidence Level</Label>
                <Select value={confidenceLevel} onValueChange={setConfidenceLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90%</SelectItem>
                    <SelectItem value="95">95%</SelectItem>
                    <SelectItem value="99">99%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Population Value</Label>
                <Input
                  type="text"
                  value={populationValue}
                  onChange={(e) => setPopulationValue(e.target.value)}
                  placeholder="5,000,000"
                />
              </div>
              <div className="space-y-2">
                <Label>Tolerable Error</Label>
                <Input
                  type="text"
                  value={tolerableError}
                  onChange={(e) => setTolerableError(e.target.value)}
                  placeholder="250,000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expected Errors</Label>
              <Select value={expectedErrors} onValueChange={setExpectedErrors}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 errors (most common)</SelectItem>
                  <SelectItem value="1">1 error</SelectItem>
                  <SelectItem value="2">2 errors</SelectItem>
                  <SelectItem value="3">3 errors</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* MUS Results */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                MUS Sample Size Calculation
              </h4>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reliability Factor:</span>
                  <span className="font-medium">{results.reliabilityFactor?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sampling Interval:</span>
                  <span className="font-medium">{formatCurrency(results.samplingInterval || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Sample Size:</span>
                  <span className="text-2xl font-bold text-blue-600">{results.sampleSize || 0}</span>
                </div>
              </div>

              <div className="p-3 bg-muted rounded text-xs space-y-1">
                <p>
                  <strong>Formula:</strong> Sample Size = Population Value / Sampling Interval
                </p>
                <p>
                  <strong>Sampling Interval:</strong> Tolerable Error / Reliability Factor
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Classical Variables Sampling */}
          <TabsContent value="classical_variables" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input value={account} onChange={(e) => setAccount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Confidence Level</Label>
                <Select value={confidenceLevel} onValueChange={setConfidenceLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90%</SelectItem>
                    <SelectItem value="95">95%</SelectItem>
                    <SelectItem value="99">99%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Population Size (Items)</Label>
                <Input
                  type="text"
                  value={populationSize}
                  onChange={(e) => setPopulationSize(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Population Value</Label>
                <Input
                  type="text"
                  value={populationValue}
                  onChange={(e) => setPopulationValue(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tolerable Error</Label>
              <Input
                type="text"
                value={tolerableError}
                onChange={(e) => setTolerableError(e.target.value)}
              />
            </div>

            {/* Classical Results */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-semibold">Classical Variables Sample Size</h4>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-semibold">Sample Size:</span>
                  <span className="text-2xl font-bold text-green-600">{results.sampleSize || 0}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Attribute Sampling */}
          <TabsContent value="attribute" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input value={account} onChange={(e) => setAccount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Confidence Level</Label>
                <Select value={confidenceLevel} onValueChange={setConfidenceLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90%</SelectItem>
                    <SelectItem value="95">95%</SelectItem>
                    <SelectItem value="99">99%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Population Size</Label>
                <Input
                  type="text"
                  value={populationSize}
                  onChange={(e) => setPopulationSize(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Error Rate (%)</Label>
                <Input
                  type="text"
                  value={expectedErrorRate}
                  onChange={(e) => setExpectedErrorRate(e.target.value)}
                  placeholder="2"
                />
              </div>
            </div>

            {/* Attribute Results */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-semibold">Attribute Sample Size</h4>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expected Error Rate:</span>
                  <span className="font-medium">{expectedErrorRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tolerable Rate:</span>
                  <span className="font-medium">{results.tolerableRate}%</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Sample Size:</span>
                  <span className="text-2xl font-bold text-purple-600">{results.sampleSize || 0}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            className="flex-1"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Sampling Plan
          </Button>
          <Button
            variant="outline"
            onClick={resetForm}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        {/* Professional Guidance */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h5 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Sampling Guidance
          </h5>
          <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
            <li>Use MUS for testing overstatement in account balances</li>
            <li>Use Classical for testing mean values with normal distribution</li>
            <li>Use Attribute for testing control effectiveness (compliance)</li>
            <li>Document rationale for sampling method selection</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
