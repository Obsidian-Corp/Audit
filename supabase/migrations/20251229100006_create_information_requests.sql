-- =====================================================================
-- MIGRATION: Create information_requests table
-- Date: 2025-12-29
-- Purpose: Create table for tracking client information requests
-- =====================================================================

-- Create the information_requests table
CREATE TABLE IF NOT EXISTS public.information_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    request_title TEXT NOT NULL,
    description TEXT,
    items_requested JSONB DEFAULT '[]'::jsonb,
    requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'acknowledged', 'in_progress', 'completed', 'overdue')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    client_response TEXT,
    response_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_information_requests_engagement ON public.information_requests(engagement_id);
CREATE INDEX IF NOT EXISTS idx_information_requests_status ON public.information_requests(status);
CREATE INDEX IF NOT EXISTS idx_information_requests_requested_by ON public.information_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_information_requests_assigned_to ON public.information_requests(assigned_to);

-- Enable RLS
ALTER TABLE public.information_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can see requests for engagements in their firm
CREATE POLICY "information_requests_select_policy"
    ON public.information_requests
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.audits a
            WHERE a.id = engagement_id
            AND a.firm_id = public.user_firm_id(auth.uid())
        )
    );

CREATE POLICY "information_requests_insert_policy"
    ON public.information_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.audits a
            WHERE a.id = engagement_id
            AND a.firm_id = public.user_firm_id(auth.uid())
        )
    );

CREATE POLICY "information_requests_update_policy"
    ON public.information_requests
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.audits a
            WHERE a.id = engagement_id
            AND a.firm_id = public.user_firm_id(auth.uid())
        )
    );

CREATE POLICY "information_requests_delete_policy"
    ON public.information_requests
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.audits a
            WHERE a.id = engagement_id
            AND a.firm_id = public.user_firm_id(auth.uid())
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_information_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS information_requests_updated_at_trigger ON public.information_requests;
CREATE TRIGGER information_requests_updated_at_trigger
    BEFORE UPDATE ON public.information_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_information_requests_updated_at();

-- =====================================================================
-- DONE
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '*** information_requests table created ***';
END $$;
