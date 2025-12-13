/**
 * Admin Edge Function Invocation Helper
 * 
 * Centralizes platform admin function calls with:
 * - Automatic JWT header injection
 * - Session validation
 * - Consistent error handling
 */

import { supabase } from "@/integrations/supabase/client";

interface AdminSession {
  token: string;
  sessionToken: string;
  adminId: string;
  email: string;
  fullName: string;
  expiresAt: string;
  lastActivity: string;
}

export class AdminAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminAuthError';
  }
}

/**
 * Invoke an admin edge function with automatic authentication
 * 
 * @param functionName - Name of the edge function to invoke
 * @param options - Additional options (body, headers, etc.)
 * @returns The function response data
 * @throws AdminAuthError if no valid admin session exists
 */
export async function adminInvoke<T = any>(
  functionName: string,
  options?: {
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<T> {
  // Get admin session from localStorage
  const sessionData = localStorage.getItem('obsidian_admin_session');
  
  if (!sessionData) {
    throw new AdminAuthError('No admin session found. Please sign in again.');
  }

  let session: AdminSession;
  try {
    session = JSON.parse(sessionData);
  } catch (error) {
    localStorage.removeItem('obsidian_admin_session');
    throw new AdminAuthError('Invalid admin session data. Please sign in again.');
  }

  // Check if session is expired
  if (new Date(session.expiresAt) < new Date()) {
    localStorage.removeItem('obsidian_admin_session');
    throw new AdminAuthError('Admin session expired. Please sign in again.');
  }

  // Invoke the function with admin JWT
  const { data, error } = await supabase.functions.invoke(functionName, {
    ...options,
    headers: {
      'Authorization': `Bearer ${session.token}`,
      ...options?.headers,
    },
  });

  if (error) {
    console.error(`[adminInvoke] Error calling ${functionName}:`, error);
    
    // Check for auth-related errors
    if (error.message?.includes('JWT') || error.message?.includes('401')) {
      localStorage.removeItem('obsidian_admin_session');
      throw new AdminAuthError('Authentication failed. Please sign in again.');
    }
    
    throw error;
  }

  return data as T;
}

/**
 * Get the current admin session
 * @returns The admin session or null if not authenticated
 */
export function getAdminSession(): AdminSession | null {
  const sessionData = localStorage.getItem('obsidian_admin_session');
  if (!sessionData) return null;

  try {
    const session = JSON.parse(sessionData);
    
    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem('obsidian_admin_session');
      return null;
    }

    return session;
  } catch (error) {
    localStorage.removeItem('obsidian_admin_session');
    return null;
  }
}
