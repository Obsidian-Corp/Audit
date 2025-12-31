// =====================================================
// OBSIDIAN AUDIT - TEST UTILITIES
// Common testing utilities and render helpers
// =====================================================

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// =====================================================
// MOCK DATA FACTORIES
// =====================================================

export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  firm_id: 'firm-123',
  role: 'auditor',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockFirm = (overrides = {}) => ({
  id: 'firm-123',
  name: 'Test Audit Firm',
  slug: 'test-firm',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockClient = (overrides = {}) => ({
  id: 'client-123',
  firm_id: 'firm-123',
  name: 'Test Client Inc.',
  industry: 'Technology',
  status: 'active',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockEngagement = (overrides = {}) => ({
  id: 'engagement-123',
  firm_id: 'firm-123',
  client_id: 'client-123',
  name: 'FY2024 Annual Audit',
  engagement_type: 'financial_statement',
  status: 'in_progress',
  fiscal_year_end: '2024-12-31',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockProcedure = (overrides = {}) => ({
  id: 'procedure-123',
  engagement_id: 'engagement-123',
  procedure_name: 'Test Procedure',
  procedure_code: 'TP-001',
  status: 'not_started',
  estimated_hours: 4,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockWorkpaper = (overrides = {}) => ({
  id: 'workpaper-123',
  engagement_id: 'engagement-123',
  name: 'Test Workpaper',
  workpaper_code: 'WP-001',
  content: {},
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockFinding = (overrides = {}) => ({
  id: 'finding-123',
  engagement_id: 'engagement-123',
  finding_title: 'Test Finding',
  finding_type: 'control_deficiency',
  severity: 'material',
  status: 'open',
  created_at: new Date().toISOString(),
  ...overrides,
});

// =====================================================
// PROVIDERS WRAPPER
// =====================================================

interface AllProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

// =====================================================
// CUSTOM RENDER
// =====================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult {
  if (options?.initialRoute) {
    window.history.pushState({}, 'Test page', options.initialRoute);
  }

  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// =====================================================
// ASYNC UTILITIES
// =====================================================

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Wait for element to be removed
 */
export async function waitForElementToBeRemoved(
  callback: () => Element | null,
  options?: { timeout?: number }
): Promise<void> {
  const { timeout = 5000 } = options || {};
  await waitForCondition(() => callback() === null, timeout);
}

// =====================================================
// MOCK HELPERS
// =====================================================

/**
 * Create a mock Supabase response
 */
export function mockSupabaseResponse<T>(data: T, error: null = null) {
  return { data, error, count: Array.isArray(data) ? data.length : 1 };
}

/**
 * Create a mock Supabase error response
 */
export function mockSupabaseError(message: string, code = 'ERROR') {
  return { data: null, error: { message, code } };
}

/**
 * Mock fetch response
 */
export function mockFetchResponse<T>(data: T, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

// =====================================================
// FORM TESTING HELPERS
// =====================================================

import userEvent from '@testing-library/user-event';

/**
 * Type into an input field
 */
export async function typeIntoField(
  element: Element,
  value: string
): Promise<void> {
  const user = userEvent.setup();
  await user.clear(element);
  await user.type(element, value);
}

/**
 * Select an option from a dropdown
 */
export async function selectOption(
  element: Element,
  value: string
): Promise<void> {
  const user = userEvent.setup();
  await user.selectOptions(element, value);
}

/**
 * Click an element
 */
export async function clickElement(element: Element): Promise<void> {
  const user = userEvent.setup();
  await user.click(element);
}

// =====================================================
// ACCESSIBILITY TESTING
// =====================================================

import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

/**
 * Check for accessibility violations
 */
export async function checkAccessibility(
  container: Element
): Promise<void> {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

// =====================================================
// SNAPSHOT HELPERS
// =====================================================

/**
 * Create a serializable version of a component for snapshots
 */
export function toMatchSnapshot(element: ReactElement) {
  const { container } = render(element);
  return container.innerHTML;
}
