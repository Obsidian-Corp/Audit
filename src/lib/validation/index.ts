/**
 * ==================================================================
 * VALIDATION UTILITIES
 * ==================================================================
 * Comprehensive validation functions for audit data
 * ==================================================================
 */

// ============================================
// Types
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ============================================
// Common Validators
// ============================================

/**
 * Check if a value is not empty
 */
export function isRequired(value: any, fieldName: string): ValidationError | null {
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      code: 'REQUIRED',
    };
  }
  return null;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string, fieldName: string = 'Email'): ValidationError | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      field: fieldName,
      message: 'Please enter a valid email address',
      code: 'INVALID_EMAIL',
    };
  }
  return null;
}

/**
 * Validate minimum length
 */
export function minLength(value: string, min: number, fieldName: string): ValidationError | null {
  if (value.length < min) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${min} characters`,
      code: 'MIN_LENGTH',
    };
  }
  return null;
}

/**
 * Validate maximum length
 */
export function maxLength(value: string, max: number, fieldName: string): ValidationError | null {
  if (value.length > max) {
    return {
      field: fieldName,
      message: `${fieldName} must not exceed ${max} characters`,
      code: 'MAX_LENGTH',
    };
  }
  return null;
}

/**
 * Validate number range
 */
export function numberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationError | null {
  if (value < min || value > max) {
    return {
      field: fieldName,
      message: `${fieldName} must be between ${min} and ${max}`,
      code: 'OUT_OF_RANGE',
    };
  }
  return null;
}

/**
 * Validate positive number
 */
export function isPositive(value: number, fieldName: string): ValidationError | null {
  if (value <= 0) {
    return {
      field: fieldName,
      message: `${fieldName} must be a positive number`,
      code: 'NOT_POSITIVE',
    };
  }
  return null;
}

/**
 * Validate non-negative number
 */
export function isNonNegative(value: number, fieldName: string): ValidationError | null {
  if (value < 0) {
    return {
      field: fieldName,
      message: `${fieldName} cannot be negative`,
      code: 'NEGATIVE',
    };
  }
  return null;
}

/**
 * Validate date is not in the future
 */
export function isNotFutureDate(date: Date, fieldName: string): ValidationError | null {
  if (date > new Date()) {
    return {
      field: fieldName,
      message: `${fieldName} cannot be in the future`,
      code: 'FUTURE_DATE',
    };
  }
  return null;
}

/**
 * Validate date is not in the past
 */
export function isNotPastDate(date: Date, fieldName: string): ValidationError | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return {
      field: fieldName,
      message: `${fieldName} cannot be in the past`,
      code: 'PAST_DATE',
    };
  }
  return null;
}

/**
 * Validate date range
 */
export function dateRange(
  startDate: Date,
  endDate: Date,
  startFieldName: string,
  endFieldName: string
): ValidationError | null {
  if (startDate > endDate) {
    return {
      field: endFieldName,
      message: `${endFieldName} must be after ${startFieldName}`,
      code: 'INVALID_DATE_RANGE',
    };
  }
  return null;
}

// ============================================
// Audit-Specific Validators
// ============================================

/**
 * Validate materiality percentage (typically 0.5% to 5%)
 */
export function isValidMaterialityPercentage(
  percentage: number,
  fieldName: string = 'Materiality percentage'
): ValidationError | null {
  if (percentage < 0.1 || percentage > 10) {
    return {
      field: fieldName,
      message: 'Materiality percentage should typically be between 0.1% and 10%',
      code: 'UNUSUAL_MATERIALITY',
    };
  }
  return null;
}

/**
 * Validate that debits equal credits for a journal entry
 */
export function validateJournalEntryBalance(
  debits: number,
  credits: number
): ValidationError | null {
  // Allow for small rounding differences
  const tolerance = 0.01;
  if (Math.abs(debits - credits) > tolerance) {
    return {
      field: 'balance',
      message: `Journal entry is out of balance. Debits (${debits.toFixed(2)}) must equal credits (${credits.toFixed(2)})`,
      code: 'UNBALANCED_ENTRY',
    };
  }
  return null;
}

/**
 * Validate trial balance foots (total debits = total credits)
 */
export function validateTrialBalanceBalance(
  totalDebits: number,
  totalCredits: number
): ValidationError | null {
  const tolerance = 0.01;
  if (Math.abs(totalDebits - totalCredits) > tolerance) {
    return {
      field: 'trial_balance',
      message: `Trial balance is out of balance by ${Math.abs(totalDebits - totalCredits).toFixed(2)}`,
      code: 'UNBALANCED_TB',
    };
  }
  return null;
}

/**
 * Validate sample size is reasonable given population
 */
export function validateSampleSize(
  sampleSize: number,
  populationSize: number
): ValidationError | null {
  if (sampleSize > populationSize) {
    return {
      field: 'sample_size',
      message: 'Sample size cannot exceed population size',
      code: 'SAMPLE_EXCEEDS_POPULATION',
    };
  }
  if (sampleSize < 1) {
    return {
      field: 'sample_size',
      message: 'Sample size must be at least 1',
      code: 'INVALID_SAMPLE_SIZE',
    };
  }
  return null;
}

/**
 * Validate workpaper reference format (e.g., A-1, B-2.1)
 */
export function validateWorkpaperReference(
  reference: string,
  fieldName: string = 'Workpaper reference'
): ValidationError | null {
  // Allow formats like: A-1, B-2.1, AA-1, 100-1
  const refRegex = /^[A-Za-z0-9]+-[0-9]+(\.[0-9]+)*$/;
  if (!refRegex.test(reference)) {
    return {
      field: fieldName,
      message: 'Invalid workpaper reference format. Use format like A-1, B-2.1',
      code: 'INVALID_WP_REF',
    };
  }
  return null;
}

/**
 * Validate engagement period dates
 */
export function validateEngagementPeriod(
  periodStart: Date,
  periodEnd: Date
): ValidationError[] {
  const errors: ValidationError[] = [];

  // End date must be after start date
  const rangeError = dateRange(periodStart, periodEnd, 'Period start', 'Period end');
  if (rangeError) errors.push(rangeError);

  // Period should be reasonable (max 18 months)
  const maxPeriod = 18 * 30 * 24 * 60 * 60 * 1000; // 18 months in ms
  if (periodEnd.getTime() - periodStart.getTime() > maxPeriod) {
    errors.push({
      field: 'period_end',
      message: 'Audit period should not exceed 18 months',
      code: 'PERIOD_TOO_LONG',
    });
  }

  return errors;
}

// ============================================
// Validation Runner
// ============================================

/**
 * Run multiple validators and collect all errors
 */
export function validate(validators: (ValidationError | null)[]): ValidationResult {
  const errors = validators.filter((e): e is ValidationError => e !== null);
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a validator function that returns all errors for a form
 */
export function createFormValidator<T>(
  validatorFn: (data: T) => (ValidationError | null)[]
): (data: T) => ValidationResult {
  return (data: T) => validate(validatorFn(data));
}

// ============================================
// Form Validation Helpers
// ============================================

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map((e) => `${e.field}: ${e.message}`).join('\n');
}

/**
 * Get first error for a specific field
 */
export function getFieldError(
  errors: ValidationError[],
  fieldName: string
): string | undefined {
  const error = errors.find((e) => e.field === fieldName);
  return error?.message;
}

/**
 * Check if a specific field has errors
 */
export function hasFieldError(errors: ValidationError[], fieldName: string): boolean {
  return errors.some((e) => e.field === fieldName);
}
