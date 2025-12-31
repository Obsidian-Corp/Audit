/**
 * Trial Balance Import Component
 * Handles CSV/Excel file import with validation and preview
 */

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  TrialBalanceImport as TBImportData,
  ImportedAccount,
  ImportValidationResult,
  validateTrialBalanceImport,
  autoClassifyAccount,
} from '@/lib/trial-balance';
import { useImportTrialBalance, useCreateTrialBalance } from '@/hooks/useTrialBalance';
import { PeriodType } from '@/lib/trial-balance';

interface TrialBalanceImportProps {
  engagementId: string;
  userId: string;
  onImportComplete?: (trialBalanceId: string) => void;
  onCancel?: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

interface ColumnMapping {
  accountNumber: string;
  accountName: string;
  debitBalance: string;
  creditBalance: string;
}

export function TrialBalanceImport({
  engagementId,
  userId,
  onImportComplete,
  onCancel,
}: TrialBalanceImportProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [rawData, setRawData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    accountNumber: '',
    accountName: '',
    debitBalance: '',
    creditBalance: '',
  });
  const [periodType, setPeriodType] = useState<PeriodType>('year_end');
  const [periodEndDate, setPeriodEndDate] = useState<string>('');
  const [sourceSystem, setSourceSystem] = useState<string>('');
  const [parsedAccounts, setParsedAccounts] = useState<ImportedAccount[]>([]);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const createTrialBalance = useCreateTrialBalance();
  const importTrialBalance = useImportTrialBalance();

  // Parse CSV content
  const parseCSV = (content: string): string[][] => {
    const lines = content.split('\n').filter((line) => line.trim());
    return lines.map((line) => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = parseCSV(content);

        if (data.length < 2) {
          setError('File must contain at least a header row and one data row');
          return;
        }

        setHeaders(data[0]);
        setRawData(data.slice(1));
        setError(null);

        // Auto-detect column mappings
        const headerLower = data[0].map((h) => h.toLowerCase());
        const mapping: ColumnMapping = {
          accountNumber: '',
          accountName: '',
          debitBalance: '',
          creditBalance: '',
        };

        headerLower.forEach((header, index) => {
          if (
            header.includes('account') &&
            (header.includes('number') || header.includes('code') || header.includes('#'))
          ) {
            mapping.accountNumber = data[0][index];
          } else if (
            header.includes('account') &&
            (header.includes('name') || header.includes('description'))
          ) {
            mapping.accountName = data[0][index];
          } else if (header.includes('debit')) {
            mapping.debitBalance = data[0][index];
          } else if (header.includes('credit')) {
            mapping.creditBalance = data[0][index];
          }
        });

        setColumnMapping(mapping);
        setStep('mapping');
      } catch {
        setError('Failed to parse file. Please ensure it is a valid CSV file.');
      }
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  // Process mapping and generate preview
  const processMapping = () => {
    const accounts: ImportedAccount[] = rawData.map((row) => {
      const getColumnValue = (columnName: string): string => {
        const index = headers.indexOf(columnName);
        return index >= 0 ? row[index] || '' : '';
      };

      const parseNumber = (value: string): number => {
        const cleaned = value.replace(/[,$()]/g, '').trim();
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : Math.abs(num);
      };

      const accountNumber = getColumnValue(columnMapping.accountNumber);
      const accountName = getColumnValue(columnMapping.accountName);
      const classification = autoClassifyAccount(accountNumber, accountName);

      return {
        accountNumber,
        accountName,
        debitBalance: parseNumber(getColumnValue(columnMapping.debitBalance)),
        creditBalance: parseNumber(getColumnValue(columnMapping.creditBalance)),
        accountType: classification.suggestedType,
      };
    });

    setParsedAccounts(accounts);

    // Validate
    const importData: TBImportData = {
      accounts,
      sourceSystem: sourceSystem || 'CSV Import',
      periodEndDate: new Date(periodEndDate),
      totalDebits: accounts.reduce((sum, a) => sum + (a.debitBalance || 0), 0),
      totalCredits: accounts.reduce((sum, a) => sum + (a.creditBalance || 0), 0),
    };

    const validation = validateTrialBalanceImport(importData);
    setValidationResult(validation);
    setStep('preview');
  };

  // Execute import
  const executeImport = async () => {
    if (!validationResult?.isValid) return;

    setStep('importing');

    try {
      // Create trial balance first
      const trialBalance = await createTrialBalance.mutateAsync({
        engagementId,
        periodType,
        periodEndDate: new Date(periodEndDate),
        sourceSystem: sourceSystem || 'CSV Import',
        importedBy: userId,
      });

      // Import accounts
      const importData: TBImportData = {
        accounts: parsedAccounts,
        sourceSystem: sourceSystem || 'CSV Import',
        periodEndDate: new Date(periodEndDate),
        totalDebits: parsedAccounts.reduce((sum, a) => sum + (a.debitBalance || 0), 0),
        totalCredits: parsedAccounts.reduce((sum, a) => sum + (a.creditBalance || 0), 0),
      };

      await importTrialBalance.mutateAsync({
        trialBalanceId: trialBalance.id,
        engagementId,
        importData,
      });

      setStep('complete');
      onImportComplete?.(trialBalance.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    }
  };

  // Render based on current step
  const renderStep = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="space-y-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-2">
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-gray-600">
                  {isDragActive
                    ? 'Drop the file here...'
                    : 'Drag and drop a CSV or Excel file, or click to select'}
                </p>
                <p className="text-sm text-gray-500">
                  Supported formats: CSV, XLS, XLSX
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Expected Format</h4>
              <p className="text-sm text-gray-600 mb-2">
                Your file should include the following columns:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Account Number (required)</li>
                <li>Account Name/Description (required)</li>
                <li>Debit Balance</li>
                <li>Credit Balance</li>
              </ul>
            </div>
          </div>
        );

      case 'mapping':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period Type
                </label>
                <select
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value as PeriodType)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="year_end">Year End</option>
                  <option value="interim">Interim</option>
                  <option value="prior_year">Prior Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period End Date
                </label>
                <input
                  type="date"
                  value={periodEndDate}
                  onChange={(e) => setPeriodEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source System (Optional)
                </label>
                <input
                  type="text"
                  value={sourceSystem}
                  onChange={(e) => setSourceSystem(e.target.value)}
                  placeholder="e.g., QuickBooks, SAP, Oracle"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Column Mapping</h4>
              <p className="text-sm text-gray-600 mb-4">
                Map your file columns to the required fields:
              </p>

              <div className="grid grid-cols-2 gap-4">
                {(['accountNumber', 'accountName', 'debitBalance', 'creditBalance'] as const).map(
                  (field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field === 'accountNumber'
                          ? 'Account Number'
                          : field === 'accountName'
                            ? 'Account Name'
                            : field === 'debitBalance'
                              ? 'Debit Balance'
                              : 'Credit Balance'}
                        {(field === 'accountNumber' || field === 'accountName') && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      <select
                        value={columnMapping[field]}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, [field]: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      >
                        <option value="">-- Select Column --</option>
                        {headers.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Back
              </button>
              <button
                onClick={processMapping}
                disabled={
                  !columnMapping.accountNumber ||
                  !columnMapping.accountName ||
                  !periodEndDate
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Preview Import
              </button>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-6">
            {/* Validation Summary */}
            <div
              className={`rounded-lg p-4 ${
                validationResult?.isValid
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <h4
                className={`font-medium ${
                  validationResult?.isValid ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {validationResult?.isValid ? 'Validation Passed' : 'Validation Failed'}
              </h4>

              <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Accounts:</span>
                  <span className="ml-2 font-medium">
                    {validationResult?.summary.totalAccounts}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total Debits:</span>
                  <span className="ml-2 font-medium">
                    ${validationResult?.summary.totalDebits.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total Credits:</span>
                  <span className="ml-2 font-medium">
                    ${validationResult?.summary.totalCredits.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Variance:</span>
                  <span
                    className={`ml-2 font-medium ${
                      validationResult?.summary.isBalanced
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    ${validationResult?.summary.variance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Errors */}
            {validationResult?.errors && validationResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Errors</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationResult.errors.map((err, idx) => (
                    <li key={idx}>
                      {err.row > 0 ? `Row ${err.row}: ` : ''}
                      {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {validationResult?.warnings && validationResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Warnings</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {validationResult.warnings.map((warn, idx) => (
                    <li key={idx}>
                      Row {warn.row}: {warn.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h4 className="font-medium text-gray-900">
                  Preview (First 10 Accounts)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Account #</th>
                      <th className="px-4 py-2 text-left">Account Name</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-right">Debit</th>
                      <th className="px-4 py-2 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedAccounts.slice(0, 10).map((account, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 font-mono">
                          {account.accountNumber}
                        </td>
                        <td className="px-4 py-2">{account.accountName}</td>
                        <td className="px-4 py-2 capitalize">{account.accountType}</td>
                        <td className="px-4 py-2 text-right font-mono">
                          {account.debitBalance
                            ? `$${account.debitBalance.toLocaleString()}`
                            : '-'}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {account.creditBalance
                            ? `$${account.creditBalance.toLocaleString()}`
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedAccounts.length > 10 && (
                <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 border-t">
                  ... and {parsedAccounts.length - 10} more accounts
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('mapping')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Back
              </button>
              <button
                onClick={executeImport}
                disabled={!validationResult?.isValid}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import Trial Balance
              </button>
            </div>
          </div>
        );

      case 'importing':
        return (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Importing trial balance...</p>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-12">
            <div className="rounded-full h-16 w-16 bg-green-100 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Import Complete
            </h3>
            <p className="text-gray-600">
              Successfully imported {parsedAccounts.length} accounts.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Import Trial Balance
        </h3>
        {onCancel && step !== 'importing' && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          {['Upload', 'Map Columns', 'Preview', 'Complete'].map((label, idx) => {
            const stepNames: ImportStep[] = ['upload', 'mapping', 'preview', 'complete'];
            const currentIdx = stepNames.indexOf(step);
            const isActive = idx <= currentIdx;
            const isCurrent = idx === currentIdx;

            return (
              <div key={label} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    isActive
                      ? isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {idx < currentIdx ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    isActive ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}
                >
                  {label}
                </span>
                {idx < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-4 ${
                      idx < currentIdx ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6">{renderStep()}</div>
    </div>
  );
}

export default TrialBalanceImport;
