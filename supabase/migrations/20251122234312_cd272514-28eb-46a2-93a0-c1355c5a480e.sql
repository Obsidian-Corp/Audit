-- Phase 11: Comprehensive Seed Data for Audit Programs
-- This migration adds extensive program templates and procedures across multiple frameworks

-- Insert additional program templates
INSERT INTO audit_program_templates (firm_id, template_name, description, audit_type, industry, is_standard, is_active)
SELECT 
  f.id,
  t.template_name,
  t.description,
  t.audit_type,
  t.industry,
  true,
  true
FROM firms f
CROSS JOIN (
  VALUES
    -- Financial Statement Audit Programs
    ('Financial Statement Audit - Healthcare', 'Comprehensive financial statement audit program tailored for healthcare organizations', 'Financial Statement Audit', 'Healthcare'),
    ('Financial Statement Audit - Financial Services', 'Financial statement audit program for banks, credit unions, and financial institutions', 'Financial Statement Audit', 'Financial Services'),
    ('Financial Statement Audit - Technology', 'Financial audit program designed for software and technology companies', 'Financial Statement Audit', 'Technology'),
    
    -- IT General Controls
    ('IT General Controls Assessment', 'Comprehensive ITGC audit program covering access, change management, and operations', 'IT Audit', 'Technology'),
    ('IT General Controls - Financial Services', 'ITGC program tailored for financial institutions with regulatory requirements', 'IT Audit', 'Financial Services'),
    
    -- HIPAA Compliance
    ('HIPAA Security & Privacy Compliance', 'Complete HIPAA compliance audit covering Security Rule and Privacy Rule', 'Compliance Audit', 'Healthcare'),
    
    -- ISO 27001
    ('ISO 27001 Information Security Audit', 'ISO 27001 certification audit program covering all control domains', 'Compliance Audit', 'Technology'),
    
    -- SOC 2 Type II Expansion
    ('SOC 2 Type II - SaaS Platform', 'SOC 2 Type II audit optimized for SaaS platform providers', 'Compliance Audit', 'Technology')
) AS t(template_name, description, audit_type, industry)
ON CONFLICT DO NOTHING;

-- Insert Financial Statement Audit Procedures (Part 1)
INSERT INTO audit_procedures (firm_id, procedure_code, procedure_name, category, objective, estimated_hours, risk_level, procedure_type, is_active, instructions, evidence_requirements, sample_size_guidance)
SELECT 
  f.id,
  p.procedure_code,
  p.procedure_name,
  p.category,
  p.objective,
  p.estimated_hours,
  p.risk_level,
  p.procedure_type,
  true,
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', p.instructions))))),
  jsonb_build_array(p.evidence_req),
  p.sample_guidance
FROM firms f
CROSS JOIN (
  VALUES
    -- Cash & Cash Equivalents (8 procedures)
    ('FSA-100', 'Bank Reconciliations Review', 'Cash & Equivalents', 'Verify accuracy and completeness of bank reconciliations', 4, 'high', 'Substantive', 'Review all material bank account reconciliations. Verify mathematical accuracy, investigate old outstanding items, and confirm reconciling items clear in subsequent period.', 'Bank reconciliations, bank statements, outstanding check lists', 'All material accounts (>5% of total cash)'),
    ('FSA-101', 'Bank Confirmations', 'Cash & Equivalents', 'Confirm cash balances with financial institutions', 3, 'high', 'Substantive', 'Send bank confirmation requests to all financial institutions. Follow up on non-responses and reconcile confirmed amounts to general ledger.', 'Bank confirmations, account statements', 'All bank accounts'),
    ('FSA-102', 'Cash Cutoff Testing', 'Cash & Equivalents', 'Test proper period cutoff for cash transactions', 2, 'medium', 'Substantive', 'Review deposits and disbursements around year-end to ensure transactions are recorded in proper period. Test last 5 business days before and after year-end.', 'Bank statements, cash receipts, disbursement records', '10-15 transactions per direction'),
    ('FSA-103', 'Restricted Cash Review', 'Cash & Equivalents', 'Identify and verify disclosure of restricted cash', 2, 'medium', 'Substantive', 'Review cash accounts for restrictions. Verify proper classification and disclosure of restricted amounts. Obtain supporting documentation for restrictions.', 'Loan agreements, trust documents, board minutes', 'All restricted balances'),
    ('FSA-104', 'Foreign Currency Translation', 'Cash & Equivalents', 'Verify foreign currency translation accuracy', 3, 'medium', 'Substantive', 'For foreign currency denominated accounts, verify translation at proper exchange rates. Recalculate translation adjustments and verify proper recording.', 'Foreign bank statements, exchange rate documentation', 'All foreign currency accounts'),
    ('FSA-105', 'Cash Flow Statement Reconciliation', 'Cash & Equivalents', 'Reconcile cash flow statement to balance sheet changes', 4, 'medium', 'Analytical', 'Reconcile beginning and ending cash balances per cash flow statement to balance sheet. Investigate significant variances. Verify proper classification of cash flows.', 'Cash flow statement, balance sheet, general ledger', 'Full reconciliation'),
    ('FSA-106', 'Petty Cash Count', 'Cash & Equivalents', 'Verify existence and accuracy of petty cash funds', 1, 'low', 'Substantive', 'Perform surprise count of petty cash funds. Verify proper authorization of disbursements and timely replenishment. Test mathematical accuracy of fund.', 'Petty cash records, receipts, count sheets', 'All petty cash funds'),
    ('FSA-107', 'Cash Controls Testing', 'Cash & Equivalents', 'Test internal controls over cash handling and disbursements', 3, 'high', 'Control Testing', 'Test segregation of duties, approval controls, and reconciliation procedures. Review access controls to banking systems. Test check signing procedures.', 'Cash handling policies, approval documentation, access logs', '25 transactions'),
    
    -- Accounts Receivable (10 procedures)
    ('FSA-200', 'AR Aging Analysis', 'Accounts Receivable', 'Analyze AR aging and assess collectibility', 4, 'high', 'Analytical', 'Obtain detailed AR aging. Analyze trends and identify concerning patterns. Assess reasonableness of aging categories and credit terms compliance.', 'AR aging report, credit policies, collection records', 'Full aging analysis'),
    ('FSA-201', 'AR Confirmations', 'Accounts Receivable', 'Confirm receivable balances with customers', 6, 'high', 'Substantive', 'Send positive confirmations to sample of customers. Follow up on non-responses and exceptions. Perform alternative procedures for non-responses using subsequent cash receipts and supporting documentation.', 'AR confirmations, invoices, shipping documents, cash receipts', 'Material balances covering 60-70% of total AR'),
    ('FSA-202', 'Allowance for Doubtful Accounts', 'Accounts Receivable', 'Assess adequacy of bad debt allowance', 5, 'high', 'Substantive', 'Evaluate methodology for calculating allowance. Test historical collection rates and aging analysis. Assess specific identification of uncollectible accounts. Compare to industry benchmarks.', 'Allowance calculation, write-off history, collection data, aging reports', 'Full reserve calculation review'),
    ('FSA-203', 'Revenue Recognition Testing', 'Accounts Receivable', 'Test revenue recognition compliance with accounting standards', 6, 'high', 'Substantive', 'Review revenue recognition policies for compliance with ASC 606. Test sample of transactions for proper recognition timing. Verify performance obligations are properly identified and satisfied.', 'Sales contracts, invoices, shipping records, revenue recognition memos', '30-40 transactions across revenue streams'),
    ('FSA-204', 'AR Cutoff Testing', 'Accounts Receivable', 'Test proper period cutoff for revenue and receivables', 3, 'high', 'Substantive', 'Review sales transactions before and after year-end to ensure proper period recording. Test last 10 days before and first 5 days after period end. Verify goods shipped and invoiced in proper period.', 'Invoices, shipping logs, sales orders', '15-20 transactions per direction'),
    ('FSA-205', 'Subsequent Cash Receipts', 'Accounts Receivable', 'Test subsequent collection of receivables', 3, 'medium', 'Substantive', 'Review cash receipts for 30-60 days after year-end. Match receipts to year-end AR balances. Investigate any material balances not collected within normal terms.', 'Bank deposits, cash receipts journal, AR subledger', 'Sufficient to cover 50% of year-end AR'),
    ('FSA-206', 'Related Party Receivables', 'Accounts Receivable', 'Identify and evaluate related party transactions', 3, 'medium', 'Substantive', 'Identify all related party receivables through management inquiry and transaction review. Verify proper disclosure and arms length terms. Assess collectibility separately from trade receivables.', 'Related party listing, transaction documentation, board minutes', 'All related party balances'),
    ('FSA-207', 'AR Controls Testing', 'Accounts Receivable', 'Test internal controls over AR and revenue cycle', 4, 'high', 'Control Testing', 'Test credit approval procedures, segregation of duties in revenue cycle, write-off authorizations, and reconciliation controls. Review IT controls over revenue system.', 'Credit policies, approval documentation, system access reports', '25-30 transactions'),
    ('FSA-208', 'Contract Assets and Liabilities', 'Accounts Receivable', 'Verify contract assets and deferred revenue balances', 4, 'medium', 'Substantive', 'For entities with contract assets or liabilities under ASC 606, verify proper calculation and classification. Test opening and closing balance reconciliations. Verify timing of revenue recognition.', 'Contract asset schedules, revenue recognition memos, contracts', 'Material contracts'),
    ('FSA-209', 'Unbilled Receivables', 'Accounts Receivable', 'Test unbilled receivables for existence and valuation', 3, 'medium', 'Substantive', 'Verify existence and accuracy of unbilled receivables. Test subsequent billing. Evaluate whether revenue recognition is appropriate prior to billing. Assess collectibility.', 'Unbilled receivables schedule, timesheets, contracts, subsequent invoices', 'Material unbilled amounts'),
    
    -- Inventory (8 procedures)
    ('FSA-300', 'Physical Inventory Observation', 'Inventory', 'Observe physical inventory count procedures', 8, 'high', 'Substantive', 'Attend physical inventory counts. Test count procedures and controls. Perform independent test counts of sample items. Trace test counts to final inventory listing and vice versa.', 'Count sheets, test count documentation, final inventory listing', '30-50 items'),
    ('FSA-301', 'Inventory Valuation Testing', 'Inventory', 'Test inventory valuation at lower of cost or NRV', 5, 'high', 'Substantive', 'Test cost accumulation for sample of items. Verify proper cost flow method (FIFO, average, etc.). Test NRV by comparing costs to recent sales prices and market conditions. Identify slow-moving or obsolete items.', 'Cost records, recent sales invoices, purchase invoices, market data', '25-30 significant items'),
    ('FSA-302', 'Inventory Obsolescence Reserve', 'Inventory', 'Assess adequacy of obsolescence reserve', 4, 'high', 'Substantive', 'Evaluate methodology for obsolescence reserve. Analyze slow-moving inventory reports. Review subsequent sales and usage. Test reserves for specifically identified obsolete items.', 'Obsolescence calculation, movement reports, sales data', 'All reserved items'),
    ('FSA-303', 'Inventory Cutoff Testing', 'Inventory', 'Test proper cutoff for inventory purchases and sales', 3, 'high', 'Substantive', 'Review last receipts and shipments before year-end and first after year-end. Verify proper period recording. Test that inventory and payables/receivables are recorded in same period.', 'Receiving reports, shipping documents, purchase orders, sales invoices', '10-15 transactions per direction'),
    ('FSA-304', 'Inventory Reconciliation', 'Inventory', 'Reconcile inventory subledger to general ledger', 2, 'medium', 'Substantive', 'Obtain inventory subledger and reconcile total to GL balance. Investigate significant reconciling items. Verify proper classification of inventory categories.', 'Inventory subledger, GL detail, reconciliation', 'Full reconciliation'),
    ('FSA-305', 'Work in Process Valuation', 'Inventory', 'Test WIP inventory valuation and stage of completion', 5, 'high', 'Substantive', 'For manufacturing entities, test WIP valuation. Verify costs accumulated properly including materials, labor, and overhead. Assess stage of completion estimates. Test overhead allocation rates.', 'Job cost sheets, labor records, overhead calculations, production schedules', 'Significant WIP jobs'),
    ('FSA-306', 'Consignment Inventory', 'Inventory', 'Identify and verify proper treatment of consignment inventory', 2, 'medium', 'Substantive', 'Identify consignment inventory through inquiry and contract review. Verify excluded from company inventory if held on consignment. Verify included if out on consignment to customers.', 'Consignment agreements, inventory listings', 'All consignment arrangements'),
    ('FSA-307', 'Inventory Controls Testing', 'Inventory', 'Test internal controls over inventory', 3, 'high', 'Control Testing', 'Test cycle count procedures, approval of inventory adjustments, physical security controls, and system access controls. Review segregation of duties.', 'Inventory policies, cycle count records, adjustment approvals', '20-25 transactions'),
    
    -- Fixed Assets (7 procedures)  
    ('FSA-400', 'Fixed Asset Additions', 'Fixed Assets', 'Test additions to fixed assets', 4, 'medium', 'Substantive', 'Review and test sample of asset additions. Verify proper capitalization vs expense treatment per policy. Verify existence through physical inspection or other evidence. Test proper classification and placed-in-service dates.', 'Fixed asset register, invoices, capital budgets, photos', '15-20 significant additions'),
    ('FSA-401', 'Fixed Asset Disposals', 'Fixed Assets', 'Test disposals and retirements of fixed assets', 3, 'medium', 'Substantive', 'Review disposals and retirements. Verify proper removal from asset register. Test gain/loss calculations. Verify disposals occurred (no longer owned or in use).', 'Disposal documentation, sales agreements, asset register', 'All material disposals'),
    ('FSA-402', 'Depreciation Testing', 'Fixed Assets', 'Test depreciation calculations and useful lives', 4, 'medium', 'Substantive', 'Test depreciation calculations for accuracy. Verify appropriate useful lives and methods per policy and standards. Assess reasonableness of useful life estimates. Recalculate depreciation for sample of assets.', 'Depreciation schedules, asset policies, calculations', '20-25 assets across classes'),
    ('FSA-403', 'Physical Inspection of Assets', 'Fixed Assets', 'Physically inspect material fixed assets', 4, 'medium', 'Substantive', 'Perform physical inspection of significant assets. Verify existence and condition. Identify any assets not recorded. Assess indicators of impairment.', 'Asset register, photos, inspection notes', 'Major assets and sample of smaller items'),
    ('FSA-404', 'Leased Assets - ASC 842', 'Fixed Assets', 'Test lease accounting compliance with ASC 842', 5, 'high', 'Substantive', 'Review lease population. Test classification as operating vs finance lease. Verify right-of-use asset and lease liability calculations. Test discount rate determination and lease term estimates.', 'Lease agreements, lease calculations, discount rate support', 'All material leases'),
    ('FSA-405', 'Asset Impairment Assessment', 'Fixed Assets', 'Assess potential impairment of long-lived assets', 4, 'medium', 'Substantive', 'Review for impairment indicators. Test management impairment analyses. Evaluate fair value estimates and cash flow projections. Assess reasonableness of key assumptions.', 'Impairment memos, valuations, cash flow projections', 'All potentially impaired assets'),
    ('FSA-406', 'Construction in Progress', 'Fixed Assets', 'Test CIP balances and capitalization', 3, 'medium', 'Substantive', 'Review CIP projects. Verify costs are properly capitalized. Test for completed projects that should be placed in service. Verify interest capitalization if applicable.', 'Project accounting, invoices, completion certificates, CIP schedules', 'Significant CIP projects'),
    
    -- Accounts Payable & Liabilities (8 procedures)
    ('FSA-500', 'AP Confirmations', 'Accounts Payable', 'Confirm payable balances with vendors', 3, 'medium', 'Substantive', 'Send confirmations to sample of significant vendors and vendors with unusual balances. Follow up on non-responses. Investigate differences between confirmed amounts and recorded balances.', 'AP confirmations, vendor statements, invoices', 'Major vendors and unusual items'),
    ('FSA-501', 'AP Cutoff Testing', 'Accounts Payable', 'Test proper period cutoff for purchases', 3, 'high', 'Substantive', 'Review receiving and invoice processing around year-end. Test last 10 days before and first 5 days after period end. Verify goods received are recorded as payables in proper period.', 'Receiving reports, invoices, POs, vendor statements', '15-20 transactions per direction'),
    ('FSA-502', 'Search for Unrecorded Liabilities', 'Accounts Payable', 'Identify unrecorded liabilities', 4, 'high', 'Substantive', 'Review post year-end disbursements for payments of pre year-end obligations. Review open purchase orders and receiving reports. Investigate large or unusual post year-end invoices.', 'Subsequent disbursements, open POs, receiving reports, invoices', '30 days post year-end'),
    ('FSA-503', 'Accrued Liabilities Testing', 'Accounts Payable', 'Test accrued liability balances', 3, 'medium', 'Substantive', 'Test calculation of accrued expenses including payroll, professional fees, utilities, and other operating expenses. Verify completeness and accuracy. Test subsequent payment.', 'Accrual schedules, invoices, contracts, subsequent payments', 'All material accruals'),
    ('FSA-504', 'Contingent Liabilities Review', 'Accounts Payable', 'Identify and evaluate contingent liabilities', 3, 'medium', 'Substantive', 'Review attorney letters, board minutes, and contracts for contingent liabilities. Evaluate loss contingencies per ASC 450. Verify proper disclosure or accrual.', 'Attorney letters, board minutes, contracts, management representations', 'All known contingencies'),
    ('FSA-505', 'Debt Obligations Testing', 'Long-term Debt', 'Test debt balances and covenant compliance', 4, 'high', 'Substantive', 'Confirm debt balances with lenders. Review debt agreements for terms and covenants. Test compliance with debt covenants. Verify current vs long-term classification.', 'Loan agreements, debt confirmations, compliance calculations', 'All debt obligations'),
    ('FSA-506', 'Lease Liability Testing', 'Long-term Debt', 'Test lease liability calculations under ASC 842', 4, 'high', 'Substantive', 'Review lease population. Test lease liability calculations for accuracy. Verify discount rates and lease terms. Test current vs long-term classification. Verify financial statement disclosure.', 'Lease agreements, liability calculations, amortization schedules', 'All material leases'),
    ('FSA-507', 'Related Party Payables', 'Accounts Payable', 'Identify and evaluate related party payables', 2, 'medium', 'Substantive', 'Identify all related party payables through inquiry and transaction review. Verify proper disclosure and arms length terms. Assess appropriateness of balances.', 'Related party listing, transaction documentation, board minutes', 'All related party balances')
) AS p(procedure_code, procedure_name, category, objective, estimated_hours, risk_level, procedure_type, instructions, evidence_req, sample_guidance)
ON CONFLICT (firm_id, procedure_code) DO NOTHING;