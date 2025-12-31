// =====================================================
// OBSIDIAN AUDIT - PROFESSIONAL STANDARDS HOOKS TESTS
// Unit tests for professional standards React Query hooks
// =====================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

import {
  useWorkpaperVersions,
  useSignoffRecords,
  useTickMarkDefinitions,
  useIndependenceDeclarations,
  useInternalControls,
  useControlDeficiencies,
  useAuditOpinion,
  useKeyAuditMatters,
  professionalStandardsKeys,
} from './useProfessionalStandards';

// Mock supabase
const mockSupabaseFrom = vi.fn();
const mockSupabaseRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
    rpc: (fn: string, params: Record<string, unknown>) => mockSupabaseRpc(fn, params),
  },
}));

// Query wrapper
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('Professional Standards Query Keys', () => {
  it('generates correct workpaper versions key', () => {
    const key = professionalStandardsKeys.workpaperVersions('wp-123');
    expect(key).toEqual(['workpaper-versions', 'wp-123']);
  });

  it('generates correct signoff records key', () => {
    const key = professionalStandardsKeys.signoffRecords('eng-123');
    expect(key).toEqual(['signoff-records', 'eng-123']);
  });

  it('generates correct audit opinion key', () => {
    const key = professionalStandardsKeys.auditOpinion('eng-123');
    expect(key).toEqual(['audit-opinion', 'eng-123']);
  });
});

describe('useWorkpaperVersions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches workpaper versions successfully', async () => {
    const mockVersions = [
      { id: 'v1', workpaper_id: 'wp-123', version_number: 2, content_hash: 'hash2' },
      { id: 'v2', workpaper_id: 'wp-123', version_number: 1, content_hash: 'hash1' },
    ];

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockVersions, error: null }),
    });

    const { result } = renderHook(() => useWorkpaperVersions('wp-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockVersions);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('workpaper_versions');
  });

  it('does not fetch when workpaperId is empty', () => {
    const { result } = renderHook(() => useWorkpaperVersions(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('handles errors gracefully', async () => {
    const error = { message: 'Database error', code: 'DB_ERROR' };

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error }),
    });

    const { result } = renderHook(() => useWorkpaperVersions('wp-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe('useSignoffRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches signoff records with profile data', async () => {
    const mockSignoffs = [
      {
        id: 's1',
        engagement_id: 'eng-123',
        signoff_role: 'preparer',
        signed_at: '2024-01-01',
        signed_by_profile: { full_name: 'John Doe', email: 'john@example.com' },
      },
    ];

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockSignoffs, error: null }),
    });

    const { result } = renderHook(() => useSignoffRecords('eng-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockSignoffs);
    expect(result.current.data?.[0].signed_by_profile).toBeDefined();
  });
});

describe('useTickMarkDefinitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches only active tick marks for firm', async () => {
    const mockTickMarks = [
      { id: 't1', firm_id: 'firm-123', symbol: '/', description: 'Traced', is_active: true },
      { id: 't2', firm_id: 'firm-123', symbol: 'F', description: 'Footed', is_active: true },
    ];

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockTickMarks, error: null }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const { result } = renderHook(() => useTickMarkDefinitions('firm-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(mockChain.eq).toHaveBeenCalledWith('firm_id', 'firm-123');
    expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
  });
});

describe('useIndependenceDeclarations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches independence declarations with user info', async () => {
    const mockDeclarations = [
      {
        id: 'd1',
        engagement_id: 'eng-123',
        is_independent: true,
        user: { full_name: 'Jane Smith', email: 'jane@example.com' },
      },
    ];

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockDeclarations, error: null }),
    });

    const { result } = renderHook(() => useIndependenceDeclarations('eng-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0].is_independent).toBe(true);
  });
});

describe('useInternalControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches controls ordered by control ID code', async () => {
    const mockControls = [
      { id: 'c1', control_id_code: 'CTL-001', control_name: 'Control A' },
      { id: 'c2', control_id_code: 'CTL-002', control_name: 'Control B' },
    ];

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockControls, error: null }),
    });

    const { result } = renderHook(() => useInternalControls('eng-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
  });
});

describe('useControlDeficiencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches deficiencies with control reference', async () => {
    const mockDeficiencies = [
      {
        id: 'def1',
        classification: 'material_weakness',
        control: { control_id_code: 'CTL-001', control_name: 'Access Control' },
      },
    ];

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockDeficiencies, error: null }),
    });

    const { result } = renderHook(() => useControlDeficiencies('eng-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0].classification).toBe('material_weakness');
  });
});

describe('useAuditOpinion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches latest issued opinion', async () => {
    const mockOpinion = {
      id: 'op1',
      engagement_id: 'eng-123',
      opinion_type: 'unmodified',
      status: 'issued',
      version_number: 1,
    };

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockOpinion, error: null }),
    });

    const { result } = renderHook(() => useAuditOpinion('eng-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.opinion_type).toBe('unmodified');
  });

  it('returns null when no opinion exists', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      }),
    });

    const { result } = renderHook(() => useAuditOpinion('eng-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe('useKeyAuditMatters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches KAMs ordered by display order', async () => {
    const mockKAMs = [
      { id: 'kam1', matter_title: 'Revenue Recognition', display_order: 1 },
      { id: 'kam2', matter_title: 'Impairment', display_order: 2 },
    ];

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockKAMs, error: null }),
    });

    const { result } = renderHook(() => useKeyAuditMatters('op-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].display_order).toBe(1);
  });
});
