/**
 * Testing utilities for multi-tenant isolation validation
 */

import { supabase } from "@/integrations/supabase/client";

export interface IsolationTestResult {
  testName: string;
  passed: boolean;
  message: string;
  data?: any;
}

/**
 * Test that user can only access data from their assigned firm
 */
export async function testFirmIsolation(
  userId: string,
  firmId: string
): Promise<IsolationTestResult> {
  try {
    // Try to fetch audits
    const { data: audits, error } = await supabase
      .from("audits")
      .select("id, firm_id, audit_title");

    if (error) {
      return {
        testName: "Firm Isolation - Audits",
        passed: false,
        message: `Error fetching audits: ${error.message}`,
      };
    }

    // Check if all returned audits belong to the user's firm
    const otherFirmAudits = audits?.filter((a) => a.firm_id !== firmId) || [];

    return {
      testName: "Firm Isolation - Audits",
      passed: otherFirmAudits.length === 0,
      message:
        otherFirmAudits.length === 0
          ? `✓ All ${audits?.length || 0} audits belong to your firm`
          : `✗ Found ${otherFirmAudits.length} audits from other firms`,
      data: { totalAudits: audits?.length, violatingAudits: otherFirmAudits.length },
    };
  } catch (error) {
    return {
      testName: "Firm Isolation - Audits",
      passed: false,
      message: `Exception: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Test role-based access to specific resources
 */
export async function testRoleAccess(
  userId: string,
  firmId: string,
  role: string
): Promise<IsolationTestResult> {
  try {
    // Check if user has the expected role
    const { data: userRoles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("firm_id", firmId);

    if (error) {
      return {
        testName: `Role Access - ${role}`,
        passed: false,
        message: `Error checking roles: ${error.message}`,
      };
    }

    const hasRole = userRoles?.some((r) => r.role === role) || false;

    return {
      testName: `Role Access - ${role}`,
      passed: hasRole,
      message: hasRole
        ? `✓ User has ${role} role`
        : `✗ User does not have ${role} role`,
      data: { userRoles: userRoles?.map((r) => r.role) },
    };
  } catch (error) {
    return {
      testName: `Role Access - ${role}`,
      passed: false,
      message: `Exception: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Test that workpapers are properly isolated
 */
export async function testWorkpaperIsolation(
  userId: string,
  firmId: string
): Promise<IsolationTestResult> {
  try {
    const { data: workpapers, error } = await supabase
      .from("audit_workpapers")
      .select("id, firm_id, title");

    if (error) {
      return {
        testName: "Workpaper Isolation",
        passed: false,
        message: `Error fetching workpapers: ${error.message}`,
      };
    }

    const otherFirmWorkpapers = workpapers?.filter((w) => w.firm_id !== firmId) || [];

    return {
      testName: "Workpaper Isolation",
      passed: otherFirmWorkpapers.length === 0,
      message:
        otherFirmWorkpapers.length === 0
          ? `✓ All ${workpapers?.length || 0} workpapers belong to your firm`
          : `✗ Found ${otherFirmWorkpapers.length} workpapers from other firms`,
      data: {
        totalWorkpapers: workpapers?.length,
        violatingWorkpapers: otherFirmWorkpapers.length,
      },
    };
  } catch (error) {
    return {
      testName: "Workpaper Isolation",
      passed: false,
      message: `Exception: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Test that findings are properly isolated
 */
export async function testFindingIsolation(
  userId: string,
  firmId: string
): Promise<IsolationTestResult> {
  try {
    const { data: findings, error } = await supabase
      .from("audit_findings")
      .select("id, firm_id, finding_title");

    if (error) {
      return {
        testName: "Finding Isolation",
        passed: false,
        message: `Error fetching findings: ${error.message}`,
      };
    }

    const otherFirmFindings = findings?.filter((f) => f.firm_id !== firmId) || [];

    return {
      testName: "Finding Isolation",
      passed: otherFirmFindings.length === 0,
      message:
        otherFirmFindings.length === 0
          ? `✓ All ${findings?.length || 0} findings belong to your firm`
          : `✗ Found ${otherFirmFindings.length} findings from other firms`,
      data: {
        totalFindings: findings?.length,
        violatingFindings: otherFirmFindings.length,
      },
    };
  } catch (error) {
    return {
      testName: "Finding Isolation",
      passed: false,
      message: `Exception: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Run all isolation tests
 */
export async function runAllIsolationTests(
  userId: string,
  firmId: string,
  expectedRole?: string
): Promise<IsolationTestResult[]> {
  const results: IsolationTestResult[] = [];

  results.push(await testFirmIsolation(userId, firmId));
  results.push(await testWorkpaperIsolation(userId, firmId));
  results.push(await testFindingIsolation(userId, firmId));

  if (expectedRole) {
    results.push(await testRoleAccess(userId, firmId, expectedRole));
  }

  return results;
}
