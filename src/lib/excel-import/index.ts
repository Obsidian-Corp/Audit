/**
 * ==================================================================
 * EXCEL IMPORT MODULE
 * ==================================================================
 * Parse Excel files for trial balance, chart of accounts, and other
 * audit data imports. Supports .xlsx, .xls, and .csv formats.
 * ==================================================================
 */

import * as XLSX from 'xlsx';

// ============================================
// Types
// ============================================

export interface ExcelImportResult<T> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  warnings: string[];
  summary: {
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    skippedRows: number;
  };
}

export interface ImportError {
  row: number;
  column?: string;
  value?: unknown;
  message: string;
  code: string;
}

export interface TrialBalanceRow {
  accountNumber: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
  accountType?: string;
  fsCaption?: string;
}

export interface ChartOfAccountsRow {
  accountNumber: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentAccount?: string;
  normalBalance: 'debit' | 'credit';
  fsCaption?: string;
  description?: string;
}

export interface AdjustmentRow {
  description: string;
  debitAccount: string;
  debitAmount: number;
  creditAccount: string;
  creditAmount: number;
  reference?: string;
}

export interface ColumnMapping {
  [key: string]: string | number;
}

// ============================================
// Excel Parser Class
// ============================================

class ExcelParser {
  private workbook: XLSX.WorkBook | null = null;

  /**
   * Load workbook from file
   */
  async loadFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          this.workbook = XLSX.read(data, { type: 'array' });
          resolve();
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Load workbook from base64 string
   */
  loadFromBase64(base64: string): void {
    this.workbook = XLSX.read(base64, { type: 'base64' });
  }

  /**
   * Get list of sheet names
   */
  getSheetNames(): string[] {
    if (!this.workbook) return [];
    return this.workbook.SheetNames;
  }

  /**
   * Get raw data from a sheet
   */
  getSheetData(sheetName?: string): unknown[][] {
    if (!this.workbook) return [];
    const name = sheetName || this.workbook.SheetNames[0];
    const sheet = this.workbook.Sheets[name];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
  }

  /**
   * Get data as objects with headers
   */
  getSheetAsObjects<T>(sheetName?: string): T[] {
    if (!this.workbook) return [];
    const name = sheetName || this.workbook.SheetNames[0];
    const sheet = this.workbook.Sheets[name];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json(sheet) as T[];
  }

  /**
   * Preview first N rows
   */
  preview(rows: number = 10, sheetName?: string): { headers: string[]; rows: unknown[][] } {
    const data = this.getSheetData(sheetName);
    const headers = (data[0] || []).map((h) => String(h || ''));
    const previewRows = data.slice(1, rows + 1);
    return { headers, rows: previewRows };
  }
}

// ============================================
// Trial Balance Import
// ============================================

interface TrialBalanceColumnMapping extends ColumnMapping {
  accountNumber: string | number;
  accountName: string | number;
  debit: string | number;
  credit: string | number;
  balance?: string | number;
  accountType?: string | number;
  fsCaption?: string | number;
}

const DEFAULT_TB_MAPPING: TrialBalanceColumnMapping = {
  accountNumber: 'Account Number',
  accountName: 'Account Name',
  debit: 'Debit',
  credit: 'Credit',
  balance: 'Balance',
};

/**
 * Auto-detect column mapping for trial balance
 */
function autoDetectTrialBalanceMapping(headers: string[]): TrialBalanceColumnMapping {
  const mapping: TrialBalanceColumnMapping = { ...DEFAULT_TB_MAPPING };
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  // Account Number patterns
  const accountNumPatterns = ['account number', 'account #', 'acct no', 'acct #', 'account no', 'gl account'];
  for (const pattern of accountNumPatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pattern) || pattern.includes(h));
    if (idx !== -1) {
      mapping.accountNumber = idx;
      break;
    }
  }

  // Account Name patterns
  const accountNamePatterns = ['account name', 'account description', 'description', 'name'];
  for (const pattern of accountNamePatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pattern));
    if (idx !== -1 && idx !== mapping.accountNumber) {
      mapping.accountName = idx;
      break;
    }
  }

  // Debit patterns
  const debitPatterns = ['debit', 'dr', 'debit balance', 'debit amount'];
  for (const pattern of debitPatterns) {
    const idx = lowerHeaders.findIndex((h) => h === pattern || h.includes(pattern));
    if (idx !== -1) {
      mapping.debit = idx;
      break;
    }
  }

  // Credit patterns
  const creditPatterns = ['credit', 'cr', 'credit balance', 'credit amount'];
  for (const pattern of creditPatterns) {
    const idx = lowerHeaders.findIndex((h) => h === pattern || h.includes(pattern));
    if (idx !== -1) {
      mapping.credit = idx;
      break;
    }
  }

  // Balance patterns (optional)
  const balancePatterns = ['balance', 'ending balance', 'net', 'amount'];
  for (const pattern of balancePatterns) {
    const idx = lowerHeaders.findIndex((h) => h === pattern || h.includes(pattern));
    if (idx !== -1 && idx !== mapping.debit && idx !== mapping.credit) {
      mapping.balance = idx;
      break;
    }
  }

  // Account Type patterns (optional)
  const typePatterns = ['account type', 'type', 'category', 'classification'];
  for (const pattern of typePatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pattern));
    if (idx !== -1) {
      mapping.accountType = idx;
      break;
    }
  }

  // FS Caption patterns (optional)
  const fsCaptionPatterns = ['fs caption', 'financial statement', 'fs line', 'statement line'];
  for (const pattern of fsCaptionPatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pattern));
    if (idx !== -1) {
      mapping.fsCaption = idx;
      break;
    }
  }

  return mapping;
}

/**
 * Parse a numeric value from cell, handling various formats
 */
function parseNumericValue(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;

  const str = String(value).trim();

  // Handle accounting format (parentheses for negatives)
  if (str.startsWith('(') && str.endsWith(')')) {
    return -parseFloat(str.slice(1, -1).replace(/[,$]/g, '')) || 0;
  }

  // Remove currency symbols and commas
  const cleaned = str.replace(/[,$€£¥]/g, '').replace(/\s/g, '');
  const num = parseFloat(cleaned);

  return isNaN(num) ? 0 : num;
}

/**
 * Import trial balance from Excel
 */
export async function importTrialBalance(
  file: File,
  options: {
    sheetName?: string;
    mapping?: Partial<TrialBalanceColumnMapping>;
    skipRows?: number;
    autoDetect?: boolean;
  } = {}
): Promise<ExcelImportResult<TrialBalanceRow>> {
  const parser = new ExcelParser();
  await parser.loadFromFile(file);

  const { sheetName, skipRows = 0, autoDetect = true } = options;
  const rawData = parser.getSheetData(sheetName);

  if (rawData.length === 0) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, message: 'File is empty or has no data', code: 'EMPTY_FILE' }],
      warnings: [],
      summary: { totalRows: 0, successfulRows: 0, failedRows: 0, skippedRows: 0 },
    };
  }

  // Skip initial rows if specified
  const dataWithHeaders = rawData.slice(skipRows);
  const headers = (dataWithHeaders[0] || []).map((h) => String(h || ''));
  const dataRows = dataWithHeaders.slice(1);

  // Determine column mapping
  let mapping: TrialBalanceColumnMapping;
  if (options.mapping) {
    mapping = { ...DEFAULT_TB_MAPPING, ...options.mapping };
  } else if (autoDetect) {
    mapping = autoDetectTrialBalanceMapping(headers);
  } else {
    mapping = DEFAULT_TB_MAPPING;
  }

  // Parse rows
  const result: ExcelImportResult<TrialBalanceRow> = {
    success: true,
    data: [],
    errors: [],
    warnings: [],
    summary: {
      totalRows: dataRows.length,
      successfulRows: 0,
      failedRows: 0,
      skippedRows: 0,
    },
  };

  const getColumnIndex = (key: string | number): number => {
    if (typeof key === 'number') return key;
    const idx = headers.findIndex((h) => h.toLowerCase() === key.toLowerCase());
    return idx;
  };

  dataRows.forEach((row, rowIndex) => {
    const actualRowNum = rowIndex + skipRows + 2; // +2 for 1-based and header

    try {
      const accountNumIdx = getColumnIndex(mapping.accountNumber);
      const accountNameIdx = getColumnIndex(mapping.accountName);
      const debitIdx = getColumnIndex(mapping.debit);
      const creditIdx = getColumnIndex(mapping.credit);

      const accountNumber = row[accountNumIdx];
      const accountName = row[accountNameIdx];

      // Skip empty rows
      if (!accountNumber && !accountName) {
        result.summary.skippedRows++;
        return;
      }

      // Validate required fields
      if (!accountNumber) {
        result.errors.push({
          row: actualRowNum,
          column: 'accountNumber',
          message: 'Account number is required',
          code: 'MISSING_ACCOUNT_NUMBER',
        });
        result.summary.failedRows++;
        return;
      }

      const debit = parseNumericValue(row[debitIdx]);
      const credit = parseNumericValue(row[creditIdx]);

      // Calculate balance
      let balance = debit - credit;
      if (mapping.balance !== undefined) {
        const balanceIdx = getColumnIndex(mapping.balance);
        if (balanceIdx !== -1 && row[balanceIdx] !== undefined) {
          balance = parseNumericValue(row[balanceIdx]);
        }
      }

      const tbRow: TrialBalanceRow = {
        accountNumber: String(accountNumber).trim(),
        accountName: String(accountName || '').trim(),
        debit,
        credit,
        balance,
      };

      // Optional fields
      if (mapping.accountType !== undefined) {
        const typeIdx = getColumnIndex(mapping.accountType);
        if (typeIdx !== -1 && row[typeIdx]) {
          tbRow.accountType = String(row[typeIdx]).trim();
        }
      }

      if (mapping.fsCaption !== undefined) {
        const fsCaptionIdx = getColumnIndex(mapping.fsCaption);
        if (fsCaptionIdx !== -1 && row[fsCaptionIdx]) {
          tbRow.fsCaption = String(row[fsCaptionIdx]).trim();
        }
      }

      result.data.push(tbRow);
      result.summary.successfulRows++;
    } catch (error) {
      result.errors.push({
        row: actualRowNum,
        message: `Failed to parse row: ${error}`,
        code: 'PARSE_ERROR',
      });
      result.summary.failedRows++;
    }
  });

  // Validate trial balance totals
  const totalDebits = result.data.reduce((sum, row) => sum + row.debit, 0);
  const totalCredits = result.data.reduce((sum, row) => sum + row.credit, 0);
  const variance = Math.abs(totalDebits - totalCredits);

  if (variance > 0.01) {
    result.warnings.push(
      `Trial balance is out of balance by ${variance.toFixed(2)}. ` +
      `Total Debits: ${totalDebits.toFixed(2)}, Total Credits: ${totalCredits.toFixed(2)}`
    );
  }

  result.success = result.errors.length === 0;
  return result;
}

// ============================================
// Chart of Accounts Import
// ============================================

interface ChartOfAccountsColumnMapping extends ColumnMapping {
  accountNumber: string | number;
  accountName: string | number;
  accountType: string | number;
  parentAccount?: string | number;
  normalBalance?: string | number;
  fsCaption?: string | number;
  description?: string | number;
}

/**
 * Import chart of accounts from Excel
 */
export async function importChartOfAccounts(
  file: File,
  options: {
    sheetName?: string;
    mapping?: Partial<ChartOfAccountsColumnMapping>;
    skipRows?: number;
  } = {}
): Promise<ExcelImportResult<ChartOfAccountsRow>> {
  const parser = new ExcelParser();
  await parser.loadFromFile(file);

  const { sheetName, skipRows = 0 } = options;
  const rawData = parser.getSheetData(sheetName);

  if (rawData.length === 0) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, message: 'File is empty or has no data', code: 'EMPTY_FILE' }],
      warnings: [],
      summary: { totalRows: 0, successfulRows: 0, failedRows: 0, skippedRows: 0 },
    };
  }

  const dataWithHeaders = rawData.slice(skipRows);
  const headers = (dataWithHeaders[0] || []).map((h) => String(h || '').toLowerCase().trim());
  const dataRows = dataWithHeaders.slice(1);

  const result: ExcelImportResult<ChartOfAccountsRow> = {
    success: true,
    data: [],
    errors: [],
    warnings: [],
    summary: {
      totalRows: dataRows.length,
      successfulRows: 0,
      failedRows: 0,
      skippedRows: 0,
    },
  };

  // Find column indices
  const findColumn = (patterns: string[]): number => {
    for (const pattern of patterns) {
      const idx = headers.findIndex((h) => h.includes(pattern));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const accountNumIdx = findColumn(['account number', 'account #', 'acct no', 'gl account']);
  const accountNameIdx = findColumn(['account name', 'description', 'name']);
  const accountTypeIdx = findColumn(['account type', 'type', 'category']);
  const parentIdx = findColumn(['parent', 'parent account']);
  const normalBalanceIdx = findColumn(['normal balance', 'balance type']);
  const fsCaptionIdx = findColumn(['fs caption', 'financial statement', 'fs line']);
  const descriptionIdx = findColumn(['description', 'notes', 'memo']);

  dataRows.forEach((row, rowIndex) => {
    const actualRowNum = rowIndex + skipRows + 2;

    try {
      const accountNumber = row[accountNumIdx];
      const accountName = row[accountNameIdx];

      if (!accountNumber && !accountName) {
        result.summary.skippedRows++;
        return;
      }

      if (!accountNumber) {
        result.errors.push({
          row: actualRowNum,
          column: 'accountNumber',
          message: 'Account number is required',
          code: 'MISSING_ACCOUNT_NUMBER',
        });
        result.summary.failedRows++;
        return;
      }

      // Parse account type
      const rawType = String(row[accountTypeIdx] || '').toLowerCase().trim();
      let accountType: ChartOfAccountsRow['accountType'] = 'asset';
      if (rawType.includes('liab')) accountType = 'liability';
      else if (rawType.includes('equity') || rawType.includes('capital')) accountType = 'equity';
      else if (rawType.includes('rev') || rawType.includes('income')) accountType = 'revenue';
      else if (rawType.includes('exp')) accountType = 'expense';

      // Parse normal balance
      const rawNormal = String(row[normalBalanceIdx] || '').toLowerCase().trim();
      let normalBalance: ChartOfAccountsRow['normalBalance'] = 'debit';
      if (rawNormal.includes('cr') || rawNormal.includes('credit')) normalBalance = 'credit';

      const coaRow: ChartOfAccountsRow = {
        accountNumber: String(accountNumber).trim(),
        accountName: String(accountName || '').trim(),
        accountType,
        normalBalance,
      };

      if (parentIdx !== -1 && row[parentIdx]) {
        coaRow.parentAccount = String(row[parentIdx]).trim();
      }
      if (fsCaptionIdx !== -1 && row[fsCaptionIdx]) {
        coaRow.fsCaption = String(row[fsCaptionIdx]).trim();
      }
      if (descriptionIdx !== -1 && row[descriptionIdx]) {
        coaRow.description = String(row[descriptionIdx]).trim();
      }

      result.data.push(coaRow);
      result.summary.successfulRows++;
    } catch (error) {
      result.errors.push({
        row: actualRowNum,
        message: `Failed to parse row: ${error}`,
        code: 'PARSE_ERROR',
      });
      result.summary.failedRows++;
    }
  });

  result.success = result.errors.length === 0;
  return result;
}

// ============================================
// Adjustments Import
// ============================================

/**
 * Import audit adjustments from Excel
 */
export async function importAdjustments(
  file: File,
  options: {
    sheetName?: string;
    skipRows?: number;
  } = {}
): Promise<ExcelImportResult<AdjustmentRow>> {
  const parser = new ExcelParser();
  await parser.loadFromFile(file);

  const { sheetName, skipRows = 0 } = options;
  const rawData = parser.getSheetData(sheetName);

  if (rawData.length === 0) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, message: 'File is empty or has no data', code: 'EMPTY_FILE' }],
      warnings: [],
      summary: { totalRows: 0, successfulRows: 0, failedRows: 0, skippedRows: 0 },
    };
  }

  const dataWithHeaders = rawData.slice(skipRows);
  const headers = (dataWithHeaders[0] || []).map((h) => String(h || '').toLowerCase().trim());
  const dataRows = dataWithHeaders.slice(1);

  const result: ExcelImportResult<AdjustmentRow> = {
    success: true,
    data: [],
    errors: [],
    warnings: [],
    summary: {
      totalRows: dataRows.length,
      successfulRows: 0,
      failedRows: 0,
      skippedRows: 0,
    },
  };

  // Find column indices
  const findColumn = (patterns: string[]): number => {
    for (const pattern of patterns) {
      const idx = headers.findIndex((h) => h.includes(pattern));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const descIdx = findColumn(['description', 'memo', 'note']);
  const debitAcctIdx = findColumn(['debit account', 'dr account', 'debit acct']);
  const debitAmtIdx = findColumn(['debit amount', 'debit', 'dr amount']);
  const creditAcctIdx = findColumn(['credit account', 'cr account', 'credit acct']);
  const creditAmtIdx = findColumn(['credit amount', 'credit', 'cr amount']);
  const refIdx = findColumn(['reference', 'ref', 'workpaper']);

  dataRows.forEach((row, rowIndex) => {
    const actualRowNum = rowIndex + skipRows + 2;

    try {
      const description = row[descIdx];
      const debitAccount = row[debitAcctIdx];
      const creditAccount = row[creditAcctIdx];

      if (!description && !debitAccount && !creditAccount) {
        result.summary.skippedRows++;
        return;
      }

      const debitAmount = parseNumericValue(row[debitAmtIdx]);
      const creditAmount = parseNumericValue(row[creditAmtIdx]);

      if (Math.abs(debitAmount - creditAmount) > 0.01) {
        result.warnings.push(
          `Row ${actualRowNum}: Debit (${debitAmount}) does not equal Credit (${creditAmount})`
        );
      }

      const adjRow: AdjustmentRow = {
        description: String(description || '').trim(),
        debitAccount: String(debitAccount || '').trim(),
        debitAmount,
        creditAccount: String(creditAccount || '').trim(),
        creditAmount,
      };

      if (refIdx !== -1 && row[refIdx]) {
        adjRow.reference = String(row[refIdx]).trim();
      }

      result.data.push(adjRow);
      result.summary.successfulRows++;
    } catch (error) {
      result.errors.push({
        row: actualRowNum,
        message: `Failed to parse row: ${error}`,
        code: 'PARSE_ERROR',
      });
      result.summary.failedRows++;
    }
  });

  result.success = result.errors.length === 0;
  return result;
}

// ============================================
// Generic Excel Parser Export
// ============================================

export { ExcelParser };

/**
 * Preview Excel file contents
 */
export async function previewExcelFile(
  file: File,
  options: { rows?: number; sheetName?: string } = {}
): Promise<{
  sheets: string[];
  preview: { headers: string[]; rows: unknown[][] };
  fileInfo: { name: string; size: number; type: string };
}> {
  const parser = new ExcelParser();
  await parser.loadFromFile(file);

  return {
    sheets: parser.getSheetNames(),
    preview: parser.preview(options.rows || 10, options.sheetName),
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
    },
  };
}

// ============================================
// Export to Excel
// ============================================

/**
 * Export data to Excel file
 */
export function exportToExcel<T extends object>(
  data: T[],
  filename: string,
  options: {
    sheetName?: string;
    headers?: string[];
  } = {}
): void {
  const { sheetName = 'Sheet1', headers } = options;

  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: headers,
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, filename);
}

/**
 * Export trial balance to Excel
 */
export function exportTrialBalanceToExcel(
  data: TrialBalanceRow[],
  filename: string,
  clientName: string,
  periodEnd: Date
): void {
  const worksheet = XLSX.utils.aoa_to_sheet([
    [clientName],
    ['Trial Balance'],
    [`As of ${periodEnd.toLocaleDateString()}`],
    [],
    ['Account Number', 'Account Name', 'Debit', 'Credit', 'Balance', 'Account Type', 'FS Caption'],
    ...data.map((row) => [
      row.accountNumber,
      row.accountName,
      row.debit || '',
      row.credit || '',
      row.balance,
      row.accountType || '',
      row.fsCaption || '',
    ]),
    [],
    [
      'TOTALS',
      '',
      data.reduce((sum, r) => sum + r.debit, 0),
      data.reduce((sum, r) => sum + r.credit, 0),
      data.reduce((sum, r) => sum + r.balance, 0),
    ],
  ]);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // Account Number
    { wch: 40 }, // Account Name
    { wch: 15 }, // Debit
    { wch: 15 }, // Credit
    { wch: 15 }, // Balance
    { wch: 12 }, // Account Type
    { wch: 20 }, // FS Caption
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Trial Balance');

  XLSX.writeFile(workbook, filename);
}
