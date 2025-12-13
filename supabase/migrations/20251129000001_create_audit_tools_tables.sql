-- =====================================================================
-- PHASE 1: AUDIT TOOLS FOUNDATION - 8 NEW TABLES
-- =====================================================================
-- Migration: 20251129000001_create_audit_tools_tables.sql
-- Description: Create 8 new tables for integrated audit tools per the
--              Comprehensive System Design Document
-- Tables Created:
--   1. audit_samples (MUS, classical variables, attribute sampling)
--   2. materiality_calculations (Overall, Performance, Trivial thresholds)
--   3. confirmations (AR, AP, Bank confirmations)
--   4. analytical_procedures (Ratio, trend, variance analysis)
--   5. audit_adjustments (SAJ, PJE, SUM tracking)
--   6. independence_declarations (AICPA Code compliance)
--   7. subsequent_events (Type I/II events per AU-C 560)
--   8. client_pbc_items (PBC list tracker)
-- =====================================================================

-- =====================================================================
-- 1. AUDIT SAMPLES TABLE
-- =====================================================================

CREATE TABLE public.audit_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  audit_area TEXT NOT NULL, -- 'Cash', 'AR', 'Inventory', etc.
  created_by UUID NOT NULL REFERENCES public.profiles(id),

  -- Sampling method
  sampling_method TEXT NOT NULL CHECK (sampling_method IN ('MUS', 'classical_variables', 'attribute')),

  -- Population data
  population_size INTEGER NOT NULL CHECK (population_size > 0),
  population_value DECIMAL(15,2), -- For MUS/classical variables

  -- Sample parameters
  materiality_amount DECIMAL(15,2),
  risk_assessment TEXT CHECK (risk_assessment IN ('low', 'moderate', 'high', 'maximum')),
  expected_misstatement_rate DECIMAL(5,2), -- For attribute sampling (%)
  tolerable_misstatement DECIMAL(15,2),

  -- Calculated results
  sample_size INTEGER NOT NULL,
  sampling_interval DECIMAL(15,2), -- For MUS
  random_seed INTEGER, -- For reproducibility

  -- Sample selection results
  selected_items JSONB NOT NULL DEFAULT '[]', -- Array of selected item IDs/amounts

  -- Evaluation results
  actual_misstatements DECIMAL(15,2),
  projected_misstatement DECIMAL(15,2),
  upper_misstatement_limit DECIMAL(15,2),
  conclusion TEXT,

  -- Metadata
  parameters JSONB NOT NULL DEFAULT '{}', -- Method-specific additional parameters
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Audit trail
  workpaper_reference TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,

  CONSTRAINT valid_method_params CHECK (
    (sampling_method = 'MUS' AND population_value IS NOT NULL) OR
    (sampling_method = 'attribute' AND expected_misstatement_rate IS NOT NULL) OR
    (sampling_method = 'classical_variables' AND population_value IS NOT NULL)
  )
);

CREATE INDEX idx_audit_samples_engagement ON public.audit_samples(engagement_id);
CREATE INDEX idx_audit_samples_created_by ON public.audit_samples(created_by);
CREATE INDEX idx_audit_samples_method ON public.audit_samples(sampling_method);

ALTER TABLE public.audit_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view samples in their firm's engagements"
  ON public.audit_samples
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = audit_samples.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "Users can create samples in their firm's engagements"
  ON public.audit_samples
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "Users can update samples in their firm's engagements"
  ON public.audit_samples
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = audit_samples.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

COMMENT ON TABLE public.audit_samples IS 'Stores audit sampling calculations and results (MUS, classical variables, attribute sampling) per AU-C 530';

-- =====================================================================
-- 2. MATERIALITY CALCULATIONS TABLE
-- =====================================================================

CREATE TABLE public.materiality_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),

  -- Financial benchmark
  benchmark_type TEXT NOT NULL CHECK (benchmark_type IN (
    'total_revenue',
    'total_assets',
    'total_equity',
    'net_income',
    'gross_profit',
    'other'
  )),
  benchmark_amount DECIMAL(15,2) NOT NULL,
  benchmark_description TEXT, -- If benchmark_type = 'other'

  -- Materiality levels
  overall_materiality DECIMAL(15,2) NOT NULL CHECK (overall_materiality > 0),
  performance_materiality DECIMAL(15,2) NOT NULL CHECK (performance_materiality > 0),
  clearly_trivial_threshold DECIMAL(15,2) NOT NULL CHECK (clearly_trivial_threshold > 0),

  -- Calculation methodology
  overall_percentage DECIMAL(5,2) NOT NULL, -- % of benchmark used for overall materiality
  performance_percentage DECIMAL(5,2) NOT NULL, -- % of overall used for performance
  trivial_percentage DECIMAL(5,2) NOT NULL, -- % of overall used for trivial

  -- Component materiality (for group audits)
  component_materiality JSONB DEFAULT '[]',

  -- Justification
  rationale TEXT NOT NULL, -- Why these thresholds were selected
  risk_factors TEXT[], -- Factors considered

  -- Approval
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,

  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true, -- Only one active calculation per engagement
  superseded_by UUID REFERENCES public.materiality_calculations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_materiality_hierarchy CHECK (
    overall_materiality > performance_materiality AND
    performance_materiality > clearly_trivial_threshold
  )
);

-- Unique constraint: only one active materiality calc per engagement
CREATE UNIQUE INDEX unique_active_materiality_per_engagement
  ON public.materiality_calculations(engagement_id)
  WHERE is_active = true;

CREATE INDEX idx_materiality_engagement ON public.materiality_calculations(engagement_id);
CREATE INDEX idx_materiality_active ON public.materiality_calculations(engagement_id, is_active) WHERE is_active = true;

ALTER TABLE public.materiality_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view materiality in their firm's engagements"
  ON public.materiality_calculations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = materiality_calculations.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "Users can create materiality in their firm's engagements"
  ON public.materiality_calculations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "Users can update materiality in their firm's engagements"
  ON public.materiality_calculations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = materiality_calculations.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

COMMENT ON TABLE public.materiality_calculations IS 'Stores materiality calculations per AU-C 320 for each engagement';

-- =====================================================================
-- 3. CONFIRMATIONS TABLE
-- =====================================================================

CREATE TABLE public.confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),

  -- Confirmation details
  confirmation_type TEXT NOT NULL CHECK (confirmation_type IN (
    'accounts_receivable',
    'accounts_payable',
    'bank_account',
    'legal_letter',
    'loan_payable',
    'inventory_held_by_third_party',
    'other'
  )),
  account_name TEXT NOT NULL, -- Customer/vendor/bank name
  account_number TEXT, -- Account/invoice/loan number

  -- Amount being confirmed
  balance_per_books DECIMAL(15,2) NOT NULL,
  as_of_date DATE NOT NULL,

  -- Request details
  request_sent_date DATE,
  request_sent_to TEXT, -- Email/address
  request_sent_by UUID REFERENCES public.profiles(id),
  reminder_sent_dates DATE[], -- Array of reminder dates

  -- Response details
  response_received_date DATE,
  response_method TEXT CHECK (response_method IN ('email', 'mail', 'fax', 'portal', 'other')),
  balance_per_confirmation DECIMAL(15,2),
  confirmation_agrees BOOLEAN,

  -- Exception handling
  exception_amount DECIMAL(15,2),
  exception_type TEXT CHECK (exception_type IN (
    'timing_difference',
    'amount_difference',
    'disputed_item',
    'unknown_account',
    'other'
  )),
  exception_resolved BOOLEAN DEFAULT false,
  exception_resolution TEXT,

  -- Alternative procedures (if no response)
  alternative_procedures_performed TEXT,
  alternative_procedures_result TEXT,
  alternative_procedures_by UUID REFERENCES public.profiles(id),
  alternative_procedures_date DATE,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', -- Request not yet sent
    'sent', -- Request sent, awaiting response
    'received', -- Response received
    'exception', -- Exception identified
    'alternative_procedures', -- Performing alternative procedures
    'resolved' -- Confirmed or alternative procedures complete
  )),

  -- Workpaper reference
  workpaper_reference TEXT,
  attachment_urls TEXT[], -- Links to scanned confirmations

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_confirmations_engagement ON public.confirmations(engagement_id);
CREATE INDEX idx_confirmations_status ON public.confirmations(status);
CREATE INDEX idx_confirmations_type ON public.confirmations(confirmation_type);

ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view confirmations in their firm's engagements"
  ON public.confirmations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = confirmations.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "Users can create confirmations in their firm's engagements"
  ON public.confirmations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "Users can update confirmations in their firm's engagements"
  ON public.confirmations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = confirmations.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

COMMENT ON TABLE public.confirmations IS 'Tracks external confirmations per AU-C 505 (AR, AP, bank confirmations)';

-- =====================================================================
-- 4. ANALYTICAL PROCEDURES TABLE
-- =====================================================================

CREATE TABLE public.analytical_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),

  -- Procedure details
  procedure_type TEXT NOT NULL CHECK (procedure_type IN (
    'ratio_analysis',
    'trend_analysis',
    'variance_analysis',
    'reasonableness_test',
    'other'
  )),
  account_area TEXT NOT NULL, -- 'Revenue', 'COGS', 'SG&A', etc.

  -- Analysis data
  current_period_amount DECIMAL(15,2) NOT NULL,
  current_period_date DATE NOT NULL,

  comparison_period_amount DECIMAL(15,2),
  comparison_period_date DATE,
  comparison_type TEXT CHECK (comparison_type IN (
    'prior_year',
    'prior_quarter',
    'budget',
    'forecast',
    'industry_average',
    'other'
  )),

  -- Calculated variance
  variance_amount DECIMAL(15,2) GENERATED ALWAYS AS (
    current_period_amount - COALESCE(comparison_period_amount, 0)
  ) STORED,
  variance_percentage DECIMAL(7,2) GENERATED ALWAYS AS (
    CASE
      WHEN comparison_period_amount IS NOT NULL AND comparison_period_amount != 0
      THEN ((current_period_amount - comparison_period_amount) / comparison_period_amount * 100)
      ELSE NULL
    END
  ) STORED,

  -- Expectation and tolerance
  expected_amount DECIMAL(15,2),
  tolerance_percentage DECIMAL(5,2) NOT NULL DEFAULT 5.0, -- 5% default threshold
  tolerance_amount DECIMAL(15,2),

  -- Evaluation
  requires_investigation BOOLEAN GENERATED ALWAYS AS (
    (
      comparison_period_amount IS NOT NULL
      AND comparison_period_amount != 0
      AND ABS((current_period_amount - comparison_period_amount) / comparison_period_amount * 100) > tolerance_percentage
    ) OR
    ABS(current_period_amount - COALESCE(comparison_period_amount, 0)) > COALESCE(tolerance_amount, 999999999)
  ) STORED,

  investigation_performed BOOLEAN DEFAULT false,
  investigation_notes TEXT,
  investigation_conclusion TEXT,

  -- Ratio-specific data
  ratio_name TEXT, -- 'Current Ratio', 'Quick Ratio', etc.
  ratio_current_value DECIMAL(10,4),
  ratio_comparison_value DECIMAL(10,4),
  ratio_industry_benchmark DECIMAL(10,4),

  -- Metadata
  workpaper_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytical_procedures_engagement ON public.analytical_procedures(engagement_id);
CREATE INDEX idx_analytical_procedures_type ON public.analytical_procedures(procedure_type);
CREATE INDEX idx_analytical_procedures_investigation ON public.analytical_procedures(requires_investigation);

ALTER TABLE public.analytical_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytical procedures in their firm's engagements"
  ON public.analytical_procedures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = analytical_procedures.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "Users can create analytical procedures in their firm's engagements"
  ON public.analytical_procedures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "Users can update analytical procedures in their firm's engagements"
  ON public.analytical_procedures
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = analytical_procedures.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

COMMENT ON TABLE public.analytical_procedures IS 'Stores analytical procedures per AU-C 520 (ratio, trend, variance analysis)';

-- =====================================================================
-- 5. AUDIT ADJUSTMENTS TABLE
-- =====================================================================

CREATE TABLE public.audit_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),

  -- Adjustment identification
  adjustment_number TEXT NOT NULL, -- 'AJE-1', 'PJE-1', etc.
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN (
    'proposed', -- Proposed adjusting journal entry (AJE)
    'passed', -- Passed adjusting journal entry (PJE) - client declined
    'waived' -- Waived by auditor (below trivial threshold)
  )),

  -- Classification
  misstatement_type TEXT NOT NULL CHECK (misstatement_type IN (
    'factual', -- Known error
    'judgmental', -- Difference in estimate
    'projected' -- Projected from sample
  )),

  -- Journal entry
  description TEXT NOT NULL,
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),

  -- Additional debits/credits (for complex entries)
  additional_entries JSONB DEFAULT '[]',

  -- Financial statement impact
  affects_income_statement BOOLEAN NOT NULL DEFAULT true,
  affects_balance_sheet BOOLEAN NOT NULL DEFAULT true,
  income_statement_impact DECIMAL(15,2),
  balance_sheet_impact DECIMAL(15,2),

  -- Materiality assessment
  is_material BOOLEAN,
  materiality_percentage DECIMAL(5,2), -- % of overall materiality
  is_above_trivial BOOLEAN,

  -- Client response
  presented_to_client BOOLEAN DEFAULT false,
  presentation_date DATE,
  client_response TEXT CHECK (client_response IN (
    'accepted',
    'declined',
    'pending',
    'not_presented'
  )),
  client_response_date DATE,
  client_response_notes TEXT,

  -- Posting
  posted_by_client BOOLEAN DEFAULT false,
  posted_date DATE,

  -- Grouping (for SUM - Summary of Uncorrected Misstatements)
  included_in_sum BOOLEAN DEFAULT false,
  sum_category TEXT,

  -- Approval
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,

  -- Metadata
  workpaper_reference TEXT,
  supporting_documentation_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_adjustment_number_per_engagement UNIQUE (engagement_id, adjustment_number)
);

CREATE INDEX idx_audit_adjustments_engagement ON public.audit_adjustments(engagement_id);
CREATE INDEX idx_audit_adjustments_type ON public.audit_adjustments(adjustment_type);
CREATE INDEX idx_audit_adjustments_material ON public.audit_adjustments(is_material);
CREATE INDEX idx_audit_adjustments_sum ON public.audit_adjustments(included_in_sum) WHERE included_in_sum = true;

ALTER TABLE public.audit_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view adjustments in their firm's engagements"
  ON public.audit_adjustments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = audit_adjustments.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "Users can create adjustments in their firm's engagements"
  ON public.audit_adjustments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "Users can update adjustments in their firm's engagements"
  ON public.audit_adjustments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = audit_adjustments.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

-- View: Summary of Uncorrected Misstatements (SUM)
CREATE VIEW public.sum_by_engagement AS
SELECT
  engagement_id,
  COUNT(*) as total_uncorrected_items,
  SUM(CASE WHEN affects_income_statement THEN income_statement_impact ELSE 0 END) as total_income_statement_impact,
  SUM(CASE WHEN affects_balance_sheet THEN balance_sheet_impact ELSE 0 END) as total_balance_sheet_impact,
  SUM(amount) as total_uncorrected_amount,
  MAX(materiality_percentage) as max_materiality_percentage,
  STRING_AGG(adjustment_number, ', ' ORDER BY adjustment_number) as adjustment_numbers
FROM public.audit_adjustments
WHERE included_in_sum = true
  AND adjustment_type IN ('passed', 'waived')
GROUP BY engagement_id;

COMMENT ON TABLE public.audit_adjustments IS 'Tracks audit adjustments (SAJ/PJE) and SUM per AU-C 450';
COMMENT ON VIEW public.sum_by_engagement IS 'Summary of Uncorrected Misstatements by engagement';

-- =====================================================================
-- 6. INDEPENDENCE DECLARATIONS TABLE
-- =====================================================================

CREATE TABLE public.independence_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES public.audits(id) ON DELETE SET NULL, -- NULL for firm-wide annual
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,

  -- Declaration type
  declaration_type TEXT NOT NULL CHECK (declaration_type IN (
    'annual_firm_wide',
    'engagement_specific',
    'new_hire',
    'periodic_update'
  )),

  -- Coverage period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Independence status
  is_independent BOOLEAN NOT NULL,

  -- Disclosed conflicts/threats
  conflicts_disclosed JSONB DEFAULT '[]',
  financial_interests JSONB DEFAULT '{}',
  business_relationships JSONB DEFAULT '{}',
  family_relationships JSONB DEFAULT '{}',
  recent_employment JSONB DEFAULT '{}',

  -- NAS (Non-Audit Services) considerations
  non_audit_services_provided TEXT[],
  nas_independence_threats TEXT[],
  nas_safeguards_applied TEXT[],

  -- Attestation
  attestation_statement TEXT NOT NULL DEFAULT 'I hereby declare that I am independent with respect to the above entity/firm in accordance with the AICPA Code of Professional Conduct and applicable independence standards.',
  digital_signature TEXT,
  attestation_date DATE NOT NULL,
  ip_address INET,

  -- Approval (for exceptions)
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,

  -- Review
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_period CHECK (period_end >= period_start),
  CONSTRAINT engagement_or_firmwide CHECK (
    (declaration_type = 'annual_firm_wide' AND engagement_id IS NULL) OR
    (declaration_type != 'annual_firm_wide')
  )
);

CREATE INDEX idx_independence_user ON public.independence_declarations(user_id);
CREATE INDEX idx_independence_engagement ON public.independence_declarations(engagement_id);
CREATE INDEX idx_independence_firm ON public.independence_declarations(firm_id);
CREATE INDEX idx_independence_type ON public.independence_declarations(declaration_type);
CREATE INDEX idx_independence_period ON public.independence_declarations(period_start, period_end);
CREATE INDEX idx_independence_pending_approval ON public.independence_declarations(requires_approval, approved_at) WHERE requires_approval = true AND approved_at IS NULL;

ALTER TABLE public.independence_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own independence declarations"
  ON public.independence_declarations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR firm_id = public.user_firm_id(auth.uid()));

CREATE POLICY "Users can create their own independence declarations"
  ON public.independence_declarations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND firm_id = public.user_firm_id(auth.uid()));

CREATE POLICY "Users can update their own independence declarations"
  ON public.independence_declarations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND firm_id = public.user_firm_id(auth.uid()));

COMMENT ON TABLE public.independence_declarations IS 'Tracks independence declarations per AICPA Code and SEC/PCAOB requirements';

-- =====================================================================
-- 7. SUBSEQUENT EVENTS TABLE
-- =====================================================================

CREATE TABLE public.subsequent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),

  -- Event details
  event_date DATE NOT NULL,
  event_description TEXT NOT NULL,

  -- Classification per AU-C 560
  event_type TEXT NOT NULL CHECK (event_type IN (
    'type_1_adjusting', -- Provides evidence of conditions that existed at balance sheet date
    'type_2_disclosure' -- Provides evidence of conditions that arose after balance sheet date
  )),

  -- Balance sheet date (for reference)
  balance_sheet_date DATE NOT NULL,
  audit_report_date DATE,

  -- Financial impact
  has_financial_impact BOOLEAN NOT NULL DEFAULT false,
  estimated_financial_impact DECIMAL(15,2),
  financial_impact_description TEXT,

  -- Management response
  management_assessment TEXT,
  management_action_taken TEXT,

  -- Audit response
  requires_adjustment BOOLEAN NOT NULL DEFAULT false,
  adjustment_recorded BOOLEAN DEFAULT false,
  adjustment_reference UUID REFERENCES public.audit_adjustments(id),

  requires_disclosure BOOLEAN NOT NULL DEFAULT false,
  disclosure_included BOOLEAN DEFAULT false,
  disclosure_reference TEXT,
  disclosure_text TEXT,

  requires_opinion_modification BOOLEAN DEFAULT false,
  opinion_modification_type TEXT CHECK (opinion_modification_type IN (
    'emphasis_of_matter',
    'going_concern',
    'other_matter',
    'qualified',
    'adverse',
    'disclaimer'
  )),

  -- Resolution
  resolution_status TEXT NOT NULL DEFAULT 'identified' CHECK (resolution_status IN (
    'identified',
    'assessing',
    'resolved',
    'pending_client'
  )),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,

  -- Metadata
  identified_by UUID REFERENCES public.profiles(id),
  identified_date DATE NOT NULL,
  workpaper_reference TEXT,
  supporting_documentation TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT event_after_balance_sheet CHECK (event_date >= balance_sheet_date),
  CONSTRAINT event_before_report CHECK (
    audit_report_date IS NULL OR event_date <= audit_report_date
  )
);

CREATE INDEX idx_subsequent_events_engagement ON public.subsequent_events(engagement_id);
CREATE INDEX idx_subsequent_events_type ON public.subsequent_events(event_type);
CREATE INDEX idx_subsequent_events_status ON public.subsequent_events(resolution_status);
CREATE INDEX idx_subsequent_events_date ON public.subsequent_events(event_date);

ALTER TABLE public.subsequent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subsequent events in their firm's engagements"
  ON public.subsequent_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = subsequent_events.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "Users can create subsequent events in their firm's engagements"
  ON public.subsequent_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "Users can update subsequent events in their firm's engagements"
  ON public.subsequent_events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = subsequent_events.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

COMMENT ON TABLE public.subsequent_events IS 'Tracks subsequent events per AU-C 560 (Type I adjusting and Type II disclosure events)';

-- =====================================================================
-- 8. CLIENT PBC ITEMS TABLE
-- =====================================================================

CREATE TABLE public.client_pbc_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),

  -- PBC item details
  item_number TEXT NOT NULL, -- 'PBC-001', 'PBC-002', etc.
  item_description TEXT NOT NULL,
  item_category TEXT,

  -- Request details
  requested_from TEXT,
  requested_from_email TEXT,
  requested_date DATE NOT NULL,
  due_date DATE NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Instructions
  specific_instructions TEXT,
  example_provided BOOLEAN DEFAULT false,
  example_url TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_progress',
    'partial',
    'received',
    'follow_up_needed',
    'waived'
  )),

  -- Receipt details
  received_date DATE,
  received_from TEXT,
  received_method TEXT CHECK (received_method IN ('email', 'portal', 'mail', 'in_person', 'other')),

  -- Completeness check
  is_complete BOOLEAN DEFAULT false,
  completeness_notes TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,

  -- Follow-up tracking
  follow_up_count INTEGER DEFAULT 0,
  last_follow_up_date DATE,
  next_follow_up_date DATE,

  -- File storage
  file_urls TEXT[],
  file_location TEXT,

  -- Workpaper link
  workpaper_reference TEXT,
  used_in_procedures TEXT[],

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_pbc_number_per_engagement UNIQUE (engagement_id, item_number)
);

CREATE INDEX idx_client_pbc_engagement ON public.client_pbc_items(engagement_id);
CREATE INDEX idx_client_pbc_status ON public.client_pbc_items(status);
CREATE INDEX idx_client_pbc_due_date ON public.client_pbc_items(due_date);
CREATE INDEX idx_client_pbc_priority ON public.client_pbc_items(priority);
CREATE INDEX idx_client_pbc_overdue ON public.client_pbc_items(due_date, status) WHERE status IN ('pending', 'in_progress', 'partial');

ALTER TABLE public.client_pbc_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view PBC items in their firm's engagements"
  ON public.client_pbc_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = client_pbc_items.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "Users can create PBC items in their firm's engagements"
  ON public.client_pbc_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "Users can update PBC items in their firm's engagements"
  ON public.client_pbc_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = client_pbc_items.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

-- View: Overdue PBC Items
CREATE VIEW public.overdue_pbc_items AS
SELECT
  pbc.*,
  a.audit_title as engagement_name,
  a.client_id,
  CURRENT_DATE - pbc.due_date as days_overdue
FROM public.client_pbc_items pbc
JOIN public.audits a ON a.id = pbc.engagement_id
WHERE pbc.status IN ('pending', 'in_progress', 'partial')
  AND pbc.due_date < CURRENT_DATE
ORDER BY pbc.due_date ASC;

COMMENT ON TABLE public.client_pbc_items IS 'Tracks client-provided items (PBC list) for audit engagements';
COMMENT ON VIEW public.overdue_pbc_items IS 'View of all overdue PBC items across engagements';

-- =====================================================================
-- TABLE MODIFICATIONS: Enhance existing audits table
-- =====================================================================

-- Add engagement management fields to audits table
ALTER TABLE public.audits
ADD COLUMN IF NOT EXISTS current_phase TEXT CHECK (current_phase IN ('planning', 'fieldwork', 'review', 'reporting', 'complete')),
ADD COLUMN IF NOT EXISTS phase_start_date DATE,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS budget_warning_threshold DECIMAL(5,2) DEFAULT 90.0,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_audits_current_phase ON public.audits(current_phase) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_audits_last_activity ON public.audits(last_activity_at DESC);

COMMENT ON COLUMN public.audits.current_phase IS 'Current phase of the audit for engagement detail page tab highlighting';
COMMENT ON COLUMN public.audits.budget_warning_threshold IS 'Percentage threshold for budget variance warnings (default 90%)';

-- =====================================================================
-- HELPER FUNCTIONS
-- =====================================================================

-- Function: Calculate MUS Sample Size
CREATE OR REPLACE FUNCTION public.calculate_mus_sample_size(
  p_population_value DECIMAL,
  p_materiality DECIMAL,
  p_expected_misstatement DECIMAL DEFAULT 0,
  p_risk_factor DECIMAL DEFAULT 3.0
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_sampling_interval DECIMAL;
  v_sample_size INTEGER;
BEGIN
  v_sampling_interval := (p_materiality - p_expected_misstatement) / p_risk_factor;
  v_sample_size := CEIL(p_population_value / v_sampling_interval)::INTEGER;

  IF v_sample_size < 25 THEN
    v_sample_size := 25;
  END IF;

  RETURN v_sample_size;
END;
$$;

COMMENT ON FUNCTION public.calculate_mus_sample_size IS 'Calculates MUS sample size given population value, materiality, and risk';

-- Function: Get User Engagement Count
CREATE OR REPLACE FUNCTION public.get_user_engagement_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.audits a
  WHERE a.firm_id = public.user_firm_id(p_user_id)
    AND a.is_archived = false
    AND (
      a.lead_auditor_id = p_user_id
      OR a.manager_id = p_user_id
      OR EXISTS (
        SELECT 1 FROM public.audit_team_members atm
        WHERE atm.audit_id = a.id
        AND atm.user_id = p_user_id
      )
    );
$$;

COMMENT ON FUNCTION public.get_user_engagement_count IS 'Returns count of active engagements for a user';

-- =====================================================================
-- COMPLETION MESSAGE
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ PHASE 1 MIGRATION COMPLETE';
  RAISE NOTICE '   8 new audit tool tables created successfully';
  RAISE NOTICE '   - audit_samples';
  RAISE NOTICE '   - materiality_calculations';
  RAISE NOTICE '   - confirmations';
  RAISE NOTICE '   - analytical_procedures';
  RAISE NOTICE '   - audit_adjustments (with SUM view)';
  RAISE NOTICE '   - independence_declarations';
  RAISE NOTICE '   - subsequent_events';
  RAISE NOTICE '   - client_pbc_items (with overdue view)';
  RAISE NOTICE '';
  RAISE NOTICE '   All RLS policies applied with firm isolation';
  RAISE NOTICE '   All indexes created for optimal query performance';
  RAISE NOTICE '   Helper functions installed';
  RAISE NOTICE '';
  RAISE NOTICE '   Next: Run Phase 1b migration for TanStack Query hooks';
END $$;
