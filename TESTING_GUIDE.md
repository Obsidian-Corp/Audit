# Risk-Based Audit System - Testing Guide

## Quick Start

### 1. Apply Migrations

Navigate to your Supabase Dashboard → SQL Editor and execute these files in order:

```sql
-- File 1: supabase/migrations/20251130000000_create_risk_assessment_tables.sql
-- File 2: supabase/migrations/20251130000001_enhance_procedures_with_risk_metadata.sql
-- File 3: supabase/migrations/20251130000002_create_finding_tables.sql
```

### 2. Verify Installation

```sql
-- Check all tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'engagement_risk_assessments',
  'risk_assessment_areas',
  'procedure_risk_mappings',
  'audit_findings'
);
-- Should return 4 rows

-- Check templates seeded
SELECT template_name, industry FROM risk_assessment_templates;
-- Should return 3 templates: Healthcare, Technology, General

-- Check procedures enhanced
SELECT COUNT(*) FROM audit_procedures
WHERE risk_area_tags IS NOT NULL;
-- Should return count of enhanced procedures
```

### 3. Test Risk Assessment Wizard

Add this to an engagement page component:

```typescript
import { RiskAssessmentWizard } from '@/components/audit/risk/RiskAssessmentWizard';
import { useState } from 'react';

function YourEngagementPage() {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div>
      <Button onClick={() => setShowWizard(true)}>
        Start Risk Assessment
      </Button>

      <RiskAssessmentWizard
        engagementId="your-engagement-id"
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={(assessmentId) => {
          console.log('Assessment created:', assessmentId);
          setShowWizard(false);
        }}
      />
    </div>
  );
}
```

### 4. Test Flow

**Step 1: Business Understanding**
- Select Industry: Healthcare
- Company Size: Medium
- Check a few complexity factors

**Step 2: Risk Scoring** 
- Keep defaults or adjust risks
- Watch combined risk auto-calculate
- Add risk rationale

**Step 3: Fraud Risk**
- Check 2-3 fraud factors
- Set overall fraud risk

**Step 4: IT Risk**
- Set IT dependency
- Set cybersecurity risk

**Step 5: Review**
- Review heat map
- Check overall risk calculation
- Click "Complete Assessment"

**Expected Result:**
- Success toast notification
- Assessment saved to database
- Can query: `SELECT * FROM engagement_risk_assessments WHERE engagement_id = 'your-id'`

### 5. Test Procedure Recommendations

```typescript
import { recommendProcedures } from '@/utils/procedureRecommendations';
import { useRiskAssessment, useRiskAssessmentAreas } from '@/hooks/useRiskAssessment';

function ProcedureRecommendations({ engagementId }) {
  const { data: assessment } = useRiskAssessment(engagementId);
  const { data: areas } = useRiskAssessmentAreas(assessment?.id);

  // Fetch procedures and mappings from DB
  // Then:
  const result = recommendProcedures(assessment, areas, procedures, mappings);

  console.log('Recommended procedures:', result.recommendations);
  console.log('Coverage:', result.coverage_analysis);
  console.log('Hours:', result.total_estimated_hours);
}
```

### 6. Test Finding Dialog

```typescript
import { FindingDialog } from '@/components/audit/findings/FindingDialog';

<FindingDialog
  isOpen={true}
  onClose={() => {}}
  onSave={async (data) => {
    await supabase.from('audit_findings').insert({
      engagement_id: 'your-engagement-id',
      ...data
    });
  }}
  engagementId="your-engagement-id"
  planningMateriality={100000}
  performanceMateriality={75000}
  trivialThreshold={5000}
/>
```

**Test Cases:**
- Enter amount less than trivial → Shows "Below Trivial"
- Enter amount > performance materiality → Shows alert
- Add multiple affected accounts
- Add risk areas

## Troubleshooting

### Issue: Migrations fail

**Solution:** Check execution order, verify no syntax errors, check database permissions

### Issue: Components not rendering

**Solution:** Verify imports, check console for errors, ensure Supabase client configured

### Issue: No recommendations returned

**Solution:** Check risk areas are marked as material, verify procedures have risk_area_tags, check database has mappings

### Issue: RLS errors

**Solution:** Verify user is authenticated, check firm_id in profiles table matches

## Database Queries for Testing

```sql
-- View risk assessments
SELECT * FROM engagement_risk_assessments 
WHERE engagement_id = 'your-engagement-id';

-- View risk areas
SELECT ra.area_name, ra.combined_risk, ra.is_material_area
FROM risk_assessment_areas ra
JOIN engagement_risk_assessments era ON ra.risk_assessment_id = era.id
WHERE era.engagement_id = 'your-engagement-id';

-- View procedure recommendations (simulated)
SELECT * FROM get_recommended_procedures(
  'risk-assessment-id',
  'healthcare'
);

-- View findings
SELECT * FROM audit_findings 
WHERE engagement_id = 'your-engagement-id'
ORDER BY severity DESC;

-- Check procedure enhancements
SELECT procedure_code, procedure_name, risk_area_tags, applicable_risk_levels
FROM audit_procedures
WHERE risk_area_tags IS NOT NULL
LIMIT 10;
```

## Expected Results

### After Migration
- 12 new tables created
- 18 indexes created
- 4 SQL functions available
- 3 risk assessment templates
- 100+ procedures enhanced

### After Risk Assessment
- 1 row in engagement_risk_assessments
- 5+ rows in risk_assessment_areas
- Visual heat map displays
- Overall risk calculated

### After Recommendations
- 10-20 procedures recommended
- Required/Recommended priorities assigned
- Coverage analysis shows gaps
- Hours adjusted by risk level

### After Finding Creation
- 1 row in audit_findings
- Materiality auto-calculated
- Affected areas linked
- Impact assessed

## Performance Benchmarks

- Risk assessment save: <2 seconds
- Heat map render: <500ms
- Recommendations calculation: <1 second
- Finding dialog load: <200ms

---

**Need help?** Check console for errors, verify database connection, ensure migrations applied in correct order.
