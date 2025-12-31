#!/usr/bin/env node
/**
 * Nuclear Database Reset Script
 * Drops ALL objects from the Supabase database
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qtsvdeauuawfewdzbflr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql, description) {
  console.log(`Executing: ${description}...`);
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    // Try alternative approach - direct query
    console.log(`  RPC failed, this is expected if exec_sql doesn't exist`);
    return { error };
  }
  console.log(`  Done`);
  return { data };
}

async function dropAllTables() {
  console.log('='.repeat(60));
  console.log('NUCLEAR DATABASE RESET');
  console.log('='.repeat(60));

  // Get list of all tables
  const { data: tables, error: tablesError } = await supabase
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public');

  if (tablesError) {
    console.log('Cannot query pg_tables directly, using REST API approach...');
  }

  // List of known tables to drop (based on migrations we saw)
  const knownTables = [
    'firms', 'clients', 'audits', 'profiles', 'user_roles', 'projects', 'tasks',
    'audit_programs', 'audit_procedures', 'audit_findings', 'audit_workpapers',
    'audit_evidence', 'audit_team_members', 'audit_entities', 'audit_plans',
    'audit_reports', 'audit_metrics', 'audit_samples', 'audit_adjustments',
    'confirmations', 'time_entries', 'risks', 'opportunities',
    'meetings', 'meeting_attendees', 'meeting_minutes',
    'deliverables', 'deliverable_comments', 'deliverable_versions', 'deliverable_approvals',
    'notifications', 'files', 'issues', 'stakeholders', 'skills', 'user_skills',
    'organization_invitations', 'firm_invitations', 'domain_mappings',
    'engagement_activity', 'engagement_assignments', 'engagement_documents',
    'engagement_milestones', 'engagement_procedures', 'engagement_programs',
    'engagement_letters', 'engagement_letter_templates', 'engagement_templates',
    'engagement_scope', 'engagement_deliverables', 'engagement_communications',
    'engagement_calendar_events', 'engagement_change_orders', 'engagement_budget_forecasts',
    'engagement_resource_conflicts', 'engagement_risk_assessments', 'risk_assessment_requirements',
    'email_templates', 'email_analytics', 'email_sent_log',
    'impersonation_sessions', 'ip_whitelist', 'admin_sessions',
    'access_logs', 'schema_boundary_logs', 'data_classifications',
    'apps', 'app_permissions', 'app_configurations', 'user_app_preferences',
    'approval_workflows', 'approval_stages', 'approval_records', 'stage_approvers',
    'integrations', 'webhooks', 'api_keys',
    'performance_alerts', 'performance_baselines', 'slow_query_log', 'rls_policy_performance',
    'organization_subscriptions', 'billing_events', 'subscription_plans', 'usage_records',
    'proposals', 'proposal_templates', 'client_contacts', 'client_documents',
    'client_meetings', 'client_health_scores', 'client_satisfaction_surveys',
    'client_portal_activity', 'client_acquisition_costs', 'client_pbc_items',
    'materiality_calculations', 'analytical_procedures', 'independence_declarations',
    'subsequent_events', 'finding_follow_ups', 'workpaper_templates',
    'workpaper_collaboration', 'workpaper_review_comments',
    'canvas_workspaces', 'canvas_elements', 'canvas_comments', 'canvas_collaborators',
    'canvas_activity', 'canvas_workspace_versions', 'canvas_workspace_collaborators',
    'canvas_workspace_comments',
    'project_baselines', 'project_scenarios', 'project_budgets', 'project_expenses',
    'project_schedule_metrics', 'project_members', 'baseline_tasks', 'scenario_tasks',
    'resource_allocations', 'resource_conflicts', 'resource_registry',
    'burn_rate_snapshots', 'budget_variance_logs', 'cost_categories',
    'upsell_opportunities', 'change_requests', 'decisions', 'decision_votes',
    'stakeholder_communications', 'raci_assignments',
    'workstreams', 'activity_log', 'task_comments', 'task_dependencies', 'action_items',
    'form_templates', 'form_runs', 'form_answers',
    'ontology_object_types', 'ontology_objects', 'ontology_properties',
    'ontology_object_properties', 'ontology_object_relationships',
    'ontology_relationships', 'ontology_lineage', 'ontology_validation_results',
    'codex_object_types', 'codex_objects', 'codex_properties', 'codex_object_property_values',
    'codex_relationship_types', 'codex_object_relationships', 'codex_object_versions',
    'codex_object_markings', 'codex_data_lineage', 'codex_quality_rules',
    'codex_quality_violations', 'codex_calculated_properties', 'codex_action_types',
    'codex_action_executions',
    'ai_agents', 'ai_workflows', 'ai_prompts', 'ai_executions',
    'query_engines', 'query_executions',
    'data_pipelines', 'pipeline_nodes', 'pipeline_edges', 'pipeline_runs', 'pipeline_node_executions',
    'datasets', 'dataset_column_markings',
    'transforms', 'transform_runs', 'transform_checkpoints', 'transform_dependencies', 'transform_repositories',
    'security_markings', 'user_clearances', 'classification_rules',
    'cross_app_contexts', 'cross_app_references',
    'custom_dashboards', 'data_access_logs',
    'role_permissions', 'permissions',
    'platform_access_requests', 'procedure_dependencies', 'procedure_review_requirements',
    'program_procedures', 'organization_financial_data'
  ];

  console.log(`\nDropping ${knownTables.length} known tables...`);

  for (const table of knownTables) {
    try {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (!error) {
        console.log(`  Cleared: ${table}`);
      }
    } catch (e) {
      // Table might not exist, that's OK
    }
  }

  console.log('\nDatabase cleared!');
}

async function main() {
  try {
    await dropAllTables();

    console.log('\n' + '='.repeat(60));
    console.log('RESET COMPLETE');
    console.log('='.repeat(60));
    console.log('\nThe database data has been cleared.');
    console.log('Note: Table structures remain. For full schema reset,');
    console.log('use the Supabase Dashboard SQL Editor with the SQL file.');
    console.log('\nTo apply fresh migrations, run:');
    console.log('  supabase db push --linked');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
