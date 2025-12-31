/**
 * Going Concern Assessment Component
 * AU-C 570 compliant going concern evaluation
 */

'use client';

import { useState } from 'react';
import {
  GoingConcernAssessment as GCAssessment,
  GoingConcernIndicator,
  ManagementPlan,
  AssessmentConclusion,
  IndicatorCategory,
  getIndicatorCategoryLabel,
  getAssessmentConclusionLabel,
  STANDARD_INDICATORS,
} from '@/lib/going-concern';
import {
  useGoingConcernAssessment,
  useGoingConcernChecklist,
} from '@/hooks/useGoingConcern';

interface GoingConcernAssessmentProps {
  engagementId: string;
  userId: string;
  userRole: 'preparer' | 'reviewer' | 'partner';
  onComplete?: () => void;
}

export function GoingConcernAssessment({
  engagementId,
  userId,
  userRole,
  onComplete,
}: GoingConcernAssessmentProps) {
  const { data: assessment, isLoading } = useGoingConcernAssessment(engagementId);
  const { data: checklist } = useGoingConcernChecklist(engagementId);

  const [activeTab, setActiveTab] = useState<
    'indicators' | 'management_plans' | 'conclusion' | 'disclosure'
  >('indicators');
  const [selectedIndicators, setSelectedIndicators] = useState<GoingConcernIndicator[]>([]);
  const [showAddIndicator, setShowAddIndicator] = useState(false);
  const [newIndicator, setNewIndicator] = useState({
    category: 'financial' as IndicatorCategory,
    description: '',
    severity: 'moderate' as 'low' | 'moderate' | 'high',
    mitigatingFactors: '',
  });

  const toggleIndicator = (indicatorId: string) => {
    const existing = selectedIndicators.find((i) => i.id === indicatorId);
    if (existing) {
      setSelectedIndicators(selectedIndicators.filter((i) => i.id !== indicatorId));
    } else {
      // Find from standard indicators
      const allIndicators = Object.values(STANDARD_INDICATORS).flat();
      const indicator = allIndicators.find((i) => i.id === indicatorId);
      if (indicator) {
        setSelectedIndicators([
          ...selectedIndicators,
          {
            ...indicator,
            isPresent: true,
            auditEvidence: '',
            auditConclusion: '',
          },
        ]);
      }
    }
  };

  const addCustomIndicator = () => {
    const customIndicator: GoingConcernIndicator = {
      id: `custom-${Date.now()}`,
      category: newIndicator.category,
      description: newIndicator.description,
      severity: newIndicator.severity,
      isPresent: true,
      mitigatingFactors: newIndicator.mitigatingFactors,
      auditEvidence: '',
      auditConclusion: '',
    };
    setSelectedIndicators([...selectedIndicators, customIndicator]);
    setShowAddIndicator(false);
    setNewIndicator({
      category: 'financial',
      description: '',
      severity: 'moderate',
      mitigatingFactors: '',
    });
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    return colors[severity as keyof typeof colors] || colors.moderate;
  };

  const hasSubstantialDoubt = selectedIndicators.some((i) => i.severity === 'high');
  const requiresDisclosure = hasSubstantialDoubt || selectedIndicators.length >= 3;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading going concern assessment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Going Concern Assessment (AU-C 570)
          </h2>
          <p className="text-sm text-gray-600">
            Evaluate conditions and events that raise substantial doubt about going concern
          </p>
        </div>

        {/* Summary Cards */}
        <div className="px-6 py-4 grid grid-cols-4 gap-4 bg-gray-50 border-b">
          <div className="text-center">
            <p className="text-sm text-gray-600">Indicators Identified</p>
            <p className="text-2xl font-bold text-gray-900">{selectedIndicators.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">High Severity</p>
            <p className="text-2xl font-bold text-red-600">
              {selectedIndicators.filter((i) => i.severity === 'high').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Substantial Doubt</p>
            <p
              className={`text-2xl font-bold ${hasSubstantialDoubt ? 'text-red-600' : 'text-green-600'}`}
            >
              {hasSubstantialDoubt ? 'Yes' : 'No'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Disclosure Required</p>
            <p
              className={`text-2xl font-bold ${requiresDisclosure ? 'text-orange-600' : 'text-green-600'}`}
            >
              {requiresDisclosure ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex">
            {(['indicators', 'management_plans', 'conclusion', 'disclosure'] as const).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'indicators'
                    ? 'Indicators'
                    : tab === 'management_plans'
                      ? "Management's Plans"
                      : tab === 'conclusion'
                        ? 'Conclusion'
                        : 'Disclosure'}
                </button>
              )
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'indicators' && (
            <div className="space-y-6">
              {/* Standard Indicators by Category */}
              {(Object.keys(STANDARD_INDICATORS) as IndicatorCategory[]).map((category) => (
                <div key={category} className="border rounded-lg">
                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <h4 className="font-medium text-gray-900">
                      {getIndicatorCategoryLabel(category)}
                    </h4>
                  </div>
                  <div className="divide-y">
                    {STANDARD_INDICATORS[category].map((indicator) => {
                      const isSelected = selectedIndicators.some((i) => i.id === indicator.id);
                      return (
                        <label
                          key={indicator.id}
                          className={`flex items-start p-4 cursor-pointer hover:bg-gray-50 ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleIndicator(indicator.id)}
                            className="mt-1 mr-3"
                          />
                          <div className="flex-1">
                            <p className="text-gray-900">{indicator.description}</p>
                            <span
                              className={`inline-flex mt-1 px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadge(indicator.severity)}`}
                            >
                              {indicator.severity.toUpperCase()}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Add Custom Indicator */}
              <div className="border rounded-lg">
                <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">Custom Indicators</h4>
                  <button
                    onClick={() => setShowAddIndicator(!showAddIndicator)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showAddIndicator ? 'Cancel' : '+ Add Indicator'}
                  </button>
                </div>

                {showAddIndicator && (
                  <div className="p-4 space-y-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={newIndicator.category}
                          onChange={(e) =>
                            setNewIndicator({
                              ...newIndicator,
                              category: e.target.value as IndicatorCategory,
                            })
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        >
                          <option value="financial">Financial</option>
                          <option value="operating">Operating</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Severity
                        </label>
                        <select
                          value={newIndicator.severity}
                          onChange={(e) =>
                            setNewIndicator({
                              ...newIndicator,
                              severity: e.target.value as 'low' | 'moderate' | 'high',
                            })
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        >
                          <option value="low">Low</option>
                          <option value="moderate">Moderate</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newIndicator.description}
                        onChange={(e) =>
                          setNewIndicator({ ...newIndicator, description: e.target.value })
                        }
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        placeholder="Describe the indicator..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mitigating Factors
                      </label>
                      <textarea
                        value={newIndicator.mitigatingFactors}
                        onChange={(e) =>
                          setNewIndicator({ ...newIndicator, mitigatingFactors: e.target.value })
                        }
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        placeholder="Describe any mitigating factors..."
                      />
                    </div>
                    <button
                      onClick={addCustomIndicator}
                      disabled={!newIndicator.description}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Add Indicator
                    </button>
                  </div>
                )}

                {/* Custom indicators list */}
                <div className="divide-y">
                  {selectedIndicators
                    .filter((i) => i.id.startsWith('custom-'))
                    .map((indicator) => (
                      <div key={indicator.id} className="p-4 bg-blue-50">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-gray-900">{indicator.description}</p>
                            <span
                              className={`inline-flex mt-1 px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadge(indicator.severity)}`}
                            >
                              {indicator.severity.toUpperCase()}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              setSelectedIndicators(
                                selectedIndicators.filter((i) => i.id !== indicator.id)
                              )
                            }
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                        {indicator.mitigatingFactors && (
                          <p className="mt-2 text-sm text-gray-600">
                            <strong>Mitigating factors:</strong> {indicator.mitigatingFactors}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'management_plans' && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                <strong>Guidance:</strong> When conditions or events have been identified that
                raise substantial doubt, evaluate management&apos;s plans to determine whether it
                is probable that the plans will be effectively implemented and mitigate the
                adverse effects.
              </div>

              {selectedIndicators.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No indicators identified. Identify indicators first to document management
                  plans.
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Management&apos;s Plans to Address Indicators
                  </h4>
                  <div className="border rounded-lg divide-y">
                    {selectedIndicators.map((indicator) => (
                      <div key={indicator.id} className="p-4">
                        <p className="font-medium text-gray-900 mb-2">
                          {indicator.description}
                        </p>
                        <textarea
                          placeholder="Document management's plan to address this indicator..."
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <div className="mt-2 flex gap-4">
                          <label className="flex items-center text-sm">
                            <input type="checkbox" className="mr-2" />
                            Plan is feasible
                          </label>
                          <label className="flex items-center text-sm">
                            <input type="checkbox" className="mr-2" />
                            Management intends to implement
                          </label>
                          <label className="flex items-center text-sm">
                            <input type="checkbox" className="mr-2" />
                            Will mitigate conditions
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'conclusion' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Assessment Summary</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Indicators Identified:</dt>
                      <dd className="font-medium">{selectedIndicators.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">High Severity Indicators:</dt>
                      <dd className="font-medium text-red-600">
                        {selectedIndicators.filter((i) => i.severity === 'high').length}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Substantial Doubt Exists:</dt>
                      <dd className={hasSubstantialDoubt ? 'text-red-600 font-medium' : ''}>
                        {hasSubstantialDoubt ? 'Yes' : 'No'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Conclusion</h4>
                  <select className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-3">
                    <option value="no_doubt">
                      No substantial doubt about going concern
                    </option>
                    <option value="doubt_alleviated">
                      Substantial doubt alleviated by management plans
                    </option>
                    <option value="doubt_exists">
                      Substantial doubt exists after considering management plans
                    </option>
                    <option value="inadequate_disclosure">
                      Inadequate disclosure of going concern
                    </option>
                  </select>
                  <textarea
                    placeholder="Document conclusion rationale..."
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Impact on Auditor&apos;s Report
                </h4>
                <div className="space-y-3">
                  <label className="flex items-start p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input type="radio" name="report_impact" className="mt-1 mr-3" />
                    <div>
                      <p className="font-medium">Unmodified Opinion (No GC Paragraph)</p>
                      <p className="text-sm text-gray-600">
                        No substantial doubt exists; no emphasis of matter required
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input type="radio" name="report_impact" className="mt-1 mr-3" />
                    <div>
                      <p className="font-medium">Unmodified with Emphasis of Matter</p>
                      <p className="text-sm text-gray-600">
                        Substantial doubt alleviated; adequate disclosure made
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input type="radio" name="report_impact" className="mt-1 mr-3" />
                    <div>
                      <p className="font-medium">Qualified Opinion</p>
                      <p className="text-sm text-gray-600">
                        Inadequate disclosure of going concern matters
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input type="radio" name="report_impact" className="mt-1 mr-3" />
                    <div>
                      <p className="font-medium">Disclaimer of Opinion</p>
                      <p className="text-sm text-gray-600">
                        Multiple significant uncertainties regarding going concern
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'disclosure' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 rounded-lg p-4 text-sm text-yellow-800">
                <strong>Note:</strong> When substantial doubt exists, review adequacy of
                disclosures including: (a) principal conditions giving rise to doubt, (b)
                management&apos;s evaluation and plans, (c) possible discontinuance of
                operations.
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Disclosure Adequacy Review</h4>
                <div className="space-y-4">
                  <label className="flex items-start">
                    <input type="checkbox" className="mt-1 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Principal conditions/events disclosed
                      </p>
                      <p className="text-sm text-gray-600">
                        Conditions and events that raised substantial doubt are adequately
                        described
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start">
                    <input type="checkbox" className="mt-1 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Management evaluation disclosed</p>
                      <p className="text-sm text-gray-600">
                        Management&apos;s evaluation of the significance of conditions is
                        disclosed
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start">
                    <input type="checkbox" className="mt-1 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Management plans disclosed</p>
                      <p className="text-sm text-gray-600">
                        Management&apos;s plans to address the conditions are disclosed
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start">
                    <input type="checkbox" className="mt-1 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Possible discontinuance mentioned
                      </p>
                      <p className="text-sm text-gray-600">
                        Possible discontinuance of operations is disclosed, if applicable
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disclosure Adequacy Conclusion
                </label>
                <textarea
                  placeholder="Document your conclusion on the adequacy of going concern disclosures..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button className="px-4 py-2 text-gray-600 hover:text-gray-800">Save Draft</button>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Complete Assessment
        </button>
      </div>
    </div>
  );
}

export default GoingConcernAssessment;
