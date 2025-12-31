/**
 * Materiality Calculator Component
 * Interactive calculator for determining audit materiality
 */

'use client';

import { useState, useMemo } from 'react';
import {
  MaterialityBenchmark,
  QualitativeFactorAssessment,
  BENCHMARK_CONFIGS,
  QUALITATIVE_FACTOR_CONFIGS,
  QualitativeFactor,
  getBenchmarkTypicalRange,
  calculateOverallMateriality,
  calculatePerformanceMateriality,
  calculateClearlyTrivialThreshold,
  getMaterialityStatusLabel,
} from '@/lib/materiality';
import {
  useCurrentMateriality,
  useCreateMaterialityCalculation,
  useUpdateMaterialityCalculation,
  useSubmitMaterialityForReview,
  useReviewMateriality,
  useApproveMateriality,
  useMaterialityHistory,
} from '@/hooks/useMateriality';

interface MaterialityCalculatorProps {
  engagementId: string;
  userId: string;
  userRole: 'preparer' | 'reviewer' | 'partner';
  financialData?: {
    totalAssets?: number;
    totalRevenue?: number;
    netIncome?: number;
    grossProfit?: number;
    totalEquity?: number;
    totalExpenses?: number;
  };
  onComplete?: () => void;
}

export function MaterialityCalculator({
  engagementId,
  userId,
  userRole,
  financialData,
  onComplete,
}: MaterialityCalculatorProps) {
  const { data: currentMateriality, isLoading } = useCurrentMateriality(engagementId);
  const { data: history } = useMaterialityHistory(engagementId);

  const createMateriality = useCreateMaterialityCalculation();
  const updateMateriality = useUpdateMaterialityCalculation();
  const submitForReview = useSubmitMaterialityForReview();
  const reviewMateriality = useReviewMateriality();
  const approveMateriality = useApproveMateriality();

  const [benchmark, setBenchmark] = useState<MaterialityBenchmark>('total_revenue');
  const [benchmarkAmount, setBenchmarkAmount] = useState<string>('');
  const [benchmarkPercentage, setBenchmarkPercentage] = useState<string>('1.0');
  const [pmPercentage, setPmPercentage] = useState<string>('75');
  const [ctPercentage, setCtPercentage] = useState<string>('5');
  const [benchmarkRationale, setBenchmarkRationale] = useState<string>('');
  const [qualitativeFactors, setQualitativeFactors] = useState<QualitativeFactorAssessment[]>([]);
  const [showFactors, setShowFactors] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Calculate materiality values
  const calculations = useMemo(() => {
    const amount = parseFloat(benchmarkAmount) || 0;
    const pct = parseFloat(benchmarkPercentage) || 0;
    const pmPct = parseFloat(pmPercentage) || 75;
    const ctPct = parseFloat(ctPercentage) || 5;

    const overall = calculateOverallMateriality(amount, pct);
    const performance = calculatePerformanceMateriality(overall, pmPct);
    const clearlyTrivial = calculateClearlyTrivialThreshold(overall, ctPct);

    return {
      overallMateriality: overall,
      performanceMateriality: performance,
      clearlyTrivialThreshold: clearlyTrivial,
    };
  }, [benchmarkAmount, benchmarkPercentage, pmPercentage, ctPercentage]);

  // Get benchmark range
  const benchmarkRange = useMemo(() => {
    return getBenchmarkTypicalRange(benchmark);
  }, [benchmark]);

  // Auto-populate benchmark amount from financial data
  const handleBenchmarkChange = (newBenchmark: MaterialityBenchmark) => {
    setBenchmark(newBenchmark);
    if (financialData) {
      const amountMap: Record<MaterialityBenchmark, number | undefined> = {
        total_assets: financialData.totalAssets,
        total_revenue: financialData.totalRevenue,
        net_income: financialData.netIncome,
        gross_profit: financialData.grossProfit,
        total_equity: financialData.totalEquity,
        total_expenses: financialData.totalExpenses,
      };
      const amount = amountMap[newBenchmark];
      if (amount) {
        setBenchmarkAmount(amount.toString());
      }
    }
    // Reset percentage to middle of typical range
    const range = getBenchmarkTypicalRange(newBenchmark);
    setBenchmarkPercentage(((range.min + range.max) / 2).toFixed(1));
  };

  const toggleQualitativeFactor = (factor: QualitativeFactor) => {
    const existing = qualitativeFactors.find((f) => f.factor === factor);
    if (existing) {
      setQualitativeFactors(qualitativeFactors.filter((f) => f.factor !== factor));
    } else {
      const config = QUALITATIVE_FACTOR_CONFIGS.find((c) => c.factor === factor);
      if (config) {
        setQualitativeFactors([
          ...qualitativeFactors,
          {
            id: factor,
            factor,
            assessment: config.defaultImpact,
            description: config.description,
            impact: config.suggestedAdjustment,
          },
        ]);
      }
    }
  };

  const handleCreate = async () => {
    await createMateriality.mutateAsync({
      engagementId,
      primaryBenchmark: benchmark,
      benchmarkAmount: parseFloat(benchmarkAmount),
      benchmarkPercentage: parseFloat(benchmarkPercentage),
      benchmarkRationale,
      performanceMaterialityPercentage: parseFloat(pmPercentage),
      clearlyTrivialPercentage: parseFloat(ctPercentage),
      qualitativeFactors,
      preparedBy: userId,
    });
  };

  const handleSubmitForReview = async () => {
    if (!currentMateriality) return;
    await submitForReview.mutateAsync({
      materialityId: currentMateriality.id,
      engagementId,
    });
  };

  const handleReview = async (approved: boolean) => {
    if (!currentMateriality) return;
    await reviewMateriality.mutateAsync({
      materialityId: currentMateriality.id,
      engagementId,
      reviewerId: userId,
      approved,
      comments: reviewComments,
    });
    setReviewComments('');
  };

  const handleApprove = async (approved: boolean) => {
    if (!currentMateriality) return;
    await approveMateriality.mutateAsync({
      materialityId: currentMateriality.id,
      engagementId,
      partnerId: userId,
      approved,
      comments: reviewComments,
    });
    setReviewComments('');
    if (approved) {
      onComplete?.();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading materiality...</p>
      </div>
    );
  }

  // Show existing materiality if approved
  if (currentMateriality?.status === 'approved') {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Materiality Determination</h2>
            <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
              Approved
            </span>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showHistory ? 'Hide History' : 'View History'}
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Overall Materiality</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(currentMateriality.overallMateriality)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {currentMateriality.benchmarkPercentage}% of{' '}
                {BENCHMARK_CONFIGS.find((c) => c.benchmark === currentMateriality.primaryBenchmark)
                  ?.label || currentMateriality.primaryBenchmark}
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">Performance Materiality</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(currentMateriality.performanceMateriality)}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {currentMateriality.performanceMaterialityPercentage}% of overall
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 font-medium">Clearly Trivial</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(currentMateriality.clearlyTrivialThreshold)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {currentMateriality.clearlyTrivialPercentage}% of overall
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Benchmark Rationale</h4>
            <p className="text-sm text-gray-600">{currentMateriality.benchmarkRationale}</p>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>
              Approved by: {currentMateriality.approvedBy} on{' '}
              {new Date(currentMateriality.approvedAt!).toLocaleDateString()}
            </p>
            <p>Version: {currentMateriality.version}</p>
          </div>
        </div>

        {showHistory && history && history.length > 1 && (
          <div className="border-t p-6">
            <h4 className="font-medium text-gray-900 mb-4">Version History</h4>
            <div className="space-y-2">
              {history.map((calc) => (
                <div
                  key={calc.id}
                  className={`p-3 rounded-lg ${
                    calc.isCurrentVersion ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Version {calc.version}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        calc.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : calc.status === 'revised'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {getMaterialityStatusLabel(calc.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Overall: {formatCurrency(calc.overallMateriality)} | Performance:{' '}
                    {formatCurrency(calc.performanceMateriality)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show pending review/approval view
  if (
    currentMateriality?.status === 'pending_review' ||
    currentMateriality?.status === 'pending_partner_approval'
  ) {
    const canReview =
      currentMateriality.status === 'pending_review' &&
      (userRole === 'reviewer' || userRole === 'partner');
    const canApprove =
      currentMateriality.status === 'pending_partner_approval' && userRole === 'partner';

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Materiality Determination</h2>
          <span
            className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
              currentMateriality.status === 'pending_review'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-orange-100 text-orange-800'
            }`}
          >
            {getMaterialityStatusLabel(currentMateriality.status)}
          </span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Overall Materiality</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(currentMateriality.overallMateriality)}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">Performance Materiality</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(currentMateriality.performanceMateriality)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 font-medium">Clearly Trivial</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(currentMateriality.clearlyTrivialThreshold)}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Benchmark Rationale</h4>
            <p className="text-sm text-gray-600">{currentMateriality.benchmarkRationale}</p>
          </div>

          {(canReview || canApprove) && (
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-3">
                {canReview ? 'Review' : 'Partner Approval'}
              </h4>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Comments (optional)"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => (canReview ? handleReview(true) : handleApprove(true))}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {canReview ? 'Approve & Forward to Partner' : 'Approve Materiality'}
                </button>
                <button
                  onClick={() => (canReview ? handleReview(false) : handleApprove(false))}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  Return for Revision
                </button>
              </div>
            </div>
          )}

          {!canReview && !canApprove && (
            <div className="bg-yellow-50 rounded-lg p-4 text-yellow-800 text-sm">
              Awaiting{' '}
              {currentMateriality.status === 'pending_review'
                ? 'manager review'
                : 'partner approval'}
              .
            </div>
          )}
        </div>
      </div>
    );
  }

  // Calculator form for draft or new
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Materiality Calculator</h2>
        <p className="text-sm text-gray-600">
          Determine overall and performance materiality for the engagement
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Benchmark Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Benchmark
          </label>
          <select
            value={benchmark}
            onChange={(e) => handleBenchmarkChange(e.target.value as MaterialityBenchmark)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            {BENCHMARK_CONFIGS.map((config) => (
              <option key={config.benchmark} value={config.benchmark}>
                {config.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {BENCHMARK_CONFIGS.find((c) => c.benchmark === benchmark)?.description}
          </p>
          <p className="mt-1 text-xs text-blue-600">
            Typical range: {benchmarkRange.min}% - {benchmarkRange.max}%
          </p>
        </div>

        {/* Benchmark Amount & Percentage */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Benchmark Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="text"
                value={benchmarkAmount}
                onChange={(e) => setBenchmarkAmount(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Percentage (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={benchmarkPercentage}
              onChange={(e) => setBenchmarkPercentage(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 ${
                parseFloat(benchmarkPercentage) < benchmarkRange.min ||
                parseFloat(benchmarkPercentage) > benchmarkRange.max
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-300'
              }`}
            />
          </div>
        </div>

        {/* Performance Materiality & Clearly Trivial */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Performance Materiality (% of Overall)
            </label>
            <input
              type="number"
              value={pmPercentage}
              onChange={(e) => setPmPercentage(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <p className="mt-1 text-xs text-gray-500">Typically 50-75%</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clearly Trivial (% of Overall)
            </label>
            <input
              type="number"
              value={ctPercentage}
              onChange={(e) => setCtPercentage(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <p className="mt-1 text-xs text-gray-500">Typically 3-5%</p>
          </div>
        </div>

        {/* Calculated Values Preview */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Overall Materiality
            </p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(calculations.overallMateriality)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Performance Materiality
            </p>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(calculations.performanceMateriality)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Clearly Trivial
            </p>
            <p className="text-xl font-bold text-gray-600">
              {formatCurrency(calculations.clearlyTrivialThreshold)}
            </p>
          </div>
        </div>

        {/* Qualitative Factors */}
        <div>
          <button
            onClick={() => setShowFactors(!showFactors)}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <span className={`mr-2 transition-transform ${showFactors ? 'rotate-90' : ''}`}>
              &#9654;
            </span>
            Qualitative Factors ({qualitativeFactors.length} selected)
          </button>

          {showFactors && (
            <div className="mt-3 space-y-2 pl-4">
              {QUALITATIVE_FACTOR_CONFIGS.map((config) => {
                const isSelected = qualitativeFactors.some((f) => f.factor === config.factor);
                return (
                  <label
                    key={config.factor}
                    className={`flex items-start p-3 rounded-lg cursor-pointer ${
                      isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleQualitativeFactor(config.factor)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{config.label}</p>
                      <p className="text-sm text-gray-600">{config.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Impact: {config.defaultImpact === 'increases' ? '+' : '-'}
                        {config.suggestedAdjustment}% adjustment
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Benchmark Rationale */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Benchmark Rationale <span className="text-red-500">*</span>
          </label>
          <textarea
            value={benchmarkRationale}
            onChange={(e) => setBenchmarkRationale(e.target.value)}
            rows={4}
            placeholder="Document the rationale for selecting this benchmark and percentage..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Minimum 50 characters. {benchmarkRationale.length}/50
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {currentMateriality?.status === 'draft' ? (
            <>
              <button
                onClick={handleSubmitForReview}
                disabled={benchmarkRationale.length < 50}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Submit for Review
              </button>
            </>
          ) : (
            <button
              onClick={handleCreate}
              disabled={
                createMateriality.isPending ||
                !benchmarkAmount ||
                benchmarkRationale.length < 50
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createMateriality.isPending ? 'Saving...' : 'Calculate & Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MaterialityCalculator;
