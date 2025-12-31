/**
 * Trial Balance Grid Component
 * Interactive grid for viewing and editing trial balance accounts
 */

'use client';

import { useState, useMemo } from 'react';
import {
  TrialBalanceAccount,
  AccountType,
  FinancialStatement,
  getAccountTypeLabel,
  getFinancialStatementLabel,
  STANDARD_CATEGORIES,
} from '@/lib/trial-balance';
import {
  useTrialBalanceAccounts,
  useUpdateAccountMapping,
  useRecordAdjustment,
} from '@/hooks/useTrialBalance';

interface TrialBalanceGridProps {
  trialBalanceId: string;
  isLocked?: boolean;
  showAdjustments?: boolean;
  showPriorYear?: boolean;
  onAccountSelect?: (accountId: string) => void;
}

type SortField =
  | 'accountNumber'
  | 'accountName'
  | 'accountType'
  | 'endingBalance'
  | 'finalBalance';
type SortDirection = 'asc' | 'desc';

export function TrialBalanceGrid({
  trialBalanceId,
  isLocked = false,
  showAdjustments = true,
  showPriorYear = false,
  onAccountSelect,
}: TrialBalanceGridProps) {
  const { data: accounts, isLoading } = useTrialBalanceAccounts(trialBalanceId);
  const updateMapping = useUpdateAccountMapping();
  const recordAdjustment = useRecordAdjustment();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<AccountType | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('accountNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>('');
  const [isReclassification, setIsReclassification] = useState(false);

  // Filter and sort accounts
  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];

    let filtered = accounts.filter((account) => {
      const matchesSearch =
        account.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.accountName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        filterType === 'all' || account.accountType === filterType;
      return matchesSearch && matchesType;
    });

    filtered.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'accountNumber':
          aVal = a.accountNumber;
          bVal = b.accountNumber;
          break;
        case 'accountName':
          aVal = a.accountName;
          bVal = b.accountName;
          break;
        case 'accountType':
          aVal = a.accountType;
          bVal = b.accountType;
          break;
        case 'endingBalance':
          aVal = a.endingBalance;
          bVal = b.endingBalance;
          break;
        case 'finalBalance':
          aVal = a.finalBalance;
          bVal = b.finalBalance;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return filtered;
  }, [accounts, searchTerm, filterType, sortField, sortDirection]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!filteredAccounts.length)
      return { debits: 0, credits: 0, adjustments: 0, final: 0 };

    return filteredAccounts.reduce(
      (acc, account) => {
        const balance = account.endingBalance;
        if (balance > 0) acc.debits += balance;
        else acc.credits += Math.abs(balance);
        acc.adjustments += account.auditAdjustments + account.reclassifications;
        acc.final += account.finalBalance;
        return acc;
      },
      { debits: 0, credits: 0, adjustments: 0, final: 0 }
    );
  }, [filteredAccounts]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAdjustment = async (accountId: string) => {
    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount)) return;

    await recordAdjustment.mutateAsync({
      accountId,
      trialBalanceId,
      adjustmentAmount: amount,
      isReclassification,
    });

    setEditingAccount(null);
    setAdjustmentAmount('');
    setIsReclassification(false);
  };

  const handleTypeChange = async (
    accountId: string,
    accountType: AccountType
  ) => {
    await updateMapping.mutateAsync({
      accountId,
      trialBalanceId,
      mapping: {
        suggestedType: accountType,
        suggestedStatement:
          accountType === 'revenue' || accountType === 'expense'
            ? 'income_statement'
            : 'balance_sheet',
        suggestedCategory: STANDARD_CATEGORIES[accountType][0],
        accountNumber: '',
        accountName: '',
        confidence: 1,
      },
    });
  };

  const formatCurrency = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return amount < 0 ? `(${formatted})` : formatted;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <span className="text-gray-300 ml-1">&#8693;</span>;
    return sortDirection === 'asc' ? (
      <span className="ml-1">&#8593;</span>
    ) : (
      <span className="ml-1">&#8595;</span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading trial balance...</p>
      </div>
    );
  }

  if (!accounts?.length) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">No accounts found. Import a trial balance to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as AccountType | 'all')}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">All Types</option>
          <option value="asset">Assets</option>
          <option value="liability">Liabilities</option>
          <option value="equity">Equity</option>
          <option value="revenue">Revenue</option>
          <option value="expense">Expenses</option>
        </select>

        <div className="text-sm text-gray-600">
          {filteredAccounts.length} of {accounts.length} accounts
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th
                className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('accountNumber')}
              >
                Account # <SortIcon field="accountNumber" />
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('accountName')}
              >
                Account Name <SortIcon field="accountName" />
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('accountType')}
              >
                Type <SortIcon field="accountType" />
              </th>
              {showPriorYear && (
                <th className="px-4 py-3 text-right font-medium text-gray-700">
                  Prior Year
                </th>
              )}
              <th
                className="px-4 py-3 text-right font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('endingBalance')}
              >
                Ending Balance <SortIcon field="endingBalance" />
              </th>
              {showAdjustments && (
                <>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">
                    AJE
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">
                    Reclass
                  </th>
                </>
              )}
              <th
                className="px-4 py-3 text-right font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('finalBalance')}
              >
                Final Balance <SortIcon field="finalBalance" />
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredAccounts.map((account) => (
              <tr
                key={account.id}
                className={`hover:bg-gray-50 ${
                  account.isMapped ? '' : 'bg-yellow-50'
                }`}
              >
                <td className="px-4 py-2 font-mono">{account.accountNumber}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => onAccountSelect?.(account.id)}
                    className="text-left hover:text-blue-600"
                  >
                    {account.accountName}
                  </button>
                </td>
                <td className="px-4 py-2">
                  {isLocked ? (
                    <span
                      className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        account.accountType === 'asset'
                          ? 'bg-blue-100 text-blue-800'
                          : account.accountType === 'liability'
                            ? 'bg-purple-100 text-purple-800'
                            : account.accountType === 'equity'
                              ? 'bg-green-100 text-green-800'
                              : account.accountType === 'revenue'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {getAccountTypeLabel(account.accountType)}
                    </span>
                  ) : (
                    <select
                      value={account.accountType}
                      onChange={(e) =>
                        handleTypeChange(account.id, e.target.value as AccountType)
                      }
                      className="rounded border border-gray-300 px-2 py-1 text-xs"
                    >
                      <option value="asset">Asset</option>
                      <option value="liability">Liability</option>
                      <option value="equity">Equity</option>
                      <option value="revenue">Revenue</option>
                      <option value="expense">Expense</option>
                    </select>
                  )}
                </td>
                {showPriorYear && (
                  <td className="px-4 py-2 text-right font-mono">
                    {account.priorYearBalance !== undefined
                      ? formatCurrency(account.priorYearBalance)
                      : '-'}
                  </td>
                )}
                <td className="px-4 py-2 text-right font-mono">
                  {formatCurrency(account.endingBalance)}
                </td>
                {showAdjustments && (
                  <>
                    <td
                      className={`px-4 py-2 text-right font-mono ${
                        account.auditAdjustments !== 0
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-400'
                      }`}
                    >
                      {account.auditAdjustments !== 0
                        ? formatCurrency(account.auditAdjustments)
                        : '-'}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-mono ${
                        account.reclassifications !== 0
                          ? 'text-purple-600 font-medium'
                          : 'text-gray-400'
                      }`}
                    >
                      {account.reclassifications !== 0
                        ? formatCurrency(account.reclassifications)
                        : '-'}
                    </td>
                  </>
                )}
                <td className="px-4 py-2 text-right font-mono font-medium">
                  {formatCurrency(account.finalBalance)}
                </td>
                <td className="px-4 py-2 text-center">
                  {!isLocked && (
                    <div className="flex justify-center gap-1">
                      {editingAccount === account.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={adjustmentAmount}
                            onChange={(e) => setAdjustmentAmount(e.target.value)}
                            placeholder="Amount"
                            className="w-24 rounded border px-2 py-1 text-xs"
                          />
                          <label className="flex items-center text-xs">
                            <input
                              type="checkbox"
                              checked={isReclassification}
                              onChange={(e) =>
                                setIsReclassification(e.target.checked)
                              }
                              className="mr-1"
                            />
                            Reclass
                          </label>
                          <button
                            onClick={() => handleAdjustment(account.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setEditingAccount(null);
                              setAdjustmentAmount('');
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingAccount(account.id)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Add Adjustment"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 font-medium">
            <tr>
              <td colSpan={2} className="px-4 py-3">
                Totals
              </td>
              <td className="px-4 py-3"></td>
              {showPriorYear && <td className="px-4 py-3"></td>}
              <td className="px-4 py-3 text-right font-mono">
                DR: {formatCurrency(totals.debits)}
                <br />
                CR: {formatCurrency(totals.credits)}
              </td>
              {showAdjustments && (
                <>
                  <td className="px-4 py-3 text-right font-mono text-blue-600">
                    {formatCurrency(totals.adjustments)}
                  </td>
                  <td className="px-4 py-3"></td>
                </>
              )}
              <td className="px-4 py-3 text-right font-mono">
                {formatCurrency(totals.final)}
              </td>
              <td className="px-4 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center text-sm">
        <div className="flex gap-4">
          <span>
            <span className="text-gray-500">Unmapped:</span>{' '}
            <span className="font-medium text-yellow-600">
              {accounts.filter((a) => !a.isMapped).length}
            </span>
          </span>
          <span>
            <span className="text-gray-500">With Adjustments:</span>{' '}
            <span className="font-medium text-blue-600">
              {accounts.filter((a) => a.auditAdjustments !== 0 || a.reclassifications !== 0).length}
            </span>
          </span>
        </div>
        <div>
          <span className="text-gray-500">Variance: </span>
          <span
            className={`font-medium ${
              Math.abs(totals.debits - totals.credits) < 0.01
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {formatCurrency(totals.debits - totals.credits)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TrialBalanceGrid;
