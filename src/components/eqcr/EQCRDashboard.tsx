/**
 * EQCR Dashboard Component
 * Engagement Quality Control Review dashboard per ISQM 2
 */

'use client';

import { useState } from 'react';
import {
  EQCRAssessment,
  EQCRFinding,
  EQCRStatus,
  EQCRTrigger,
  FindingSeverity,
  getEQCRStatusLabel,
  getEQCRTriggerLabel,
  getFindingSeverityLabel,
  QUALITY_CHECKLISTS,
  determineEQCRRequired,
  canCompleteEQCR,
} from '@/lib/quality-control';
import {
  useEQCRAssessment,
  useQualityChecklist,
  useReviewNotes,
  useQualityControl,
} from '@/hooks/useQualityControl';

interface EQCRDashboardProps {
  engagementId: string;
  userId: string;
  userRole: 'preparer' | 'reviewer' | 'partner' | 'eqcr_reviewer';
  engagementType?: 'audit' | 'review' | 'compilation';
  isPublicInterest?: boolean;
  isHighRisk?: boolean;
  onComplete?: () => void;
}

export function EQCRDashboard({
  engagementId,
  userId,
  userRole,
  engagementType = 'audit',
  isPublicInterest = false,
  isHighRisk = false,
  onComplete,
}: EQCRDashboardProps) {
  const { data: eqcrAssessment, isLoading } = useEQCRAssessment(engagementId);
  const { data: checklist } = useQualityChecklist(engagementId);
  const { data: reviewNotes } = useReviewNotes(engagementId);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'checklist' | 'findings' | 'notes' | 'conclusion'
  >('overview');
  const [showAddFinding, setShowAddFinding] = useState(false);
  const [newFinding, setNewFinding] = useState({
    area: '',
    description: '',
    severity: 'moderate' as FindingSeverity,
    recommendation: '',
  });

  // Determine if EQCR is required
  const eqcrRequired = determineEQCRRequired({
    engagementType,
    isPublicInterestEntity: isPublicInterest,
    significantRisksIdentified: isHighRisk,
    previousDeficiencies: false,
    firstYearEngagement: false,
    regulatoryRequirement: false,
  });

  const getStatusBadge = (status: EQCRStatus) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      pending_resolution: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      waived: 'bg-purple-100 text-purple-800',
    };
    return colors[status];
  };

  const getSeverityBadge = (severity: FindingSeverity) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
      critical: 'bg-red-200 text-red-900',
    };
    return colors[severity];
  };

  // Calculate progress
  const checklistProgress = checklist
    ? {
        total: checklist.length,
        completed: checklist.filter((c) => c.completed).length,
        percentage: Math.round(
          (checklist.filter((c) => c.completed).length / checklist.length) * 100
        ),
      }
    : { total: 0, completed: 0, percentage: 0 };

  const openNotesCount = reviewNotes?.filter((n) => n.status !== 'resolved').length || 0;
  const unresolvedFindings =
    eqcrAssessment?.findings?.filter((f) => f.status !== 'resolved').length || 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading EQCR assessment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Engagement Quality Control Review
            </h2>
            <p className="text-sm text-gray-600">ISQM 2 Compliant Quality Review</p>
          </div>
          <div className="flex items-center gap-3">
            {eqcrRequired.isRequired ? (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                EQCR Required
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                EQCR Optional
              </span>
            )}
            {eqcrAssessment && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(eqcrAssessment.status)}`}
              >
                {getEQCRStatusLabel(eqcrAssessment.status)}
              </span>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="px-6 py-4 grid grid-cols-5 gap-4 bg-gray-50 border-b">
          <div className="text-center">
            <p className="text-sm text-gray-600">Checklist Progress</p>
            <p className="text-2xl font-bold text-blue-600">{checklistProgress.percentage}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Items Completed</p>
            <p className="text-2xl font-bold text-gray-900">
              {checklistProgress.completed}/{checklistProgress.total}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Open Review Notes</p>
            <p
              className={`text-2xl font-bold ${openNotesCount > 0 ? 'text-orange-600' : 'text-green-600'}`}
            >
              {openNotesCount}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">EQCR Findings</p>
            <p
              className={`text-2xl font-bold ${unresolvedFindings > 0 ? 'text-red-600' : 'text-green-600'}`}
            >
              {unresolvedFindings}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Ready to Complete</p>
            <p
              className={`text-2xl font-bold ${
                openNotesCount === 0 && unresolvedFindings === 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {openNotesCount === 0 && unresolvedFindings === 0 ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex">
            {(
              ['overview', 'checklist', 'findings', 'notes', 'conclusion'] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* EQCR Triggers */}
              {eqcrRequired.isRequired && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">EQCR Triggers</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {eqcrRequired.triggers.map((trigger, idx) => (
                      <li key={idx}>- {getEQCRTriggerLabel(trigger)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Areas */}
              <div className="grid grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Areas Reviewed</h4>
                  <div className="space-y-2">
                    {[
                      'Significant judgments',
                      'Significant risks',
                      'Independence',
                      'Consultation',
                      'Financial statement disclosures',
                      'Audit documentation',
                    ].map((area, idx) => (
                      <label key={idx} className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm text-gray-700">{area}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">EQCR Reviewer</h4>
                  {eqcrAssessment?.reviewerId ? (
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>Reviewer:</strong> {eqcrAssessment.reviewerId}
                      </p>
                      <p className="text-sm">
                        <strong>Assigned:</strong>{' '}
                        {new Date(eqcrAssessment.createdAt).toLocaleDateString()}
                      </p>
                      {eqcrAssessment.completedAt && (
                        <p className="text-sm">
                          <strong>Completed:</strong>{' '}
                          {new Date(eqcrAssessment.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-3">No EQCR reviewer assigned</p>
                      {userRole === 'partner' && (
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                          Assign Reviewer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Review Timeline</h4>
                <div className="space-y-4">
                  {[
                    { label: 'EQCR Initiated', date: eqcrAssessment?.createdAt },
                    {
                      label: 'Planning Review',
                      date: null,
                      phase: 'planning',
                    },
                    {
                      label: 'Fieldwork Review',
                      date: null,
                      phase: 'fieldwork',
                    },
                    {
                      label: 'Completion Review',
                      date: null,
                      phase: 'completion',
                    },
                    { label: 'Final Sign-off', date: eqcrAssessment?.completedAt },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-3 ${
                          item.date ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                      <span className="text-sm text-gray-700">{item.label}</span>
                      {item.date && (
                        <span className="ml-auto text-sm text-gray-500">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-6">
              {/* Phase-based checklists */}
              {(['planning', 'fieldwork', 'completion'] as const).map((phase) => (
                <div key={phase} className="border rounded-lg">
                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <h4 className="font-medium text-gray-900 capitalize">{phase} Phase</h4>
                  </div>
                  <div className="divide-y">
                    {QUALITY_CHECKLISTS[phase].map((item, idx) => (
                      <label
                        key={idx}
                        className="flex items-start p-4 cursor-pointer hover:bg-gray-50"
                      >
                        <input type="checkbox" className="mt-1 mr-3" />
                        <div>
                          <p className="text-gray-900">{item.question}</p>
                          <p className="text-xs text-gray-500 mt-1">Ref: {item.reference}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'findings' && (
            <div className="space-y-6">
              {/* Existing findings */}
              {eqcrAssessment?.findings && eqcrAssessment.findings.length > 0 ? (
                <div className="space-y-4">
                  {eqcrAssessment.findings.map((finding) => (
                    <div key={finding.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase">
                            {finding.area}
                          </span>
                          <p className="font-medium text-gray-900">{finding.description}</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getSeverityBadge(finding.severity)}`}
                        >
                          {getFindingSeverityLabel(finding.severity)}
                        </span>
                      </div>
                      {finding.recommendation && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Recommendation:</strong> {finding.recommendation}
                        </p>
                      )}
                      {finding.managementResponse && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Response:</strong> {finding.managementResponse}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Status: {finding.status}</span>
                        <span>
                          Raised: {new Date(finding.raisedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No EQCR findings documented
                </div>
              )}

              {/* Add finding */}
              {showAddFinding ? (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                  <h4 className="font-medium text-gray-900">Add EQCR Finding</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Area
                      </label>
                      <input
                        type="text"
                        value={newFinding.area}
                        onChange={(e) =>
                          setNewFinding({ ...newFinding, area: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        placeholder="e.g., Revenue Recognition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Severity
                      </label>
                      <select
                        value={newFinding.severity}
                        onChange={(e) =>
                          setNewFinding({
                            ...newFinding,
                            severity: e.target.value as FindingSeverity,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      >
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newFinding.description}
                      onChange={(e) =>
                        setNewFinding({ ...newFinding, description: e.target.value })
                      }
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recommendation
                    </label>
                    <textarea
                      value={newFinding.recommendation}
                      onChange={(e) =>
                        setNewFinding({ ...newFinding, recommendation: e.target.value })
                      }
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={!newFinding.area || !newFinding.description}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Add Finding
                    </button>
                    <button
                      onClick={() => setShowAddFinding(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                userRole === 'eqcr_reviewer' && (
                  <button
                    onClick={() => setShowAddFinding(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400"
                  >
                    + Add EQCR Finding
                  </button>
                )
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {reviewNotes && reviewNotes.length > 0 ? (
                reviewNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`border rounded-lg p-4 ${
                      note.status === 'resolved' ? 'bg-green-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            note.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : note.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {note.priority.toUpperCase()}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {note.workpaperReference}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          note.status === 'resolved'
                            ? 'text-green-600'
                            : note.status === 'pending'
                              ? 'text-yellow-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {note.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2">{note.note}</p>
                    {note.response && (
                      <p className="text-sm text-gray-600">
                        <strong>Response:</strong> {note.response}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      Raised by {note.raisedBy} on{' '}
                      {new Date(note.raisedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No review notes</div>
              )}
            </div>
          )}

          {activeTab === 'conclusion' && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                <strong>ISQM 2.25:</strong> The engagement quality reviewer shall, on the
                basis of the procedures performed, determine whether the reviewer has obtained
                sufficient and appropriate basis for the conclusion reached.
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">
                  Pre-Completion Checklist
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-3"
                      disabled={openNotesCount > 0}
                      checked={openNotesCount === 0}
                    />
                    <span
                      className={openNotesCount > 0 ? 'text-red-600' : 'text-gray-900'}
                    >
                      All review notes have been cleared ({openNotesCount} open)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-3"
                      disabled={unresolvedFindings > 0}
                      checked={unresolvedFindings === 0}
                    />
                    <span
                      className={unresolvedFindings > 0 ? 'text-red-600' : 'text-gray-900'}
                    >
                      All EQCR findings have been resolved ({unresolvedFindings} open)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span className="text-gray-900">
                      Significant judgments have been reviewed and are appropriate
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span className="text-gray-900">
                      Consultation conclusions have been implemented
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span className="text-gray-900">
                      No unresolved differences of opinion exist
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  EQCR Conclusion
                </label>
                <textarea
                  placeholder="Document your overall conclusion..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3">
                {userRole === 'eqcr_reviewer' && (
                  <button
                    disabled={openNotesCount > 0 || unresolvedFindings > 0}
                    onClick={onComplete}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Complete EQCR
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EQCRDashboard;
