/**
 * ============================================================================
 * PLATFORM ADMIN MFA HOOK (PLACEHOLDER)
 * ============================================================================
 * This hook is currently a no-op for platform admin flows.
 * Platform admin MFA will be implemented separately using TOTP and platform_admin tables.
 * DO NOT use client-side Supabase auth MFA for platform admins.
 * ============================================================================
 */

import { useState } from 'react';

export const usePlatformAdminMFA = () => {
  const [isChecking] = useState(false);

  // No-op for now - platform admin MFA is handled differently
  const checkMFAStatus = async () => {
    console.log('[Platform Admin MFA] MFA check skipped - not implemented yet');
    return true; // Allow for now
  };

  const enforceMFAForAction = async (action: string): Promise<boolean> => {
    console.log('[Platform Admin MFA] MFA enforcement skipped for:', action);
    return true; // Allow for now
  };

  return {
    checkMFAStatus,
    enforceMFAForAction,
    isChecking,
  };
};
