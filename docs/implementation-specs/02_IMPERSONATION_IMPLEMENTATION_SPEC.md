# User Impersonation - Implementation Specification

**Module**: User Impersonation
**Priority**: HIGH
**Estimated Effort**: 3 weeks
**Status**: NOT STARTED

---

## Technical Architecture

### Database Schema

#### Step 1: Create Impersonation Tables

**File**: `supabase/migrations/YYYYMMDDHHMMSS_create_impersonation_tables.sql`

```sql
-- Impersonation Sessions
CREATE TABLE IF NOT EXISTS platform_admin.impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  target_type TEXT CHECK (target_type IN ('organization', 'user')) NOT NULL,
  target_organization_id UUID REFERENCES firms(id),
  target_user_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  end_reason TEXT CHECK (end_reason IN ('manual', 'timeout', 'error')),
  ip_address TEXT,
  user_agent TEXT,
  actions_log JSONB[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Impersonation Action Log
CREATE TABLE IF NOT EXISTS platform_admin.impersonation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES platform_admin.impersonation_sessions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_impersonation_sessions_admin ON platform_admin.impersonation_sessions(admin_id);
CREATE INDEX idx_impersonation_sessions_org ON platform_admin.impersonation_sessions(target_organization_id);
CREATE INDEX idx_impersonation_sessions_user ON platform_admin.impersonation_sessions(target_user_id);
CREATE INDEX idx_impersonation_sessions_active ON platform_admin.impersonation_sessions(expires_at)
  WHERE ended_at IS NULL;
CREATE INDEX idx_impersonation_actions_session ON platform_admin.impersonation_actions(session_id);
CREATE INDEX idx_impersonation_actions_timestamp ON platform_admin.impersonation_actions(timestamp);

-- RLS Policies
ALTER TABLE platform_admin.impersonation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.impersonation_actions ENABLE ROW LEVEL SECURITY;

-- Only platform admins can view impersonation logs
CREATE POLICY "Platform admins view impersonation logs"
  ON platform_admin.impersonation_sessions FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins view impersonation actions"
  ON platform_admin.impersonation_actions FOR SELECT
  USING (public.is_platform_admin(auth.uid()));
```

---

## Edge Functions

### Step 2: Create Impersonation Functions

#### Function 1: start-impersonation

**File**: `supabase/functions/admin-start-impersonation/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get admin user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify user is platform admin
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'platform_admin')
      .maybeSingle();

    if (!adminRole) {
      throw new Error('Not a platform admin');
    }

    const { targetType, targetOrganizationId, targetUserId } = await req.json();

    // Validate target
    if (targetType === 'organization' && !targetOrganizationId) {
      throw new Error('Organization ID required');
    }
    if (targetType === 'user' && !targetUserId) {
      throw new Error('User ID required');
    }

    // Create impersonation session (1 hour duration)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const { data: session, error: sessionError } = await supabase
      .from('impersonation_sessions')
      .insert({
        admin_id: user.id,
        target_type: targetType,
        target_organization_id: targetOrganizationId,
        target_user_id: targetUserId,
        expires_at: expiresAt.toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Generate impersonation token
    const secret = new TextEncoder().encode(Deno.env.get('JWT_SECRET')!);

    const impersonationToken = await new jose.SignJWT({
      session_id: session.id,
      admin_id: user.id,
      target_type: targetType,
      target_organization_id: targetOrganizationId,
      target_user_id: targetUserId,
      is_impersonating: true,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(expiresAt)
      .setIssuedAt()
      .sign(secret);

    // Log to audit trail
    await supabase
      .from('impersonation_actions')
      .insert({
        session_id: session.id,
        action_type: 'session_started',
        details: {
          target_type: targetType,
          target_id: targetOrganizationId || targetUserId,
        },
      });

    return new Response(
      JSON.stringify({
        session_id: session.id,
        token: impersonationToken,
        expires_at: expiresAt.toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

#### Function 2: end-impersonation

**File**: `supabase/functions/admin-end-impersonation/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { sessionId, reason } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // End session
    const { error } = await supabase
      .from('impersonation_sessions')
      .update({
        ended_at: new Date().toISOString(),
        end_reason: reason || 'manual',
      })
      .eq('id', sessionId);

    if (error) throw error;

    // Log action
    await supabase
      .from('impersonation_actions')
      .insert({
        session_id: sessionId,
        action_type: 'session_ended',
        details: { reason },
      });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

#### Function 3: log-impersonation-action

**File**: `supabase/functions/admin-log-impersonation-action/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { sessionId, actionType, resourceType, resourceId, details } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await supabase
      .from('impersonation_actions')
      .insert({
        session_id: sessionId,
        action_type: actionType,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
      });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

---

## Frontend Components

### Step 3: Create Impersonation UI

#### Component 1: Impersonation Banner

**File**: `src/components/impersonation/ImpersonationBanner.tsx`

```typescript
import { useEffect, useState } from 'react';
import { AlertTriangle, LogOut, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useImpersonation } from '@/hooks/useImpersonation';

export function ImpersonationBanner() {
  const { session, endImpersonation } = useImpersonation();
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expires = new Date(session.expires_at);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        endImpersonation('timeout');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  if (!session) return null;

  return (
    <Alert className="fixed top-0 left-0 right-0 z-50 rounded-none border-x-0 border-t-0 bg-amber-50 border-amber-200">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-amber-900">
            Impersonating: {session.target_name}
          </span>
          <span className="text-sm text-amber-700">
            Type: {session.target_type === 'organization' ? 'Organization' : 'User'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <Clock className="h-3 w-3" />
            <span>Expires in {timeRemaining}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => endImpersonation('manual')}
            className="border-amber-300 hover:bg-amber-100"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Exit Impersonation
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

#### Component 2: Start Impersonation Dialog

**File**: `src/components/platform-admin/StartImpersonationDialog.tsx`

```typescript
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Eye } from 'lucide-react';
import { useImpersonation } from '@/hooks/useImpersonation';

interface StartImpersonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: 'organization' | 'user';
  targetId: string;
  targetName: string;
}

export function StartImpersonationDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetName,
}: StartImpersonationDialogProps) {
  const [confirmation, setConfirmation] = useState('');
  const { startImpersonation, isStarting } = useImpersonation();

  const handleStart = async () => {
    if (confirmation !== 'IMPERSONATE') return;

    await startImpersonation({
      targetType,
      targetOrganizationId: targetType === 'organization' ? targetId : undefined,
      targetUserId: targetType === 'user' ? targetId : undefined,
      targetName,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Impersonation</DialogTitle>
          <DialogDescription>
            You are about to impersonate {targetType}: <strong>{targetName}</strong>
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Warning:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>All actions will be logged to the audit trail</li>
              <li>Session expires in 1 hour</li>
              <li>Some destructive actions are blocked</li>
              <li>This will be visible in compliance reports</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <strong>IMPERSONATE</strong> to confirm
            </Label>
            <Input
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="IMPERSONATE"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isStarting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStart}
              disabled={confirmation !== 'IMPERSONATE' || isStarting}
            >
              <Eye className="h-4 w-4 mr-2" />
              {isStarting ? 'Starting...' : 'Start Impersonation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### Component 3: Impersonation Audit Log

**File**: `src/components/platform-admin/ImpersonationAuditLog.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export function ImpersonationAuditLog() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['impersonation-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('impersonation_sessions')
        .select(`
          *,
          admin:profiles!impersonation_sessions_admin_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Impersonation Audit Log</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admin</TableHead>
              <TableHead>Target Type</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Ended</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions?.map((session) => (
              <TableRow key={session.id}>
                <TableCell>{session.admin?.full_name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {session.target_type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {session.target_organization_id || session.target_user_id}
                </TableCell>
                <TableCell>
                  {format(new Date(session.started_at), 'PPp')}
                </TableCell>
                <TableCell>
                  {session.ended_at
                    ? format(new Date(session.ended_at), 'PPp')
                    : <Badge variant="secondary">Active</Badge>
                  }
                </TableCell>
                <TableCell>
                  {session.ended_at && calculateDuration(session.started_at, session.ended_at)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function calculateDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
```

---

## Custom Hooks

### Step 4: Create Impersonation Hook

**File**: `src/hooks/useImpersonation.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

interface ImpersonationSession {
  session_id: string;
  token: string;
  expires_at: string;
  target_type: 'organization' | 'user';
  target_name: string;
}

interface ImpersonationStore {
  session: ImpersonationSession | null;
  isImpersonating: boolean;
  isStarting: boolean;
  startImpersonation: (params: {
    targetType: 'organization' | 'user';
    targetOrganizationId?: string;
    targetUserId?: string;
    targetName: string;
  }) => Promise<void>;
  endImpersonation: (reason: string) => Promise<void>;
  logAction: (action: {
    actionType: string;
    resourceType?: string;
    resourceId?: string;
    details?: any;
  }) => Promise<void>;
}

export const useImpersonation = create<ImpersonationStore>()(
  persist(
    (set, get) => ({
      session: null,
      isImpersonating: false,
      isStarting: false,

      startImpersonation: async (params) => {
        set({ isStarting: true });

        try {
          const { data, error } = await supabase.functions.invoke('admin-start-impersonation', {
            body: {
              targetType: params.targetType,
              targetOrganizationId: params.targetOrganizationId,
              targetUserId: params.targetUserId,
            },
          });

          if (error) throw error;

          set({
            session: {
              ...data,
              target_name: params.targetName,
            },
            isImpersonating: true,
            isStarting: false,
          });

          // Reload the page to apply impersonation context
          window.location.reload();
        } catch (error) {
          console.error('Failed to start impersonation:', error);
          set({ isStarting: false });
          throw error;
        }
      },

      endImpersonation: async (reason) => {
        const session = get().session;
        if (!session) return;

        try {
          await supabase.functions.invoke('admin-end-impersonation', {
            body: {
              sessionId: session.session_id,
              reason,
            },
          });

          set({
            session: null,
            isImpersonating: false,
          });

          // Reload to clear impersonation context
          window.location.reload();
        } catch (error) {
          console.error('Failed to end impersonation:', error);
          throw error;
        }
      },

      logAction: async (action) => {
        const session = get().session;
        if (!session) return;

        try {
          await supabase.functions.invoke('admin-log-impersonation-action', {
            body: {
              sessionId: session.session_id,
              ...action,
            },
          });
        } catch (error) {
          console.error('Failed to log action:', error);
        }
      },
    }),
    {
      name: 'impersonation-storage',
    }
  )
);
```

---

## Implementation Checklist

### Phase 1: Database & Backend (Week 1)
- [ ] Create impersonation migration
- [ ] Create start-impersonation function
- [ ] Create end-impersonation function
- [ ] Create log-impersonation-action function
- [ ] Test functions locally

### Phase 2: Frontend Core (Week 2)
- [ ] Create useImpersonation hook
- [ ] Create ImpersonationBanner component
- [ ] Create StartImpersonationDialog component
- [ ] Add impersonation middleware
- [ ] Test impersonation flow

### Phase 3: Audit & Polish (Week 3)
- [ ] Create ImpersonationAuditLog component
- [ ] Add session timeout logic
- [ ] Add action restrictions
- [ ] Security testing
- [ ] Documentation

---

## Security Restrictions

Actions BLOCKED during impersonation:
```typescript
const RESTRICTED_ACTIONS = [
  'delete_organization',
  'delete_user',
  'transfer_ownership',
  'modify_billing',
  'export_all_data',
  'change_subscription',
  'delete_engagement',
  'delete_client',
];
```

---

## Success Criteria

- [ ] Admins can impersonate organizations
- [ ] Admins can impersonate users
- [ ] Sessions expire after 1 hour
- [ ] All actions logged
- [ ] Destructive actions blocked
- [ ] Audit log exportable
