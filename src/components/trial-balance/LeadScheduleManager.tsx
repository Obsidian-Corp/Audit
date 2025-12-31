/**
 * Lead Schedule Manager Component
 * Manages lead schedules with account linking and sign-off workflow
 */

'use client';

import { useState } from 'react';
import {
  LeadSchedule,
  TrialBalanceAccount,
  getFinancialStatementLabel,
} from '@/lib/trial-balance';
import {
  useLeadSchedules,
  useLeadSchedule,
  useCreateLeadSchedule,
  useUpdateLeadSchedule,
  useSignOffLeadSchedule,
  useAutoGenerateLeadSchedules,
} from '@/hooks/useTrialBalance';

interface LeadScheduleManagerProps {
  engagementId: string;
  trialBalanceId?: string;
  userId: string;
  userRole: 'preparer' | 'reviewer' | 'partner';
  materialityThreshold?: number;
  onScheduleSelect?: (scheduleId: string) => void;
}

export function LeadScheduleManager({
  engagementId,
  trialBalanceId,
  userId,
  userRole,
  materialityThreshold = 100000,
  onScheduleSelect,
}: LeadScheduleManagerProps) {
  const { data: leadSchedules, isLoading } = useLeadSchedules(engagementId);
  const createLeadSchedule = useCreateLeadSchedule();
  const updateLeadSchedule = useUpdateLeadSchedule();
  const signOffLeadSchedule = useSignOffLeadSchedule();
  const autoGenerate = useAutoGenerateLeadSchedules();

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    scheduleNumber: '',
    scheduleName: '',
    financialStatementArea: 'Balance Sheet',
    riskLevel: 'moderate' as 'low' | 'moderate' | 'high',
  });

  const { data: selectedSchedule } = useLeadSchedule(selectedScheduleId || '');

  const handleCreateSchedule = async () => {
    await createLeadSchedule.mutateAsync({
      engagementId,
      ...newSchedule,
      materialityThreshold,
    });
    setShowCreateModal(false);
    setNewSchedule({
      scheduleNumber: '',
      scheduleName: '',
      financialStatementArea: 'Balance Sheet',
      riskLevel: 'moderate',
    });
  };

  const handleAutoGenerate = async () => {
    if (!trialBalanceId) return;
    await autoGenerate.mutateAsync({
      engagementId,
      trialBalanceId,
      materialityThreshold,
    });
  };

  const handleSignOff = async (scheduleId: string, role: 'preparer' | 'reviewer') => {
    await signOffLeadSchedule.mutateAsync({
      leadScheduleId: scheduleId,
      engagementId,
      userId,
      role,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading lead schedules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Lead Schedules</h2>
            <p className="text-sm text-gray-600">
              Manage lead schedules and link trial balance accounts
            </p>
          </div>
          <div className="flex gap-2">
            {trialBalanceId && (
              <button
                onClick={handleAutoGenerate}
                disabled={autoGenerate.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                {autoGenerate.isPending ? 'Generating...' : 'Auto-Generate'}
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Create Schedule
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="px-6 py-4 grid grid-cols-4 gap-4 bg-gray-50 border-b">
          <div>
            <p className="text-sm text-gray-600">Total Schedules</p>
            <p className="text-2xl font-semibold text-gray-900">
              {leadSchedules?.length || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Material Schedules</p>
            <p className="text-2xl font-semibold text-red-600">
              {leadSchedules?.filter((ls) => ls.isMaterial).length || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Procedures Completed</p>
            <p className="text-2xl font-semibold text-green-600">
              {leadSchedules?.filter((ls) => ls.proceduresCompleted).length || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Reviewed</p>
            <p className="text-2xl font-semibold text-blue-600">
              {leadSchedules?.filter((ls) => ls.reviewedBy).length || 0}
            </p>
          </div>
        </div>

        {/* Schedule List */}
        <div className="divide-y">
          {!leadSchedules?.length ? (
            <div className="px-6 py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No lead schedules
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create lead schedules manually or auto-generate from trial balance.
              </p>
            </div>
          ) : (
            leadSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`px-6 py-4 hover:bg-gray-50 cursor-pointer ${
                  selectedScheduleId === schedule.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  setSelectedScheduleId(schedule.id);
                  onScheduleSelect?.(schedule.id);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-gray-500">
                        {schedule.scheduleNumber}
                      </span>
                      <h3 className="font-medium text-gray-900">
                        {schedule.scheduleName}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskBadgeColor(
                          schedule.riskLevel
                        )}`}
                      >
                        {schedule.riskLevel.toUpperCase()}
                      </span>
                      {schedule.isMaterial && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          MATERIAL
                        </span>
                      )}
                      {schedule.significantAccount && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          SIGNIFICANT
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {schedule.financialStatementArea} |{' '}
                      {(schedule as LeadSchedule & { accounts?: TrialBalanceAccount[] }).accounts
                        ?.length || 0}{' '}
                      linked accounts
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(schedule.finalBalance)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {schedule.preparedBy ? (
                        <span className="text-xs text-green-600">Prepared</span>
                      ) : (
                        <span className="text-xs text-gray-400">Not prepared</span>
                      )}
                      <span className="text-gray-300">|</span>
                      {schedule.reviewedBy ? (
                        <span className="text-xs text-green-600">Reviewed</span>
                      ) : (
                        <span className="text-xs text-gray-400">Not reviewed</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sign-off buttons */}
                <div className="mt-3 flex gap-2">
                  {!schedule.preparedBy && userRole !== 'reviewer' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSignOff(schedule.id, 'preparer');
                      }}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Sign as Preparer
                    </button>
                  )}
                  {schedule.preparedBy &&
                    !schedule.reviewedBy &&
                    (userRole === 'reviewer' || userRole === 'partner') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSignOff(schedule.id, 'reviewer');
                        }}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Sign as Reviewer
                      </button>
                    )}
                  {schedule.proceduresCompleted && (
                    <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded">
                      Complete
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Schedule Detail */}
      {selectedSchedule && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedSchedule.scheduleNumber}: {selectedSchedule.scheduleName}
            </h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600">Beginning Balance</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(selectedSchedule.beginningBalance)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ending Balance</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(selectedSchedule.endingBalance)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Final Balance</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatCurrency(selectedSchedule.finalBalance)}
                </p>
              </div>
            </div>

            {selectedSchedule.auditAdjustments !== 0 && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Audit Adjustments:</strong>{' '}
                  {formatCurrency(selectedSchedule.auditAdjustments)}
                </p>
              </div>
            )}

            {selectedSchedule.reclassifications !== 0 && (
              <div className="bg-purple-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-purple-800">
                  <strong>Reclassifications:</strong>{' '}
                  {formatCurrency(selectedSchedule.reclassifications)}
                </p>
              </div>
            )}

            {/* Linked Accounts */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Linked Accounts</h4>
              {(selectedSchedule as LeadSchedule & { accounts?: TrialBalanceAccount[] }).accounts
                ?.length ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Account #</th>
                      <th className="px-3 py-2 text-left">Account Name</th>
                      <th className="px-3 py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(
                      selectedSchedule as LeadSchedule & { accounts?: TrialBalanceAccount[] }
                    ).accounts?.map((account) => (
                      <tr key={account.id}>
                        <td className="px-3 py-2 font-mono">{account.accountNumber}</td>
                        <td className="px-3 py-2">{account.accountName}</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {formatCurrency(account.finalBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-sm">No accounts linked to this schedule.</p>
              )}
            </div>

            {/* Testing Strategy */}
            {selectedSchedule.testingStrategy && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Testing Strategy</h4>
                <p className="text-sm text-gray-600">{selectedSchedule.testingStrategy}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Lead Schedule
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Number
                </label>
                <input
                  type="text"
                  value={newSchedule.scheduleNumber}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, scheduleNumber: e.target.value })
                  }
                  placeholder="e.g., LS-001"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Name
                </label>
                <input
                  type="text"
                  value={newSchedule.scheduleName}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, scheduleName: e.target.value })
                  }
                  placeholder="e.g., Cash and Cash Equivalents"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Financial Statement Area
                </label>
                <select
                  value={newSchedule.financialStatementArea}
                  onChange={(e) =>
                    setNewSchedule({
                      ...newSchedule,
                      financialStatementArea: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="Balance Sheet">Balance Sheet</option>
                  <option value="Income Statement">Income Statement</option>
                  <option value="Statement of Cash Flows">Statement of Cash Flows</option>
                  <option value="Statement of Equity">Statement of Equity</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Level
                </label>
                <select
                  value={newSchedule.riskLevel}
                  onChange={(e) =>
                    setNewSchedule({
                      ...newSchedule,
                      riskLevel: e.target.value as 'low' | 'moderate' | 'high',
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

            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSchedule}
                disabled={!newSchedule.scheduleNumber || !newSchedule.scheduleName}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeadScheduleManager;
