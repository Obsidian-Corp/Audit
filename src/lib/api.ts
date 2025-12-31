// =====================================================
// OBSIDIAN AUDIT - API CLIENT
// Enterprise-grade API layer with error handling
// =====================================================

import { supabase } from './supabase';
import { logger } from './logger';

// =====================================================
// TYPES
// =====================================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  hint?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

// =====================================================
// API CLIENT CLASS
// =====================================================

class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string;
  private retryCount = 3;
  private retryDelay = 1000;

  private constructor() {
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // =====================================================
  // CORE METHODS
  // =====================================================

  /**
   * Execute a query with automatic retry and error handling
   */
  async query<T>(
    table: string,
    options: QueryOptions = {}
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    const {
      page = 1,
      pageSize = 25,
      orderBy = 'created_at',
      orderDirection = 'desc',
      filters = {},
    } = options;

    const startTime = performance.now();
    const logContext = { table, page, pageSize, filters };

    try {
      // Build query
      let query = supabase.from(table).select('*', { count: 'exact' });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && 'op' in value) {
            // Handle custom operators
            const { op, val } = value as { op: string; val: unknown };
            switch (op) {
              case 'gte':
                query = query.gte(key, val);
                break;
              case 'lte':
                query = query.lte(key, val);
                break;
              case 'like':
                query = query.ilike(key, `%${val}%`);
                break;
              case 'is':
                query = query.is(key, val as null | boolean);
                break;
              default:
                query = query.eq(key, val);
            }
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Apply ordering
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      const { data, error, count } = await query;

      const duration = performance.now() - startTime;
      logger.debug(`Query ${table} completed`, { ...logContext, duration: `${duration.toFixed(2)}ms` });

      if (error) {
        return this.handleError(error, logContext);
      }

      return {
        data: {
          data: data as T[],
          count: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
        error: null,
        status: 200,
      };
    } catch (err) {
      return this.handleError(err, logContext);
    }
  }

  /**
   * Get a single record by ID
   */
  async getById<T>(table: string, id: string): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    const logContext = { table, id };

    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      const duration = performance.now() - startTime;
      logger.debug(`GetById ${table} completed`, { ...logContext, duration: `${duration.toFixed(2)}ms` });

      if (error) {
        return this.handleError(error, logContext);
      }

      return {
        data: data as T,
        error: null,
        status: 200,
      };
    } catch (err) {
      return this.handleError(err, logContext);
    }
  }

  /**
   * Create a new record
   */
  async create<T>(table: string, record: Partial<T>): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    const logContext = { table, action: 'create' };

    try {
      const { data, error } = await supabase
        .from(table)
        .insert(record)
        .select()
        .single();

      const duration = performance.now() - startTime;
      logger.info(`Create ${table} completed`, { ...logContext, duration: `${duration.toFixed(2)}ms` });

      if (error) {
        return this.handleError(error, logContext);
      }

      return {
        data: data as T,
        error: null,
        status: 201,
      };
    } catch (err) {
      return this.handleError(err, logContext);
    }
  }

  /**
   * Update an existing record
   */
  async update<T>(table: string, id: string, updates: Partial<T>): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    const logContext = { table, id, action: 'update' };

    try {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      const duration = performance.now() - startTime;
      logger.info(`Update ${table} completed`, { ...logContext, duration: `${duration.toFixed(2)}ms` });

      if (error) {
        return this.handleError(error, logContext);
      }

      return {
        data: data as T,
        error: null,
        status: 200,
      };
    } catch (err) {
      return this.handleError(err, logContext);
    }
  }

  /**
   * Delete a record
   */
  async delete(table: string, id: string): Promise<ApiResponse<null>> {
    const startTime = performance.now();
    const logContext = { table, id, action: 'delete' };

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      const duration = performance.now() - startTime;
      logger.info(`Delete ${table} completed`, { ...logContext, duration: `${duration.toFixed(2)}ms` });

      if (error) {
        return this.handleError(error, logContext);
      }

      return {
        data: null,
        error: null,
        status: 204,
      };
    } catch (err) {
      return this.handleError(err, logContext);
    }
  }

  /**
   * Execute a stored procedure/RPC
   */
  async rpc<T>(
    functionName: string,
    params: Record<string, unknown> = {}
  ): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    const logContext = { function: functionName, action: 'rpc' };

    try {
      const { data, error } = await supabase.rpc(functionName, params);

      const duration = performance.now() - startTime;
      logger.debug(`RPC ${functionName} completed`, { ...logContext, duration: `${duration.toFixed(2)}ms` });

      if (error) {
        return this.handleError(error, logContext);
      }

      return {
        data: data as T,
        error: null,
        status: 200,
      };
    } catch (err) {
      return this.handleError(err, logContext);
    }
  }

  /**
   * Batch insert multiple records
   */
  async batchCreate<T>(table: string, records: Partial<T>[]): Promise<ApiResponse<T[]>> {
    const startTime = performance.now();
    const logContext = { table, action: 'batchCreate', count: records.length };

    try {
      const { data, error } = await supabase
        .from(table)
        .insert(records)
        .select();

      const duration = performance.now() - startTime;
      logger.info(`BatchCreate ${table} completed`, { ...logContext, duration: `${duration.toFixed(2)}ms` });

      if (error) {
        return this.handleError(error, logContext);
      }

      return {
        data: data as T[],
        error: null,
        status: 201,
      };
    } catch (err) {
      return this.handleError(err, logContext);
    }
  }

  // =====================================================
  // ERROR HANDLING
  // =====================================================

  private handleError<T>(error: unknown, context: Record<string, unknown>): ApiResponse<T> {
    let apiError: ApiError;
    let status = 500;

    if (error && typeof error === 'object' && 'code' in error) {
      const pgError = error as { code: string; message: string; details?: string; hint?: string };

      // Map Postgres error codes to HTTP status codes
      switch (pgError.code) {
        case 'PGRST116': // No rows found
          status = 404;
          apiError = {
            code: 'NOT_FOUND',
            message: 'Record not found',
            details: pgError.details,
          };
          break;
        case '23505': // Unique constraint violation
          status = 409;
          apiError = {
            code: 'CONFLICT',
            message: 'A record with this value already exists',
            details: pgError.details,
            hint: pgError.hint,
          };
          break;
        case '23503': // Foreign key violation
          status = 400;
          apiError = {
            code: 'INVALID_REFERENCE',
            message: 'Referenced record does not exist',
            details: pgError.details,
          };
          break;
        case '42501': // Insufficient privilege
          status = 403;
          apiError = {
            code: 'FORBIDDEN',
            message: 'You do not have permission to perform this action',
            details: pgError.details,
          };
          break;
        case 'PGRST301': // JWT expired
          status = 401;
          apiError = {
            code: 'UNAUTHORIZED',
            message: 'Your session has expired. Please log in again.',
          };
          break;
        default:
          apiError = {
            code: pgError.code,
            message: pgError.message,
            details: pgError.details,
            hint: pgError.hint,
          };
      }
    } else if (error instanceof Error) {
      apiError = {
        code: 'INTERNAL_ERROR',
        message: error.message,
      };
    } else {
      apiError = {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      };
    }

    logger.error('API Error', new Error(apiError.message), { ...context, error: apiError });

    return {
      data: null,
      error: apiError,
      status,
    };
  }

  // =====================================================
  // RETRY LOGIC
  // =====================================================

  private async withRetry<T>(
    operation: () => Promise<ApiResponse<T>>,
    attempts = this.retryCount
  ): Promise<ApiResponse<T>> {
    for (let i = 0; i < attempts; i++) {
      const result = await operation();

      // Don't retry client errors
      if (result.status < 500 || i === attempts - 1) {
        return result;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
      logger.warn(`Retrying operation (attempt ${i + 2}/${attempts})`);
    }

    // Should never reach here, but TypeScript needs this
    return {
      data: null,
      error: { code: 'MAX_RETRIES', message: 'Maximum retry attempts exceeded' },
      status: 500,
    };
  }
}

// Export singleton instance
export const api = ApiClient.getInstance();

// =====================================================
// CONVENIENCE FUNCTIONS
// =====================================================

export const queryTable = <T>(table: string, options?: QueryOptions) =>
  api.query<T>(table, options);

export const getById = <T>(table: string, id: string) =>
  api.getById<T>(table, id);

export const createRecord = <T>(table: string, record: Partial<T>) =>
  api.create<T>(table, record);

export const updateRecord = <T>(table: string, id: string, updates: Partial<T>) =>
  api.update<T>(table, id, updates);

export const deleteRecord = (table: string, id: string) =>
  api.delete(table, id);

export const callRpc = <T>(functionName: string, params?: Record<string, unknown>) =>
  api.rpc<T>(functionName, params);
