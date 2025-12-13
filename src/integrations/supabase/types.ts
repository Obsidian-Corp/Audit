export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      action_items: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          deliverable_id: string | null
          description: string | null
          due_date: string | null
          firm_id: string
          id: string
          meeting_id: string | null
          priority: string
          project_id: string | null
          status: string
          task_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          deliverable_id?: string | null
          description?: string | null
          due_date?: string | null
          firm_id: string
          id?: string
          meeting_id?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          task_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          deliverable_id?: string | null
          description?: string | null
          due_date?: string | null
          firm_id?: string
          id?: string
          meeting_id?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          task_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_items_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_organization_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          project_id: string | null
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          agent_type: Database["public"]["Enums"]["ai_agent_type"]
          configuration: Json
          created_at: string
          created_by: string | null
          description: string | null
          firm_id: string
          id: string
          is_template: boolean | null
          metadata: Json | null
          model: string | null
          name: string
          status: Database["public"]["Enums"]["ai_agent_status"]
          system_prompt: string | null
          template_category: string | null
          updated_at: string
        }
        Insert: {
          agent_type?: Database["public"]["Enums"]["ai_agent_type"]
          configuration?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          firm_id: string
          id?: string
          is_template?: boolean | null
          metadata?: Json | null
          model?: string | null
          name: string
          status?: Database["public"]["Enums"]["ai_agent_status"]
          system_prompt?: string | null
          template_category?: string | null
          updated_at?: string
        }
        Update: {
          agent_type?: Database["public"]["Enums"]["ai_agent_type"]
          configuration?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          firm_id?: string
          id?: string
          is_template?: boolean | null
          metadata?: Json | null
          model?: string | null
          name?: string
          status?: Database["public"]["Enums"]["ai_agent_status"]
          system_prompt?: string | null
          template_category?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_executions: {
        Row: {
          agent_id: string | null
          completed_at: string | null
          cost_usd: number | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          executed_by: string | null
          execution_data: Json | null
          execution_result: Json | null
          firm_id: string
          id: string
          started_at: string | null
          status: Database["public"]["Enums"]["ai_execution_status"]
          tokens_used: number | null
          workflow_id: string | null
        }
        Insert: {
          agent_id?: string | null
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          executed_by?: string | null
          execution_data?: Json | null
          execution_result?: Json | null
          firm_id: string
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_execution_status"]
          tokens_used?: number | null
          workflow_id?: string | null
        }
        Update: {
          agent_id?: string | null
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          executed_by?: string | null
          execution_data?: Json | null
          execution_result?: Json | null
          firm_id?: string
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_execution_status"]
          tokens_used?: number | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_executions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "ai_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompts: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          firm_id: string
          id: string
          max_tokens: number | null
          model: string | null
          name: string
          parent_prompt_id: string | null
          prompt_template: string
          status: Database["public"]["Enums"]["ai_agent_status"]
          tags: string[] | null
          temperature: number | null
          updated_at: string
          variables: Json | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          firm_id: string
          id?: string
          max_tokens?: number | null
          model?: string | null
          name: string
          parent_prompt_id?: string | null
          prompt_template: string
          status?: Database["public"]["Enums"]["ai_agent_status"]
          tags?: string[] | null
          temperature?: number | null
          updated_at?: string
          variables?: Json | null
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          firm_id?: string
          id?: string
          max_tokens?: number | null
          model?: string | null
          name?: string
          parent_prompt_id?: string | null
          prompt_template?: string
          status?: Database["public"]["Enums"]["ai_agent_status"]
          tags?: string[] | null
          temperature?: number | null
          updated_at?: string
          variables?: Json | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompts_parent_prompt_id_fkey"
            columns: ["parent_prompt_id"]
            isOneToOne: false
            referencedRelation: "ai_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_workflows: {
        Row: {
          agent_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          firm_id: string
          id: string
          name: string
          status: Database["public"]["Enums"]["ai_agent_status"]
          trigger_config: Json | null
          trigger_type: Database["public"]["Enums"]["ai_trigger_type"]
          updated_at: string
          version: number
          workflow_definition: Json
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          firm_id: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["ai_agent_status"]
          trigger_config?: Json | null
          trigger_type?: Database["public"]["Enums"]["ai_trigger_type"]
          updated_at?: string
          version?: number
          workflow_definition?: Json
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          firm_id?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["ai_agent_status"]
          trigger_config?: Json | null
          trigger_type?: Database["public"]["Enums"]["ai_trigger_type"]
          updated_at?: string
          version?: number
          workflow_definition?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_workflows_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          firm_id: string
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          metadata: Json | null
          name: string
          scopes: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          firm_id: string
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          metadata?: Json | null
          name: string
          scopes?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          firm_id?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          metadata?: Json | null
          name?: string
          scopes?: Json
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      app_configurations: {
        Row: {
          app_id: string
          config: Json
          created_at: string
          firm_id: string
          id: string
          updated_at: string
        }
        Insert: {
          app_id: string
          config?: Json
          created_at?: string
          firm_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          config?: Json
          created_at?: string
          firm_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_configurations_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_configurations_organization_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      app_permissions: {
        Row: {
          app_id: string
          created_at: string
          firm_id: string
          id: string
          is_enabled: boolean
        }
        Insert: {
          app_id: string
          created_at?: string
          firm_id: string
          id?: string
          is_enabled?: boolean
        }
        Update: {
          app_id?: string
          created_at?: string
          firm_id?: string
          id?: string
          is_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "app_permissions_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_permissions_organization_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_records: {
        Row: {
          approver_id: string
          comments: string | null
          created_at: string | null
          decided_at: string | null
          deliverable_approval_id: string
          id: string
          stage_id: string
          status: string
        }
        Insert: {
          approver_id: string
          comments?: string | null
          created_at?: string | null
          decided_at?: string | null
          deliverable_approval_id: string
          id?: string
          stage_id: string
          status?: string
        }
        Update: {
          approver_id?: string
          comments?: string | null
          created_at?: string | null
          decided_at?: string | null
          deliverable_approval_id?: string
          id?: string
          stage_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_records_deliverable_approval_id_fkey"
            columns: ["deliverable_approval_id"]
            isOneToOne: false
            referencedRelation: "deliverable_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_records_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "approval_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_stages: {
        Row: {
          approval_type: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          required_approvals: number | null
          stage_order: number
          workflow_id: string
        }
        Insert: {
          approval_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          required_approvals?: number | null
          stage_order: number
          workflow_id: string
        }
        Update: {
          approval_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          required_approvals?: number | null
          stage_order?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_stages_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "approval_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_workflows: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          firm_id: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          firm_id: string
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          firm_id?: string
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_workflows_organization_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      apps: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          requires_setup: boolean
          route_prefix: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          requires_setup?: boolean
          route_prefix: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          requires_setup?: boolean
          route_prefix?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_entities: {
        Row: {
          audit_frequency: string | null
          created_at: string
          created_by: string | null
          description: string | null
          entity_code: string
          entity_name: string
          entity_type: string
          firm_id: string
          id: string
          last_audit_date: string | null
          metadata: Json | null
          next_audit_date: string | null
          parent_entity_id: string | null
          risk_score: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          audit_frequency?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_code: string
          entity_name: string
          entity_type: string
          firm_id: string
          id?: string
          last_audit_date?: string | null
          metadata?: Json | null
          next_audit_date?: string | null
          parent_entity_id?: string | null
          risk_score?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          audit_frequency?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_code?: string
          entity_name?: string
          entity_type?: string
          firm_id?: string
          id?: string
          last_audit_date?: string | null
          metadata?: Json | null
          next_audit_date?: string | null
          parent_entity_id?: string | null
          risk_score?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_entities_parent_entity_id_fkey"
            columns: ["parent_entity_id"]
            isOneToOne: false
            referencedRelation: "audit_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_evidence: {
        Row: {
          audit_id: string
          collected_by: string | null
          collected_date: string | null
          collection_method: string | null
          created_at: string
          description: string | null
          evidence_number: string
          evidence_type: string
          file_size: number | null
          firm_id: string
          id: string
          metadata: Json | null
          mime_type: string | null
          source: string | null
          storage_path: string | null
          title: string
          updated_at: string
          verification_date: string | null
          verified_by: string | null
          workpaper_id: string | null
        }
        Insert: {
          audit_id: string
          collected_by?: string | null
          collected_date?: string | null
          collection_method?: string | null
          created_at?: string
          description?: string | null
          evidence_number: string
          evidence_type: string
          file_size?: number | null
          firm_id: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          source?: string | null
          storage_path?: string | null
          title: string
          updated_at?: string
          verification_date?: string | null
          verified_by?: string | null
          workpaper_id?: string | null
        }
        Update: {
          audit_id?: string
          collected_by?: string | null
          collected_date?: string | null
          collection_method?: string | null
          created_at?: string
          description?: string | null
          evidence_number?: string
          evidence_type?: string
          file_size?: number | null
          firm_id?: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          source?: string | null
          storage_path?: string | null
          title?: string
          updated_at?: string
          verification_date?: string | null
          verified_by?: string | null
          workpaper_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_evidence_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_evidence_workpaper_id_fkey"
            columns: ["workpaper_id"]
            isOneToOne: false
            referencedRelation: "audit_workpapers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_findings: {
        Row: {
          actual_completion_date: string | null
          attachments: Json | null
          audit_id: string
          cause: string | null
          closed_by: string | null
          closed_date: string | null
          condition_description: string
          corrective_action_plan: string | null
          created_at: string
          criteria: string | null
          effect: string | null
          financial_impact: number | null
          finding_number: string
          finding_title: string
          finding_type: string
          firm_id: string
          id: string
          identified_by: string | null
          identified_date: string | null
          management_response: string | null
          previous_finding_id: string | null
          recommendation: string | null
          repeat_finding: boolean | null
          responsible_party: string | null
          review_date: string | null
          reviewed_by: string | null
          risk_rating: string | null
          severity: string
          status: string | null
          target_completion_date: string | null
          updated_at: string
        }
        Insert: {
          actual_completion_date?: string | null
          attachments?: Json | null
          audit_id: string
          cause?: string | null
          closed_by?: string | null
          closed_date?: string | null
          condition_description: string
          corrective_action_plan?: string | null
          created_at?: string
          criteria?: string | null
          effect?: string | null
          financial_impact?: number | null
          finding_number: string
          finding_title: string
          finding_type: string
          firm_id: string
          id?: string
          identified_by?: string | null
          identified_date?: string | null
          management_response?: string | null
          previous_finding_id?: string | null
          recommendation?: string | null
          repeat_finding?: boolean | null
          responsible_party?: string | null
          review_date?: string | null
          reviewed_by?: string | null
          risk_rating?: string | null
          severity: string
          status?: string | null
          target_completion_date?: string | null
          updated_at?: string
        }
        Update: {
          actual_completion_date?: string | null
          attachments?: Json | null
          audit_id?: string
          cause?: string | null
          closed_by?: string | null
          closed_date?: string | null
          condition_description?: string
          corrective_action_plan?: string | null
          created_at?: string
          criteria?: string | null
          effect?: string | null
          financial_impact?: number | null
          finding_number?: string
          finding_title?: string
          finding_type?: string
          firm_id?: string
          id?: string
          identified_by?: string | null
          identified_date?: string | null
          management_response?: string | null
          previous_finding_id?: string | null
          recommendation?: string | null
          repeat_finding?: boolean | null
          responsible_party?: string | null
          review_date?: string | null
          reviewed_by?: string | null
          risk_rating?: string | null
          severity?: string
          status?: string | null
          target_completion_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          firm_id: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          firm_id?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          firm_id?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_metrics: {
        Row: {
          created_at: string
          dimension: Json | null
          firm_id: string
          id: string
          metric_date: string
          metric_type: string
          metric_unit: string | null
          metric_value: number | null
        }
        Insert: {
          created_at?: string
          dimension?: Json | null
          firm_id: string
          id?: string
          metric_date?: string
          metric_type: string
          metric_unit?: string | null
          metric_value?: number | null
        }
        Update: {
          created_at?: string
          dimension?: Json | null
          firm_id?: string
          id?: string
          metric_date?: string
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number | null
        }
        Relationships: []
      }
      audit_plans: {
        Row: {
          allocated_hours: number | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          firm_id: string
          id: string
          plan_name: string
          plan_period: string
          plan_year: number
          start_date: string
          status: string | null
          total_budget: number | null
          updated_at: string
        }
        Insert: {
          allocated_hours?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          firm_id: string
          id?: string
          plan_name: string
          plan_period: string
          plan_year: number
          start_date: string
          status?: string | null
          total_budget?: number | null
          updated_at?: string
        }
        Update: {
          allocated_hours?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          firm_id?: string
          id?: string
          plan_name?: string
          plan_period?: string
          plan_year?: number
          start_date?: string
          status?: string | null
          total_budget?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_procedures: {
        Row: {
          category: string
          control_objectives: Json | null
          created_at: string | null
          created_by: string | null
          estimated_hours: number | null
          evidence_requirements: Json | null
          expected_outcomes: string | null
          firm_id: string
          id: string
          instructions: Json | null
          is_active: boolean | null
          objective: string | null
          procedure_code: string
          procedure_name: string
          procedure_type: string | null
          risk_level: string | null
          sample_size_guidance: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          control_objectives?: Json | null
          created_at?: string | null
          created_by?: string | null
          estimated_hours?: number | null
          evidence_requirements?: Json | null
          expected_outcomes?: string | null
          firm_id: string
          id?: string
          instructions?: Json | null
          is_active?: boolean | null
          objective?: string | null
          procedure_code: string
          procedure_name: string
          procedure_type?: string | null
          risk_level?: string | null
          sample_size_guidance?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          control_objectives?: Json | null
          created_at?: string | null
          created_by?: string | null
          estimated_hours?: number | null
          evidence_requirements?: Json | null
          expected_outcomes?: string | null
          firm_id?: string
          id?: string
          instructions?: Json | null
          is_active?: boolean | null
          objective?: string | null
          procedure_code?: string
          procedure_name?: string
          procedure_type?: string | null
          risk_level?: string | null
          sample_size_guidance?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_procedures_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_program_templates: {
        Row: {
          audit_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          firm_id: string
          id: string
          industry: string | null
          is_active: boolean | null
          is_standard: boolean | null
          metadata: Json | null
          template_name: string
          updated_at: string | null
        }
        Insert: {
          audit_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          firm_id: string
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_standard?: boolean | null
          metadata?: Json | null
          template_name: string
          updated_at?: string | null
        }
        Update: {
          audit_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          firm_id?: string
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_standard?: boolean | null
          metadata?: Json | null
          template_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_program_templates_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_programs: {
        Row: {
          assigned_to: string | null
          audit_id: string | null
          completion_percentage: number | null
          control_objective: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          firm_id: string
          id: string
          program_name: string
          program_type: string | null
          sample_size: number | null
          sampling_method: string | null
          status: string | null
          test_procedures: Json | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          audit_id?: string | null
          completion_percentage?: number | null
          control_objective?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          firm_id: string
          id?: string
          program_name: string
          program_type?: string | null
          sample_size?: number | null
          sampling_method?: string | null
          status?: string | null
          test_procedures?: Json | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          audit_id?: string | null
          completion_percentage?: number | null
          control_objective?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          firm_id?: string
          id?: string
          program_name?: string
          program_type?: string | null
          sample_size?: number | null
          sampling_method?: string | null
          status?: string | null
          test_procedures?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_programs_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_reports: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          attachments: Json | null
          audit_id: string
          created_at: string
          distribution_list: string[] | null
          executive_summary: string | null
          firm_id: string
          id: string
          opinion: string | null
          overall_conclusion: string | null
          prepared_by: string | null
          report_content: Json | null
          report_date: string | null
          report_number: string
          report_title: string
          report_type: string
          reviewed_by: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          attachments?: Json | null
          audit_id: string
          created_at?: string
          distribution_list?: string[] | null
          executive_summary?: string | null
          firm_id: string
          id?: string
          opinion?: string | null
          overall_conclusion?: string | null
          prepared_by?: string | null
          report_content?: Json | null
          report_date?: string | null
          report_number: string
          report_title: string
          report_type: string
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          attachments?: Json | null
          audit_id?: string
          created_at?: string
          distribution_list?: string[] | null
          executive_summary?: string | null
          firm_id?: string
          id?: string
          opinion?: string | null
          overall_conclusion?: string | null
          prepared_by?: string | null
          report_content?: Json | null
          report_date?: string | null
          report_number?: string
          report_title?: string
          report_type?: string
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_reports_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_team_members: {
        Row: {
          allocated_hours: number | null
          assigned_date: string | null
          audit_id: string
          created_at: string
          end_date: string | null
          hourly_rate: number | null
          hours_logged: number | null
          id: string
          is_backup: boolean | null
          role: string
          skills: Json | null
          start_date: string | null
          user_id: string
        }
        Insert: {
          allocated_hours?: number | null
          assigned_date?: string | null
          audit_id: string
          created_at?: string
          end_date?: string | null
          hourly_rate?: number | null
          hours_logged?: number | null
          id?: string
          is_backup?: boolean | null
          role: string
          skills?: Json | null
          start_date?: string | null
          user_id: string
        }
        Update: {
          allocated_hours?: number | null
          assigned_date?: string | null
          audit_id?: string
          created_at?: string
          end_date?: string | null
          hourly_rate?: number | null
          hours_logged?: number | null
          id?: string
          is_backup?: boolean | null
          role?: string
          skills?: Json | null
          start_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_team_members_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_workpapers: {
        Row: {
          attachments: Json | null
          audit_id: string
          content: Json | null
          created_at: string
          firm_id: string
          id: string
          prepared_by: string | null
          prepared_date: string | null
          procedure_id: string | null
          program_id: string | null
          reference_number: string
          reviewed_by: string | null
          reviewed_date: string | null
          status: string | null
          template_id: string | null
          title: string
          updated_at: string
          workpaper_type: string | null
        }
        Insert: {
          attachments?: Json | null
          audit_id: string
          content?: Json | null
          created_at?: string
          firm_id: string
          id?: string
          prepared_by?: string | null
          prepared_date?: string | null
          procedure_id?: string | null
          program_id?: string | null
          reference_number: string
          reviewed_by?: string | null
          reviewed_date?: string | null
          status?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
          workpaper_type?: string | null
        }
        Update: {
          attachments?: Json | null
          audit_id?: string
          content?: Json | null
          created_at?: string
          firm_id?: string
          id?: string
          prepared_by?: string | null
          prepared_date?: string | null
          procedure_id?: string | null
          program_id?: string | null
          reference_number?: string
          reviewed_by?: string | null
          reviewed_date?: string | null
          status?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
          workpaper_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_workpapers_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_workpapers_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "engagement_procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_workpapers_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "audit_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_workpapers_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workpaper_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          approval_comments: Json | null
          approval_requested_at: string | null
          approval_requested_by: string | null
          approved_at: string | null
          approved_by: string | null
          audit_number: string
          audit_plan_id: string | null
          audit_title: string
          audit_type: string
          blended_rate: number | null
          budget_allocated: number | null
          budget_spent: number | null
          burn_rate_warning_threshold: number | null
          client_id: string | null
          compliance_standards: string[] | null
          contingency_percentage: number | null
          created_at: string
          created_by: string | null
          entity_id: string | null
          firm_id: string
          hours_allocated: number | null
          hours_spent: number | null
          id: string
          lead_auditor_id: string | null
          manager_id: string | null
          metadata: Json | null
          objective: string | null
          opportunity_id: string | null
          planned_end_date: string | null
          planned_start_date: string | null
          pricing_model: string | null
          priority: string | null
          rejection_reason: string | null
          risk_rating: string | null
          scope: string | null
          status: string | null
          updated_at: string
          workflow_status: string | null
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          approval_comments?: Json | null
          approval_requested_at?: string | null
          approval_requested_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          audit_number: string
          audit_plan_id?: string | null
          audit_title: string
          audit_type: string
          blended_rate?: number | null
          budget_allocated?: number | null
          budget_spent?: number | null
          burn_rate_warning_threshold?: number | null
          client_id?: string | null
          compliance_standards?: string[] | null
          contingency_percentage?: number | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          firm_id: string
          hours_allocated?: number | null
          hours_spent?: number | null
          id?: string
          lead_auditor_id?: string | null
          manager_id?: string | null
          metadata?: Json | null
          objective?: string | null
          opportunity_id?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          pricing_model?: string | null
          priority?: string | null
          rejection_reason?: string | null
          risk_rating?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string
          workflow_status?: string | null
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          approval_comments?: Json | null
          approval_requested_at?: string | null
          approval_requested_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          audit_number?: string
          audit_plan_id?: string | null
          audit_title?: string
          audit_type?: string
          blended_rate?: number | null
          budget_allocated?: number | null
          budget_spent?: number | null
          burn_rate_warning_threshold?: number | null
          client_id?: string | null
          compliance_standards?: string[] | null
          contingency_percentage?: number | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          firm_id?: string
          hours_allocated?: number | null
          hours_spent?: number | null
          id?: string
          lead_auditor_id?: string | null
          manager_id?: string | null
          metadata?: Json | null
          objective?: string | null
          opportunity_id?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          pricing_model?: string | null
          priority?: string | null
          rejection_reason?: string | null
          risk_rating?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audits_audit_plan_id_fkey"
            columns: ["audit_plan_id"]
            isOneToOne: false
            referencedRelation: "audit_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "audit_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      baseline_tasks: {
        Row: {
          assigned_to: string | null
          baseline_id: string
          created_at: string
          id: string
          planned_cost: number | null
          planned_due_date: string | null
          planned_duration: number | null
          planned_effort_hours: number | null
          planned_start_date: string | null
          progress: number | null
          status: string | null
          task_id: string
          task_name: string
        }
        Insert: {
          assigned_to?: string | null
          baseline_id: string
          created_at?: string
          id?: string
          planned_cost?: number | null
          planned_due_date?: string | null
          planned_duration?: number | null
          planned_effort_hours?: number | null
          planned_start_date?: string | null
          progress?: number | null
          status?: string | null
          task_id: string
          task_name: string
        }
        Update: {
          assigned_to?: string | null
          baseline_id?: string
          created_at?: string
          id?: string
          planned_cost?: number | null
          planned_due_date?: string | null
          planned_duration?: number | null
          planned_effort_hours?: number | null
          planned_start_date?: string | null
          progress?: number | null
          status?: string | null
          task_id?: string
          task_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "baseline_tasks_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "project_baselines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baseline_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_variance_logs: {
        Row: {
          action_due_date: string | null
          action_owner: string | null
          action_status: string | null
          actual_amount: number | null
          budgeted_amount: number | null
          corrective_action: string | null
          created_at: string | null
          created_by: string | null
          engagement_id: string
          explanation: string | null
          firm_id: string
          id: string
          variance_amount: number | null
          variance_category: string | null
          variance_date: string
          variance_percent: number | null
          variance_type: string
        }
        Insert: {
          action_due_date?: string | null
          action_owner?: string | null
          action_status?: string | null
          actual_amount?: number | null
          budgeted_amount?: number | null
          corrective_action?: string | null
          created_at?: string | null
          created_by?: string | null
          engagement_id: string
          explanation?: string | null
          firm_id: string
          id?: string
          variance_amount?: number | null
          variance_category?: string | null
          variance_date: string
          variance_percent?: number | null
          variance_type: string
        }
        Update: {
          action_due_date?: string | null
          action_owner?: string | null
          action_status?: string | null
          actual_amount?: number | null
          budgeted_amount?: number | null
          corrective_action?: string | null
          created_at?: string | null
          created_by?: string | null
          engagement_id?: string
          explanation?: string | null
          firm_id?: string
          id?: string
          variance_amount?: number | null
          variance_category?: string | null
          variance_date?: string
          variance_percent?: number | null
          variance_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_variance_logs_action_owner_fkey"
            columns: ["action_owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_variance_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_variance_logs_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_variance_logs_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      burn_rate_snapshots: {
        Row: {
          burn_rate_status: string | null
          cost_spent: number | null
          created_at: string | null
          daily_burn_rate_cost: number | null
          daily_burn_rate_hours: number | null
          days_elapsed: number | null
          engagement_id: string
          firm_id: string
          hours_spent: number | null
          id: string
          projected_completion_date: string | null
          projected_total_cost: number | null
          projected_total_hours: number | null
          snapshot_date: string
        }
        Insert: {
          burn_rate_status?: string | null
          cost_spent?: number | null
          created_at?: string | null
          daily_burn_rate_cost?: number | null
          daily_burn_rate_hours?: number | null
          days_elapsed?: number | null
          engagement_id: string
          firm_id: string
          hours_spent?: number | null
          id?: string
          projected_completion_date?: string | null
          projected_total_cost?: number | null
          projected_total_hours?: number | null
          snapshot_date: string
        }
        Update: {
          burn_rate_status?: string | null
          cost_spent?: number | null
          created_at?: string | null
          daily_burn_rate_cost?: number | null
          daily_burn_rate_hours?: number | null
          days_elapsed?: number | null
          engagement_id?: string
          firm_id?: string
          hours_spent?: number | null
          id?: string
          projected_completion_date?: string | null
          projected_total_cost?: number | null
          projected_total_hours?: number | null
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "burn_rate_snapshots_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "burn_rate_snapshots_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_activity: {
        Row: {
          action: string
          canvas_id: string
          created_at: string
          details: Json | null
          firm_id: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          canvas_id: string
          created_at?: string
          details?: Json | null
          firm_id: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          canvas_id?: string
          created_at?: string
          details?: Json | null
          firm_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_activity_organization_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_collaborators: {
        Row: {
          canvas_id: string
          color: string
          created_at: string
          cursor_x: number | null
          cursor_y: number | null
          id: string
          last_seen: string
          user_id: string
        }
        Insert: {
          canvas_id: string
          color: string
          created_at?: string
          cursor_x?: number | null
          cursor_y?: number | null
          id?: string
          last_seen?: string
          user_id: string
        }
        Update: {
          canvas_id?: string
          color?: string
          created_at?: string
          cursor_x?: number | null
          cursor_y?: number | null
          id?: string
          last_seen?: string
          user_id?: string
        }
        Relationships: []
      }
      canvas_comments: {
        Row: {
          canvas_id: string
          content: string
          created_at: string
          firm_id: string
          id: string
          node_id: string | null
          position_x: number
          position_y: number
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canvas_id: string
          content: string
          created_at?: string
          firm_id: string
          id?: string
          node_id?: string | null
          position_x: number
          position_y: number
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canvas_id?: string
          content?: string
          created_at?: string
          firm_id?: string
          id?: string
          node_id?: string | null
          position_x?: number
          position_y?: number
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_comments_organization_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_elements: {
        Row: {
          codex_object_id: string | null
          connections: Json | null
          created_at: string | null
          element_data: Json | null
          element_id: string | null
          element_type: string
          id: string
          node_metadata: Json | null
          position: Json
          relationship_type_id: string | null
          style: Json | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          codex_object_id?: string | null
          connections?: Json | null
          created_at?: string | null
          element_data?: Json | null
          element_id?: string | null
          element_type: string
          id?: string
          node_metadata?: Json | null
          position?: Json
          relationship_type_id?: string | null
          style?: Json | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          codex_object_id?: string | null
          connections?: Json | null
          created_at?: string | null
          element_data?: Json | null
          element_id?: string | null
          element_type?: string
          id?: string
          node_metadata?: Json | null
          position?: Json
          relationship_type_id?: string | null
          style?: Json | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_elements_codex_object_id_fkey"
            columns: ["codex_object_id"]
            isOneToOne: false
            referencedRelation: "codex_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_elements_relationship_type_id_fkey"
            columns: ["relationship_type_id"]
            isOneToOne: false
            referencedRelation: "codex_relationship_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_elements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "canvas_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_workspace_collaborators: {
        Row: {
          created_at: string | null
          cursor_position: Json | null
          id: string
          last_seen_at: string | null
          role: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          cursor_position?: Json | null
          id?: string
          last_seen_at?: string | null
          role: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          cursor_position?: Json | null
          id?: string
          last_seen_at?: string | null
          role?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canvas_workspace_collaborators_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "canvas_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_workspace_comments: {
        Row: {
          comment: string
          created_at: string | null
          element_id: string | null
          id: string
          position: Json | null
          resolved: boolean | null
          updated_at: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string | null
          element_id?: string | null
          id?: string
          position?: Json | null
          resolved?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string | null
          element_id?: string | null
          id?: string
          position?: Json | null
          resolved?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canvas_workspace_comments_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "canvas_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_workspace_comments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "canvas_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_workspace_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          snapshot_data: Json
          version_number: number
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          snapshot_data: Json
          version_number: number
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          snapshot_data?: Json
          version_number?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canvas_workspace_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "canvas_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_workspaces: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          firm_id: string | null
          id: string
          is_template: boolean | null
          layout: Json | null
          name: string
          organization_id: string
          template_category: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          firm_id?: string | null
          id?: string
          is_template?: boolean | null
          layout?: Json | null
          name: string
          organization_id: string
          template_category?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          firm_id?: string | null
          id?: string
          is_template?: boolean | null
          layout?: Json | null
          name?: string
          organization_id?: string
          template_category?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canvas_workspaces_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_workspaces_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          approval_status: string
          approved_by: string | null
          approved_date: string | null
          change_type: string
          created_at: string
          description: string
          firm_id: string
          id: string
          impact_budget: number | null
          impact_resources: string | null
          impact_schedule: string | null
          impact_scope: string | null
          implementation_date: string | null
          justification: string | null
          priority: string
          project_id: string
          requested_by: string | null
          requested_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          approval_status?: string
          approved_by?: string | null
          approved_date?: string | null
          change_type?: string
          created_at?: string
          description: string
          firm_id: string
          id?: string
          impact_budget?: number | null
          impact_resources?: string | null
          impact_schedule?: string | null
          impact_scope?: string | null
          implementation_date?: string | null
          justification?: string | null
          priority?: string
          project_id: string
          requested_by?: string | null
          requested_date?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          approval_status?: string
          approved_by?: string | null
          approved_date?: string | null
          change_type?: string
          created_at?: string
          description?: string
          firm_id?: string
          id?: string
          impact_budget?: number | null
          impact_resources?: string | null
          impact_schedule?: string | null
          impact_scope?: string | null
          implementation_date?: string | null
          justification?: string | null
          priority?: string
          project_id?: string
          requested_by?: string | null
          requested_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_organization_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      classification_rules: {
        Row: {
          auto_apply_marking_id: string | null
          created_at: string | null
          firm_id: string
          id: string
          is_active: boolean | null
          pattern: string | null
          rule_name: string
          rule_type: string
          updated_at: string | null
        }
        Insert: {
          auto_apply_marking_id?: string | null
          created_at?: string | null
          firm_id: string
          id?: string
          is_active?: boolean | null
          pattern?: string | null
          rule_name: string
          rule_type: string
          updated_at?: string | null
        }
        Update: {
          auto_apply_marking_id?: string | null
          created_at?: string | null
          firm_id?: string
          id?: string
          is_active?: boolean | null
          pattern?: string | null
          rule_name?: string
          rule_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classification_rules_auto_apply_marking_id_fkey"
            columns: ["auto_apply_marking_id"]
            isOneToOne: false
            referencedRelation: "security_markings"
            referencedColumns: ["id"]
          },
        ]
      }
      client_acquisition_costs: {
        Row: {
          attributed_to: string | null
          client_id: string | null
          cost_amount: number
          cost_date: string
          cost_type: string
          created_at: string
          description: string | null
          firm_id: string
          id: string
          opportunity_id: string | null
          updated_at: string
        }
        Insert: {
          attributed_to?: string | null
          client_id?: string | null
          cost_amount: number
          cost_date?: string
          cost_type: string
          created_at?: string
          description?: string | null
          firm_id: string
          id?: string
          opportunity_id?: string | null
          updated_at?: string
        }
        Update: {
          attributed_to?: string | null
          client_id?: string | null
          cost_amount?: number
          cost_date?: string
          cost_type?: string
          created_at?: string
          description?: string | null
          firm_id?: string
          id?: string
          opportunity_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_acquisition_costs_attributed_to_fkey"
            columns: ["attributed_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_acquisition_costs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_acquisition_costs_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_acquisition_costs_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          birthday: string | null
          client_id: string
          communication_preference: string | null
          created_at: string
          department: string | null
          email: string | null
          first_name: string
          id: string
          is_decision_maker: boolean | null
          is_primary: boolean | null
          last_contact_date: string | null
          last_name: string
          mobile: string | null
          notes: string | null
          phone: string | null
          relationship_strength: string | null
          title: string | null
          updated_at: string
          work_anniversary: string | null
        }
        Insert: {
          birthday?: string | null
          client_id: string
          communication_preference?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_decision_maker?: boolean | null
          is_primary?: boolean | null
          last_contact_date?: string | null
          last_name: string
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          relationship_strength?: string | null
          title?: string | null
          updated_at?: string
          work_anniversary?: string | null
        }
        Update: {
          birthday?: string | null
          client_id?: string
          communication_preference?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_decision_maker?: boolean | null
          is_primary?: boolean | null
          last_contact_date?: string | null
          last_name?: string
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          relationship_strength?: string | null
          title?: string | null
          updated_at?: string
          work_anniversary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          client_id: string
          created_at: string
          document_name: string
          document_type: string | null
          file_size: number | null
          id: string
          is_shared_with_client: boolean | null
          mime_type: string | null
          shared_date: string | null
          shared_with_client: boolean | null
          storage_path: string | null
          uploaded_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          document_name: string
          document_type?: string | null
          file_size?: number | null
          id?: string
          is_shared_with_client?: boolean | null
          mime_type?: string | null
          shared_date?: string | null
          shared_with_client?: boolean | null
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          document_name?: string
          document_type?: string | null
          file_size?: number | null
          id?: string
          is_shared_with_client?: boolean | null
          mime_type?: string | null
          shared_date?: string | null
          shared_with_client?: boolean | null
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_health_scores: {
        Row: {
          calculation_factors: Json | null
          client_id: string
          communication_score: number | null
          created_at: string
          engagement_score: number | null
          firm_id: string
          health_status: string | null
          id: string
          last_calculated: string | null
          overall_score: number | null
          payment_score: number | null
          satisfaction_score: number | null
          updated_at: string
        }
        Insert: {
          calculation_factors?: Json | null
          client_id: string
          communication_score?: number | null
          created_at?: string
          engagement_score?: number | null
          firm_id: string
          health_status?: string | null
          id?: string
          last_calculated?: string | null
          overall_score?: number | null
          payment_score?: number | null
          satisfaction_score?: number | null
          updated_at?: string
        }
        Update: {
          calculation_factors?: Json | null
          client_id?: string
          communication_score?: number | null
          created_at?: string
          engagement_score?: number | null
          firm_id?: string
          health_status?: string | null
          id?: string
          last_calculated?: string | null
          overall_score?: number | null
          payment_score?: number | null
          satisfaction_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_health_scores_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_health_scores_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      client_meetings: {
        Row: {
          agenda: string | null
          client_attendees: string[] | null
          client_id: string
          created_at: string
          created_by: string | null
          follow_up_items: Json | null
          id: string
          internal_attendees: string[] | null
          location: string | null
          meeting_date: string
          meeting_title: string
          meeting_type: string | null
          notes: string | null
          opportunity_id: string | null
          outcomes: string | null
          updated_at: string
        }
        Insert: {
          agenda?: string | null
          client_attendees?: string[] | null
          client_id: string
          created_at?: string
          created_by?: string | null
          follow_up_items?: Json | null
          id?: string
          internal_attendees?: string[] | null
          location?: string | null
          meeting_date: string
          meeting_title: string
          meeting_type?: string | null
          notes?: string | null
          opportunity_id?: string | null
          outcomes?: string | null
          updated_at?: string
        }
        Update: {
          agenda?: string | null
          client_attendees?: string[] | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          follow_up_items?: Json | null
          id?: string
          internal_attendees?: string[] | null
          location?: string | null
          meeting_date?: string
          meeting_title?: string
          meeting_type?: string | null
          notes?: string | null
          opportunity_id?: string | null
          outcomes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_meetings_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_activity: {
        Row: {
          activity_metadata: Json | null
          activity_type: string
          client_id: string
          created_at: string
          firm_id: string
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_metadata?: Json | null
          activity_type: string
          client_id: string
          created_at?: string
          firm_id: string
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_metadata?: Json | null
          activity_type?: string
          client_id?: string
          created_at?: string
          firm_id?: string
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_activity_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_activity_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      client_satisfaction_surveys: {
        Row: {
          client_id: string
          created_at: string
          csat_score: number | null
          engagement_id: string | null
          feedback_text: string | null
          firm_id: string
          follow_up_completed: boolean | null
          follow_up_notes: string | null
          id: string
          improvement_areas: string[] | null
          nps_score: number | null
          positive_aspects: string[] | null
          requires_follow_up: boolean | null
          responded_at: string | null
          sent_by: string | null
          survey_date: string
          survey_type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          csat_score?: number | null
          engagement_id?: string | null
          feedback_text?: string | null
          firm_id: string
          follow_up_completed?: boolean | null
          follow_up_notes?: string | null
          id?: string
          improvement_areas?: string[] | null
          nps_score?: number | null
          positive_aspects?: string[] | null
          requires_follow_up?: boolean | null
          responded_at?: string | null
          sent_by?: string | null
          survey_date?: string
          survey_type: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          csat_score?: number | null
          engagement_id?: string | null
          feedback_text?: string | null
          firm_id?: string
          follow_up_completed?: boolean | null
          follow_up_notes?: string | null
          id?: string
          improvement_areas?: string[] | null
          nps_score?: number | null
          positive_aspects?: string[] | null
          requires_follow_up?: boolean | null
          responded_at?: string | null
          sent_by?: string | null
          survey_date?: string
          survey_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_satisfaction_surveys_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_satisfaction_surveys_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_satisfaction_surveys_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_satisfaction_surveys_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          account_manager_id: string | null
          annual_revenue: number | null
          billing_preferences: Json | null
          client_code: string | null
          client_name: string
          client_since: string | null
          client_type: string | null
          company_size: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          contract_value: number | null
          created_at: string
          created_by: string | null
          firm_id: string
          id: string
          industry: string | null
          last_engagement_date: string | null
          metadata: Json | null
          next_renewal_date: string | null
          notes: string | null
          parent_client_id: string | null
          relationship_manager_id: string | null
          renewal_likelihood: string | null
          retention_status: string | null
          risk_rating: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          account_manager_id?: string | null
          annual_revenue?: number | null
          billing_preferences?: Json | null
          client_code?: string | null
          client_name: string
          client_since?: string | null
          client_type?: string | null
          company_size?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_value?: number | null
          created_at?: string
          created_by?: string | null
          firm_id: string
          id?: string
          industry?: string | null
          last_engagement_date?: string | null
          metadata?: Json | null
          next_renewal_date?: string | null
          notes?: string | null
          parent_client_id?: string | null
          relationship_manager_id?: string | null
          renewal_likelihood?: string | null
          retention_status?: string | null
          risk_rating?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_manager_id?: string | null
          annual_revenue?: number | null
          billing_preferences?: Json | null
          client_code?: string | null
          client_name?: string
          client_since?: string | null
          client_type?: string | null
          company_size?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_value?: number | null
          created_at?: string
          created_by?: string | null
          firm_id?: string
          id?: string
          industry?: string | null
          last_engagement_date?: string | null
          metadata?: Json | null
          next_renewal_date?: string | null
          notes?: string | null
          parent_client_id?: string | null
          relationship_manager_id?: string | null
          renewal_likelihood?: string | null
          retention_status?: string | null
          risk_rating?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_account_manager_id_fkey"
            columns: ["account_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_parent_client_id_fkey"
            columns: ["parent_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_relationship_manager_id_fkey"
            columns: ["relationship_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      codex_action_executions: {
        Row: {
          action_type_id: string | null
          executed_at: string | null
          executed_by: string | null
          id: string
          input_params: Json | null
          object_id: string | null
          result: Json | null
          status: string | null
        }
        Insert: {
          action_type_id?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          input_params?: Json | null
          object_id?: string | null
          result?: Json | null
          status?: string | null
        }
        Update: {
          action_type_id?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          input_params?: Json | null
          object_id?: string | null
          result?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "codex_action_executions_action_type_id_fkey"
            columns: ["action_type_id"]
            isOneToOne: false
            referencedRelation: "codex_action_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codex_action_executions_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "codex_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      codex_action_types: {
        Row: {
          action_config: Json | null
          created_at: string | null
          description: string | null
          display_name: string
          function_name: string | null
          id: string
          name: string
          object_type_id: string | null
          required_permissions: string[] | null
          updated_at: string | null
        }
        Insert: {
          action_config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name: string
          function_name?: string | null
          id?: string
          name: string
          object_type_id?: string | null
          required_permissions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          action_config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          function_name?: string | null
          id?: string
          name?: string
          object_type_id?: string | null
          required_permissions?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "codex_action_types_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "codex_object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      codex_calculated_properties: {
        Row: {
          calculation_type: string
          created_at: string | null
          dependencies: string[] | null
          formula: string | null
          id: string
          property_id: string | null
          refresh_strategy: string | null
          updated_at: string | null
        }
        Insert: {
          calculation_type: string
          created_at?: string | null
          dependencies?: string[] | null
          formula?: string | null
          id?: string
          property_id?: string | null
          refresh_strategy?: string | null
          updated_at?: string | null
        }
        Update: {
          calculation_type?: string
          created_at?: string | null
          dependencies?: string[] | null
          formula?: string | null
          id?: string
          property_id?: string | null
          refresh_strategy?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "codex_calculated_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "codex_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      codex_data_lineage: {
        Row: {
          executed_at: string
          executed_by: string | null
          id: string
          metadata: Json | null
          organization_id: string
          source_object_id: string | null
          target_object_id: string | null
          transformation_logic: string | null
          transformation_type: string
        }
        Insert: {
          executed_at?: string
          executed_by?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          source_object_id?: string | null
          target_object_id?: string | null
          transformation_logic?: string | null
          transformation_type: string
        }
        Update: {
          executed_at?: string
          executed_by?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          source_object_id?: string | null
          target_object_id?: string | null
          transformation_logic?: string | null
          transformation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "codex_data_lineage_source_object_id_fkey"
            columns: ["source_object_id"]
            isOneToOne: false
            referencedRelation: "codex_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codex_data_lineage_target_object_id_fkey"
            columns: ["target_object_id"]
            isOneToOne: false
            referencedRelation: "codex_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      codex_object_markings: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          id: string
          marking_id: string | null
          object_id: string | null
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          id?: string
          marking_id?: string | null
          object_id?: string | null
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          id?: string
          marking_id?: string | null
          object_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "codex_object_markings_marking_id_fkey"
            columns: ["marking_id"]
            isOneToOne: false
            referencedRelation: "security_markings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codex_object_markings_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "codex_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      codex_object_property_values: {
        Row: {
          created_at: string
          id: string
          object_id: string | null
          property_id: string | null
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          object_id?: string | null
          property_id?: string | null
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          object_id?: string | null
          property_id?: string | null
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "codex_object_property_values_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "codex_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codex_object_property_values_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "codex_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      codex_object_relationships: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          metadata: Json | null
          organization_id: string
          relationship_type_id: string | null
          source_object_id: string | null
          strength: number | null
          target_object_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          relationship_type_id?: string | null
          source_object_id?: string | null
          strength?: number | null
          target_object_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          relationship_type_id?: string | null
          source_object_id?: string | null
          strength?: number | null
          target_object_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "codex_object_relationships_relationship_type_id_fkey"
            columns: ["relationship_type_id"]
            isOneToOne: false
            referencedRelation: "codex_relationship_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codex_object_relationships_source_object_id_fkey"
            columns: ["source_object_id"]
            isOneToOne: false
            referencedRelation: "codex_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codex_object_relationships_target_object_id_fkey"
            columns: ["target_object_id"]
            isOneToOne: false
            referencedRelation: "codex_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      codex_object_types: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_system: boolean | null
          metadata: Json | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_system?: boolean | null
          metadata?: Json | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_system?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      codex_object_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          object_id: string | null
          property_values: Json
          valid_from: string
          valid_to: string | null
          version_number: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          object_id?: string | null
          property_values?: Json
          valid_from?: string
          valid_to?: string | null
          version_number: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          object_id?: string | null
          property_values?: Json
          valid_from?: string
          valid_to?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "codex_object_versions_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "codex_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      codex_objects: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string | null
          external_id: string | null
          external_source: string | null
          id: string
          metadata: Json | null
          name: string
          object_type_id: string | null
          organization_id: string
          status: string | null
          updated_at: string
          version: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          metadata?: Json | null
          name: string
          object_type_id?: string | null
          organization_id: string
          status?: string | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          object_type_id?: string | null
          organization_id?: string
          status?: string | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "codex_objects_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "codex_object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      codex_properties: {
        Row: {
          created_at: string
          created_by: string | null
          data_type: string
          default_value: Json | null
          description: string | null
          display_name: string
          id: string
          is_required: boolean | null
          is_unique: boolean | null
          metadata: Json | null
          name: string
          object_type_id: string | null
          organization_id: string
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_type: string
          default_value?: Json | null
          description?: string | null
          display_name: string
          id?: string
          is_required?: boolean | null
          is_unique?: boolean | null
          metadata?: Json | null
          name: string
          object_type_id?: string | null
          organization_id: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_type?: string
          default_value?: Json | null
          description?: string | null
          display_name?: string
          id?: string
          is_required?: boolean | null
          is_unique?: boolean | null
          metadata?: Json | null
          name?: string
          object_type_id?: string | null
          organization_id?: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "codex_properties_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "codex_object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      codex_quality_rules: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          object_type_id: string | null
          organization_id: string
          rule_config: Json
          rule_name: string
          rule_type: string
          severity: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          object_type_id?: string | null
          organization_id: string
          rule_config?: Json
          rule_name: string
          rule_type: string
          severity?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          object_type_id?: string | null
          organization_id?: string
          rule_config?: Json
          rule_name?: string
          rule_type?: string
          severity?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "codex_quality_rules_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "codex_object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      codex_quality_violations: {
        Row: {
          detected_at: string | null
          id: string
          object_id: string | null
          property_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          rule_id: string | null
          violation_details: Json
        }
        Insert: {
          detected_at?: string | null
          id?: string
          object_id?: string | null
          property_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rule_id?: string | null
          violation_details?: Json
        }
        Update: {
          detected_at?: string | null
          id?: string
          object_id?: string | null
          property_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rule_id?: string | null
          violation_details?: Json
        }
        Relationships: [
          {
            foreignKeyName: "codex_quality_violations_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "codex_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codex_quality_violations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "codex_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codex_quality_violations_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "codex_quality_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      codex_relationship_types: {
        Row: {
          cardinality: string
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string
          id: string
          inverse_name: string | null
          is_bidirectional: boolean | null
          metadata: Json | null
          name: string
          organization_id: string
          source_object_type_id: string | null
          target_object_type_id: string | null
          updated_at: string
        }
        Insert: {
          cardinality?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name: string
          id?: string
          inverse_name?: string | null
          is_bidirectional?: boolean | null
          metadata?: Json | null
          name: string
          organization_id: string
          source_object_type_id?: string | null
          target_object_type_id?: string | null
          updated_at?: string
        }
        Update: {
          cardinality?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string
          id?: string
          inverse_name?: string | null
          is_bidirectional?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          source_object_type_id?: string | null
          target_object_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "codex_relationship_types_source_object_type_id_fkey"
            columns: ["source_object_type_id"]
            isOneToOne: false
            referencedRelation: "codex_object_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codex_relationship_types_target_object_type_id_fkey"
            columns: ["target_object_type_id"]
            isOneToOne: false
            referencedRelation: "codex_object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_categories: {
        Row: {
          category_type: string
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
        }
        Insert: {
          category_type?: string
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
        }
        Update: {
          category_type?: string
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_app_contexts: {
        Row: {
          context_data: Json | null
          created_at: string
          expires_at: string
          id: string
          resource_id: string | null
          resource_type: string | null
          source_app_id: string
          target_app_id: string
          user_id: string
        }
        Insert: {
          context_data?: Json | null
          created_at?: string
          expires_at?: string
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          source_app_id: string
          target_app_id: string
          user_id: string
        }
        Update: {
          context_data?: Json | null
          created_at?: string
          expires_at?: string
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          source_app_id?: string
          target_app_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_app_contexts_source_app_id_fkey"
            columns: ["source_app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_app_contexts_target_app_id_fkey"
            columns: ["target_app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_app_references: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          link_type: string
          metadata: Json | null
          source_registry_id: string
          target_registry_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          link_type: string
          metadata?: Json | null
          source_registry_id: string
          target_registry_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          link_type?: string
          metadata?: Json | null
          source_registry_id?: string
          target_registry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_app_references_source_registry_id_fkey"
            columns: ["source_registry_id"]
            isOneToOne: false
            referencedRelation: "resource_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_app_references_target_registry_id_fkey"
            columns: ["target_registry_id"]
            isOneToOne: false
            referencedRelation: "resource_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_dashboards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          layout: Json
          name: string
          organization_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          layout?: Json
          name: string
          organization_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          layout?: Json
          name?: string
          organization_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_dashboards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      data_access_logs: {
        Row: {
          access_granted: boolean
          accessed_at: string | null
          action: string
          denial_reason: string | null
          id: string
          ip_address: unknown
          markings_accessed: string[] | null
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          access_granted: boolean
          accessed_at?: string | null
          action: string
          denial_reason?: string | null
          id?: string
          ip_address?: unknown
          markings_accessed?: string[] | null
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          access_granted?: boolean
          accessed_at?: string | null
          action?: string
          denial_reason?: string | null
          id?: string
          ip_address?: unknown
          markings_accessed?: string[] | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      data_pipelines: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          last_run_at: string | null
          name: string
          organization_id: string
          pipeline_config: Json
          schedule_cron: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          name: string
          organization_id: string
          pipeline_config?: Json
          schedule_cron?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          name?: string
          organization_id?: string
          pipeline_config?: Json
          schedule_cron?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      dataset_column_markings: {
        Row: {
          applied_at: string | null
          column_name: string
          dataset_id: string | null
          id: string
          marking_id: string | null
        }
        Insert: {
          applied_at?: string | null
          column_name: string
          dataset_id?: string | null
          id?: string
          marking_id?: string | null
        }
        Update: {
          applied_at?: string | null
          column_name?: string
          dataset_id?: string | null
          id?: string
          marking_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dataset_column_markings_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dataset_column_markings_marking_id_fkey"
            columns: ["marking_id"]
            isOneToOne: false
            referencedRelation: "security_markings"
            referencedColumns: ["id"]
          },
        ]
      }
      datasets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          incremental_key: string | null
          is_incremental: boolean | null
          last_materialized_at: string | null
          materialization_schedule: string | null
          name: string
          organization_id: string
          row_count: number | null
          size_bytes: number | null
          source_query: string | null
          storage_format: string | null
          storage_location: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          incremental_key?: string | null
          is_incremental?: boolean | null
          last_materialized_at?: string | null
          materialization_schedule?: string | null
          name: string
          organization_id: string
          row_count?: number | null
          size_bytes?: number | null
          source_query?: string | null
          storage_format?: string | null
          storage_location?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          incremental_key?: string | null
          is_incremental?: boolean | null
          last_materialized_at?: string | null
          materialization_schedule?: string | null
          name?: string
          organization_id?: string
          row_count?: number | null
          size_bytes?: number | null
          source_query?: string | null
          storage_format?: string | null
          storage_location?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      decision_votes: {
        Row: {
          comment: string | null
          decision_id: string
          id: string
          user_id: string
          vote: string
          voted_at: string
        }
        Insert: {
          comment?: string | null
          decision_id: string
          id?: string
          user_id: string
          vote: string
          voted_at?: string
        }
        Update: {
          comment?: string | null
          decision_id?: string
          id?: string
          user_id?: string
          vote?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_votes_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          alternatives_considered: string | null
          context: string | null
          created_at: string
          created_by: string | null
          decided_date: string | null
          decision: string
          decision_maker_id: string | null
          decision_type: string
          description: string | null
          id: string
          impact_assessment: string | null
          organization_id: string
          project_id: string
          rationale: string | null
          review_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          alternatives_considered?: string | null
          context?: string | null
          created_at?: string
          created_by?: string | null
          decided_date?: string | null
          decision: string
          decision_maker_id?: string | null
          decision_type?: string
          description?: string | null
          id?: string
          impact_assessment?: string | null
          organization_id: string
          project_id: string
          rationale?: string | null
          review_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          alternatives_considered?: string | null
          context?: string | null
          created_at?: string
          created_by?: string | null
          decided_date?: string | null
          decision?: string
          decision_maker_id?: string | null
          decision_type?: string
          description?: string | null
          id?: string
          impact_assessment?: string | null
          organization_id?: string
          project_id?: string
          rationale?: string | null
          review_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_approvals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_stage_id: string | null
          deliverable_id: string
          id: string
          started_at: string | null
          status: string
          updated_at: string | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_stage_id?: string | null
          deliverable_id: string
          id?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_stage_id?: string | null
          deliverable_id?: string
          id?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_approvals_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "approval_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverable_approvals_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverable_approvals_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "approval_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_comments: {
        Row: {
          content: string
          created_at: string
          deliverable_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deliverable_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deliverable_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_comments_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_versions: {
        Row: {
          created_at: string
          created_by: string
          deliverable_id: string
          description: string | null
          file_ids: string[] | null
          id: string
          metadata: Json | null
          status: string
          title: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          deliverable_id: string
          description?: string | null
          file_ids?: string[] | null
          id?: string
          metadata?: Json | null
          status: string
          title: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string
          deliverable_id?: string
          description?: string | null
          file_ids?: string[] | null
          id?: string
          metadata?: Json | null
          status?: string
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_versions_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          file_ids: string[] | null
          id: string
          metadata: Json | null
          project_id: string
          reviewed_by: string | null
          status: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          version: number
          workstream_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          file_ids?: string[] | null
          id?: string
          metadata?: Json | null
          project_id: string
          reviewed_by?: string | null
          status?: string
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string
          version?: number
          workstream_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          file_ids?: string[] | null
          id?: string
          metadata?: Json | null
          project_id?: string
          reviewed_by?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          version?: number
          workstream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_workstream_id_fkey"
            columns: ["workstream_id"]
            isOneToOne: false
            referencedRelation: "workstreams"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          engagement_id: string
          id: string
          metadata: Json | null
          removed_at: string | null
          role_on_engagement: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          engagement_id: string
          id?: string
          metadata?: Json | null
          removed_at?: string | null
          role_on_engagement: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          engagement_id?: string
          id?: string
          metadata?: Json | null
          removed_at?: string | null
          role_on_engagement?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_assignments_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_budget_forecasts: {
        Row: {
          actual_cost_to_date: number | null
          actual_hours_to_date: number | null
          assumptions: string | null
          confidence_level: string | null
          created_at: string | null
          created_by: string | null
          engagement_id: string
          estimated_cost_to_complete: number | null
          estimated_hours_to_complete: number | null
          firm_id: string
          forecast_date: string
          forecast_method: string | null
          forecast_total_cost: number | null
          forecast_total_hours: number | null
          id: string
          percent_complete: number | null
          risk_factors: Json | null
          variance_cost: number | null
          variance_hours: number | null
          variance_percent: number | null
        }
        Insert: {
          actual_cost_to_date?: number | null
          actual_hours_to_date?: number | null
          assumptions?: string | null
          confidence_level?: string | null
          created_at?: string | null
          created_by?: string | null
          engagement_id: string
          estimated_cost_to_complete?: number | null
          estimated_hours_to_complete?: number | null
          firm_id: string
          forecast_date: string
          forecast_method?: string | null
          forecast_total_cost?: number | null
          forecast_total_hours?: number | null
          id?: string
          percent_complete?: number | null
          risk_factors?: Json | null
          variance_cost?: number | null
          variance_hours?: number | null
          variance_percent?: number | null
        }
        Update: {
          actual_cost_to_date?: number | null
          actual_hours_to_date?: number | null
          assumptions?: string | null
          confidence_level?: string | null
          created_at?: string | null
          created_by?: string | null
          engagement_id?: string
          estimated_cost_to_complete?: number | null
          estimated_hours_to_complete?: number | null
          firm_id?: string
          forecast_date?: string
          forecast_method?: string | null
          forecast_total_cost?: number | null
          forecast_total_hours?: number | null
          id?: string
          percent_complete?: number | null
          risk_factors?: Json | null
          variance_cost?: number | null
          variance_hours?: number | null
          variance_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_budget_forecasts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_budget_forecasts_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_budget_forecasts_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_calendar_events: {
        Row: {
          all_day: boolean | null
          attendees: Json | null
          created_at: string | null
          created_by: string | null
          end_date: string
          engagement_id: string
          event_description: string | null
          event_title: string
          event_type: string
          external_calendar_id: string | null
          firm_id: string
          id: string
          location: string | null
          milestone_id: string | null
          start_date: string
          sync_error: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          attendees?: Json | null
          created_at?: string | null
          created_by?: string | null
          end_date: string
          engagement_id: string
          event_description?: string | null
          event_title: string
          event_type: string
          external_calendar_id?: string | null
          firm_id: string
          id?: string
          location?: string | null
          milestone_id?: string | null
          start_date: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          attendees?: Json | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          engagement_id?: string
          event_description?: string | null
          event_title?: string
          event_type?: string
          external_calendar_id?: string | null
          firm_id?: string
          id?: string
          location?: string | null
          milestone_id?: string | null
          start_date?: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_calendar_events_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_calendar_events_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_change_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          change_number: string
          change_type: string
          created_at: string
          description: string
          engagement_id: string
          firm_id: string
          id: string
          impact_budget: number | null
          impact_hours: number | null
          impact_timeline_days: number | null
          implemented_at: string | null
          justification: string | null
          rejection_reason: string | null
          requested_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          change_number: string
          change_type: string
          created_at?: string
          description: string
          engagement_id: string
          firm_id: string
          id?: string
          impact_budget?: number | null
          impact_hours?: number | null
          impact_timeline_days?: number | null
          implemented_at?: string | null
          justification?: string | null
          rejection_reason?: string | null
          requested_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          change_number?: string
          change_type?: string
          created_at?: string
          description?: string
          engagement_id?: string
          firm_id?: string
          id?: string
          impact_budget?: number | null
          impact_hours?: number | null
          impact_timeline_days?: number | null
          implemented_at?: string | null
          justification?: string | null
          rejection_reason?: string | null
          requested_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_change_orders_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_change_orders_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_communications: {
        Row: {
          action_items: Json | null
          attachments: Json | null
          communication_date: string
          communication_type: string
          created_at: string | null
          created_by: string | null
          decisions_made: Json | null
          duration_minutes: number | null
          engagement_id: string
          firm_id: string
          id: string
          next_steps: string | null
          participants: Json | null
          subject: string
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          action_items?: Json | null
          attachments?: Json | null
          communication_date: string
          communication_type: string
          created_at?: string | null
          created_by?: string | null
          decisions_made?: Json | null
          duration_minutes?: number | null
          engagement_id: string
          firm_id: string
          id?: string
          next_steps?: string | null
          participants?: Json | null
          subject: string
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          action_items?: Json | null
          attachments?: Json | null
          communication_date?: string
          communication_type?: string
          created_at?: string | null
          created_by?: string | null
          decisions_made?: Json | null
          duration_minutes?: number | null
          engagement_id?: string
          firm_id?: string
          id?: string
          next_steps?: string | null
          participants?: Json | null
          subject?: string
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_communications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_communications_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_communications_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_deliverables: {
        Row: {
          assigned_to: string | null
          client_accepted_at: string | null
          client_accepted_by: string | null
          created_at: string | null
          created_by: string | null
          deliverable_name: string
          deliverable_type: string
          delivered_date: string | null
          description: string | null
          due_date: string
          engagement_id: string
          file_url: string | null
          firm_id: string
          id: string
          parent_deliverable_id: string | null
          rejection_reason: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          assigned_to?: string | null
          client_accepted_at?: string | null
          client_accepted_by?: string | null
          created_at?: string | null
          created_by?: string | null
          deliverable_name: string
          deliverable_type: string
          delivered_date?: string | null
          description?: string | null
          due_date: string
          engagement_id: string
          file_url?: string | null
          firm_id: string
          id?: string
          parent_deliverable_id?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          assigned_to?: string | null
          client_accepted_at?: string | null
          client_accepted_by?: string | null
          created_at?: string | null
          created_by?: string | null
          deliverable_name?: string
          deliverable_type?: string
          delivered_date?: string | null
          description?: string | null
          due_date?: string
          engagement_id?: string
          file_url?: string | null
          firm_id?: string
          id?: string
          parent_deliverable_id?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_deliverables_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_deliverables_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_deliverables_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_deliverables_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_deliverables_parent_deliverable_id_fkey"
            columns: ["parent_deliverable_id"]
            isOneToOne: false
            referencedRelation: "engagement_deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_deliverables_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_documents: {
        Row: {
          category: string | null
          document_name: string
          document_type: string | null
          engagement_id: string
          file_size: number | null
          file_type: string | null
          file_url: string
          firm_id: string
          id: string
          is_client_visible: boolean | null
          parent_document_id: string | null
          tags: Json | null
          uploaded_at: string | null
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          category?: string | null
          document_name: string
          document_type?: string | null
          engagement_id: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          firm_id: string
          id?: string
          is_client_visible?: boolean | null
          parent_document_id?: string | null
          tags?: Json | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          category?: string | null
          document_name?: string
          document_type?: string | null
          engagement_id?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          firm_id?: string
          id?: string
          is_client_visible?: boolean | null
          parent_document_id?: string | null
          tags?: Json | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_documents_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_documents_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "engagement_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_letter_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          engagement_type: string | null
          firm_id: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          placeholders: Json | null
          template_content: string
          template_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          engagement_type?: string | null
          firm_id: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          placeholders?: Json | null
          template_content: string
          template_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          engagement_type?: string | null
          firm_id?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          placeholders?: Json | null
          template_content?: string
          template_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_letter_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_letter_templates_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_letters: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          engagement_id: string
          firm_id: string
          generated_by: string | null
          id: string
          letter_content: string
          sent_at: string | null
          signature_data: Json | null
          signed_at: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          engagement_id: string
          firm_id: string
          generated_by?: string | null
          id?: string
          letter_content: string
          sent_at?: string | null
          signature_data?: Json | null
          signed_at?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          engagement_id?: string
          firm_id?: string
          generated_by?: string | null
          id?: string
          letter_content?: string
          sent_at?: string | null
          signature_data?: Json | null
          signed_at?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_letters_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_letters_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_letters_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_letters_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_letters_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "engagement_letter_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_milestones: {
        Row: {
          actual_date: string | null
          created_at: string
          created_by: string | null
          dependencies: Json | null
          description: string | null
          engagement_id: string
          firm_id: string
          id: string
          is_critical: boolean | null
          milestone_name: string
          milestone_type: string
          planned_date: string
          status: string
          updated_at: string
        }
        Insert: {
          actual_date?: string | null
          created_at?: string
          created_by?: string | null
          dependencies?: Json | null
          description?: string | null
          engagement_id: string
          firm_id: string
          id?: string
          is_critical?: boolean | null
          milestone_name: string
          milestone_type: string
          planned_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          actual_date?: string | null
          created_at?: string
          created_by?: string | null
          dependencies?: Json | null
          description?: string | null
          engagement_id?: string
          firm_id?: string
          id?: string
          is_critical?: boolean | null
          milestone_name?: string
          milestone_type?: string
          planned_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_milestones_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_milestones_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_procedures: {
        Row: {
          actual_hours: number | null
          assigned_by: string | null
          assigned_to: string | null
          completed_at: string | null
          conclusion: string | null
          created_at: string | null
          dependencies: Json | null
          due_date: string | null
          engagement_id: string
          engagement_program_id: string
          estimated_hours: number | null
          evidence_collected: Json | null
          exceptions_noted: string | null
          id: string
          instructions: Json | null
          priority: string | null
          procedure_id: string | null
          procedure_name: string
          quality_score: number | null
          review_notes: string | null
          review_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          workpaper_id: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          conclusion?: string | null
          created_at?: string | null
          dependencies?: Json | null
          due_date?: string | null
          engagement_id: string
          engagement_program_id: string
          estimated_hours?: number | null
          evidence_collected?: Json | null
          exceptions_noted?: string | null
          id?: string
          instructions?: Json | null
          priority?: string | null
          procedure_id?: string | null
          procedure_name: string
          quality_score?: number | null
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          workpaper_id?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          conclusion?: string | null
          created_at?: string | null
          dependencies?: Json | null
          due_date?: string | null
          engagement_id?: string
          engagement_program_id?: string
          estimated_hours?: number | null
          evidence_collected?: Json | null
          exceptions_noted?: string | null
          id?: string
          instructions?: Json | null
          priority?: string | null
          procedure_id?: string | null
          procedure_name?: string
          quality_score?: number | null
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          workpaper_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_procedures_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_procedures_engagement_program_id_fkey"
            columns: ["engagement_program_id"]
            isOneToOne: false
            referencedRelation: "engagement_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_procedures_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "audit_procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_procedures_workpaper_id_fkey"
            columns: ["workpaper_id"]
            isOneToOne: false
            referencedRelation: "audit_workpapers"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_programs: {
        Row: {
          completed_procedures: number | null
          created_at: string | null
          created_by: string | null
          engagement_id: string
          id: string
          program_name: string
          program_template_id: string | null
          status: string | null
          total_procedures: number | null
          updated_at: string | null
        }
        Insert: {
          completed_procedures?: number | null
          created_at?: string | null
          created_by?: string | null
          engagement_id: string
          id?: string
          program_name: string
          program_template_id?: string | null
          status?: string | null
          total_procedures?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_procedures?: number | null
          created_at?: string | null
          created_by?: string | null
          engagement_id?: string
          id?: string
          program_name?: string
          program_template_id?: string | null
          status?: string | null
          total_procedures?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_programs_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_programs_program_template_id_fkey"
            columns: ["program_template_id"]
            isOneToOne: false
            referencedRelation: "audit_program_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_resource_conflicts: {
        Row: {
          conflict_end: string
          conflict_start: string
          conflict_type: string | null
          conflicting_engagement_id: string | null
          created_at: string | null
          engagement_id: string | null
          firm_id: string | null
          id: string
          resolution_notes: string | null
          resolution_status: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          user_id: string | null
        }
        Insert: {
          conflict_end: string
          conflict_start: string
          conflict_type?: string | null
          conflicting_engagement_id?: string | null
          created_at?: string | null
          engagement_id?: string | null
          firm_id?: string | null
          id?: string
          resolution_notes?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_id?: string | null
        }
        Update: {
          conflict_end?: string
          conflict_start?: string
          conflict_type?: string | null
          conflicting_engagement_id?: string | null
          created_at?: string | null
          engagement_id?: string | null
          firm_id?: string | null
          id?: string
          resolution_notes?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_resource_conflicts_conflicting_engagement_id_fkey"
            columns: ["conflicting_engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_resource_conflicts_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_resource_conflicts_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_resource_conflicts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_resource_conflicts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_scope: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          engagement_id: string
          exclusions: string | null
          firm_id: string
          id: string
          key_risks: string[] | null
          materiality_threshold: number | null
          objectives: string[] | null
          sample_size: number | null
          scope_boundaries: string | null
          testing_approach: string | null
          updated_at: string
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          engagement_id: string
          exclusions?: string | null
          firm_id: string
          id?: string
          key_risks?: string[] | null
          materiality_threshold?: number | null
          objectives?: string[] | null
          sample_size?: number | null
          scope_boundaries?: string | null
          testing_approach?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          engagement_id?: string
          exclusions?: string | null
          firm_id?: string
          id?: string
          key_risks?: string[] | null
          materiality_threshold?: number | null
          objectives?: string[] | null
          sample_size?: number | null
          scope_boundaries?: string | null
          testing_approach?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "engagement_scope_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_scope_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_templates: {
        Row: {
          budget_range_max: number | null
          budget_range_min: number | null
          created_at: string
          created_by: string | null
          default_milestones: Json | null
          default_scope: Json | null
          default_team_structure: Json | null
          deliverables_checklist: string[] | null
          description: string | null
          engagement_type: string
          estimated_hours_by_role: Json | null
          firm_id: string
          id: string
          industry: string | null
          is_active: boolean | null
          is_default: boolean | null
          template_name: string
          updated_at: string
        }
        Insert: {
          budget_range_max?: number | null
          budget_range_min?: number | null
          created_at?: string
          created_by?: string | null
          default_milestones?: Json | null
          default_scope?: Json | null
          default_team_structure?: Json | null
          deliverables_checklist?: string[] | null
          description?: string | null
          engagement_type: string
          estimated_hours_by_role?: Json | null
          firm_id: string
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          template_name: string
          updated_at?: string
        }
        Update: {
          budget_range_max?: number | null
          budget_range_min?: number | null
          created_at?: string
          created_by?: string | null
          default_milestones?: Json | null
          default_scope?: Json | null
          default_team_structure?: Json | null
          deliverables_checklist?: string[] | null
          description?: string | null
          engagement_type?: string
          estimated_hours_by_role?: Json | null
          firm_id?: string
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_templates_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          deliverable_id: string | null
          folder: string | null
          id: string
          mime_type: string
          name: string
          path: string
          project_id: string
          size: number
          tags: Json | null
          task_id: string | null
          uploaded_by: string | null
          workstream_id: string | null
        }
        Insert: {
          created_at?: string
          deliverable_id?: string | null
          folder?: string | null
          id?: string
          mime_type: string
          name: string
          path: string
          project_id: string
          size: number
          tags?: Json | null
          task_id?: string | null
          uploaded_by?: string | null
          workstream_id?: string | null
        }
        Update: {
          created_at?: string
          deliverable_id?: string | null
          folder?: string | null
          id?: string
          mime_type?: string
          name?: string
          path?: string
          project_id?: string
          size?: number
          tags?: Json | null
          task_id?: string | null
          uploaded_by?: string | null
          workstream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_workstream_id_fkey"
            columns: ["workstream_id"]
            isOneToOne: false
            referencedRelation: "workstreams"
            referencedColumns: ["id"]
          },
        ]
      }
      finding_follow_ups: {
        Row: {
          comments: string | null
          completion_percentage: number | null
          created_at: string
          finding_id: string
          follow_up_date: string
          follow_up_type: string | null
          id: string
          performed_by: string | null
          status_update: string | null
        }
        Insert: {
          comments?: string | null
          completion_percentage?: number | null
          created_at?: string
          finding_id: string
          follow_up_date?: string
          follow_up_type?: string | null
          id?: string
          performed_by?: string | null
          status_update?: string | null
        }
        Update: {
          comments?: string | null
          completion_percentage?: number | null
          created_at?: string
          finding_id?: string
          follow_up_date?: string
          follow_up_type?: string | null
          id?: string
          performed_by?: string | null
          status_update?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finding_follow_ups_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "audit_findings"
            referencedColumns: ["id"]
          },
        ]
      }
      firms: {
        Row: {
          billing_address: Json | null
          billing_email: string | null
          company_size: string | null
          country: string | null
          created_at: string
          data_region: string | null
          firm_type: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          license_numbers: Json | null
          logo_url: string | null
          metadata: Json | null
          mfa_required: boolean | null
          name: string
          partner_count: number | null
          phone: string | null
          practicing_since: string | null
          primary_color: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          slug: string
          specializations: string[] | null
          sso_enabled: boolean | null
          staff_count: number | null
          status: string
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          billing_address?: Json | null
          billing_email?: string | null
          company_size?: string | null
          country?: string | null
          created_at?: string
          data_region?: string | null
          firm_type?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          license_numbers?: Json | null
          logo_url?: string | null
          metadata?: Json | null
          mfa_required?: boolean | null
          name: string
          partner_count?: number | null
          phone?: string | null
          practicing_since?: string | null
          primary_color?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          slug: string
          specializations?: string[] | null
          sso_enabled?: boolean | null
          staff_count?: number | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          billing_address?: Json | null
          billing_email?: string | null
          company_size?: string | null
          country?: string | null
          created_at?: string
          data_region?: string | null
          firm_type?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          license_numbers?: Json | null
          logo_url?: string | null
          metadata?: Json | null
          mfa_required?: boolean | null
          name?: string
          partner_count?: number | null
          phone?: string | null
          practicing_since?: string | null
          primary_color?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          slug?: string
          specializations?: string[] | null
          sso_enabled?: boolean | null
          staff_count?: number | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      form_answers: {
        Row: {
          answered_at: string
          answered_by: string | null
          field_id: string
          form_run_id: string
          id: string
          value: Json
        }
        Insert: {
          answered_at?: string
          answered_by?: string | null
          field_id: string
          form_run_id: string
          id?: string
          value: Json
        }
        Update: {
          answered_at?: string
          answered_by?: string | null
          field_id?: string
          form_run_id?: string
          id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "form_answers_form_run_id_fkey"
            columns: ["form_run_id"]
            isOneToOne: false
            referencedRelation: "form_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      form_runs: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          fields: Json
          id: string
          organization_id: string
          project_id: string | null
          status: string
          submitted_at: string | null
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          fields?: Json
          id?: string
          organization_id: string
          project_id?: string | null
          status?: string
          submitted_at?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          fields?: Json
          id?: string
          organization_id?: string
          project_id?: string | null
          status?: string
          submitted_at?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_runs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          fields: Json
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          fields?: Json
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          fields?: Json
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          credentials: Json
          id: string
          integration_type: string
          is_active: boolean
          last_sync_at: string | null
          metadata: Json | null
          name: string
          organization_id: string
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          credentials?: Json
          id?: string
          integration_type: string
          is_active?: boolean
          last_sync_at?: string | null
          metadata?: Json | null
          name: string
          organization_id: string
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          credentials?: Json
          id?: string
          integration_type?: string
          is_active?: boolean
          last_sync_at?: string | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          priority: string
          project_id: string
          reported_by: string | null
          reported_date: string
          resolution: string | null
          resolved_date: string | null
          severity: string
          sla_breach: boolean | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          priority?: string
          project_id: string
          reported_by?: string | null
          reported_date?: string
          resolution?: string | null
          resolved_date?: string | null
          severity?: string
          sla_breach?: boolean | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          priority?: string
          project_id?: string
          reported_by?: string | null
          reported_date?: string
          resolution?: string | null
          resolved_date?: string | null
          severity?: string
          sla_breach?: boolean | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendees: {
        Row: {
          attendance_status: string
          created_at: string
          id: string
          is_organizer: boolean | null
          meeting_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          attendance_status?: string
          created_at?: string
          id?: string
          is_organizer?: boolean | null
          meeting_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          attendance_status?: string
          created_at?: string
          id?: string
          is_organizer?: boolean | null
          meeting_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_minutes: {
        Row: {
          agenda: string | null
          content: string
          created_at: string
          created_by: string | null
          decisions: string | null
          id: string
          meeting_id: string
          next_steps: string | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          agenda?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          decisions?: string | null
          id?: string
          meeting_id: string
          next_steps?: string | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          agenda?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          decisions?: string | null
          id?: string
          meeting_id?: string
          next_steps?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minutes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          location: string | null
          meeting_link: string | null
          meeting_type: string
          organization_id: string
          project_id: string | null
          recording_link: string | null
          scheduled_at: string
          status: string
          title: string
          transcript_link: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          location?: string | null
          meeting_link?: string | null
          meeting_type?: string
          organization_id: string
          project_id?: string | null
          recording_link?: string | null
          scheduled_at: string
          status?: string
          title: string
          transcript_link?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          location?: string | null
          meeting_link?: string | null
          meeting_type?: string
          organization_id?: string
          project_id?: string | null
          recording_link?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          transcript_link?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          project_id: string | null
          read: boolean
          task_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          project_id?: string | null
          read?: boolean
          task_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          project_id?: string | null
          read?: boolean
          task_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_lineage: {
        Row: {
          created_at: string
          executed_at: string
          executed_by: string | null
          id: string
          metadata: Json | null
          organization_id: string
          source_object_id: string | null
          target_object_id: string | null
          transformation_logic: string | null
          transformation_type: string
        }
        Insert: {
          created_at?: string
          executed_at?: string
          executed_by?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          source_object_id?: string | null
          target_object_id?: string | null
          transformation_logic?: string | null
          transformation_type: string
        }
        Update: {
          created_at?: string
          executed_at?: string
          executed_by?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          source_object_id?: string | null
          target_object_id?: string | null
          transformation_logic?: string | null
          transformation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ontology_lineage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_lineage_source_object_id_fkey"
            columns: ["source_object_id"]
            isOneToOne: false
            referencedRelation: "ontology_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_lineage_target_object_id_fkey"
            columns: ["target_object_id"]
            isOneToOne: false
            referencedRelation: "ontology_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_object_properties: {
        Row: {
          created_at: string
          id: string
          object_id: string
          property_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          object_id: string
          property_id: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          object_id?: string
          property_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ontology_object_properties_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "ontology_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_object_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "ontology_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_object_relationships: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          metadata: Json | null
          relationship_type_id: string
          source_object_id: string
          target_object_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          relationship_type_id: string
          source_object_id: string
          target_object_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          relationship_type_id?: string
          source_object_id?: string
          target_object_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ontology_object_relationships_relationship_type_id_fkey"
            columns: ["relationship_type_id"]
            isOneToOne: false
            referencedRelation: "ontology_relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_object_relationships_source_object_id_fkey"
            columns: ["source_object_id"]
            isOneToOne: false
            referencedRelation: "ontology_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_object_relationships_target_object_id_fkey"
            columns: ["target_object_id"]
            isOneToOne: false
            referencedRelation: "ontology_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_object_types: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          metadata: Json | null
          name: string
          organization_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          metadata?: Json | null
          name: string
          organization_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ontology_object_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_objects: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string
          external_id: string | null
          external_table: string | null
          id: string
          metadata: Json | null
          object_type_id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name: string
          external_id?: string | null
          external_table?: string | null
          id?: string
          metadata?: Json | null
          object_type_id: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string
          external_id?: string | null
          external_table?: string | null
          id?: string
          metadata?: Json | null
          object_type_id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ontology_objects_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "ontology_object_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_objects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_properties: {
        Row: {
          created_at: string
          data_type: string
          default_value: Json | null
          description: string | null
          display_order: number | null
          id: string
          is_indexed: boolean | null
          is_required: boolean | null
          is_unique: boolean | null
          metadata: Json | null
          name: string
          object_type_id: string
          slug: string
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          data_type: string
          default_value?: Json | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_indexed?: boolean | null
          is_required?: boolean | null
          is_unique?: boolean | null
          metadata?: Json | null
          name: string
          object_type_id: string
          slug: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          data_type?: string
          default_value?: Json | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_indexed?: boolean | null
          is_required?: boolean | null
          is_unique?: boolean | null
          metadata?: Json | null
          name?: string
          object_type_id?: string
          slug?: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ontology_properties_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "ontology_object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_relationships: {
        Row: {
          created_at: string
          description: string | null
          id: string
          inverse_name: string | null
          is_bidirectional: boolean | null
          metadata: Json | null
          name: string
          organization_id: string
          relationship_type: string
          slug: string
          source_type_id: string
          target_type_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          inverse_name?: string | null
          is_bidirectional?: boolean | null
          metadata?: Json | null
          name: string
          organization_id: string
          relationship_type: string
          slug: string
          source_type_id: string
          target_type_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          inverse_name?: string | null
          is_bidirectional?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          relationship_type?: string
          slug?: string
          source_type_id?: string
          target_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ontology_relationships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_relationships_source_type_id_fkey"
            columns: ["source_type_id"]
            isOneToOne: false
            referencedRelation: "ontology_object_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_relationships_target_type_id_fkey"
            columns: ["target_type_id"]
            isOneToOne: false
            referencedRelation: "ontology_object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_validation_results: {
        Row: {
          id: string
          metadata: Json | null
          object_id: string
          property_id: string | null
          validated_at: string
          validation_message: string | null
          validation_status: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          object_id: string
          property_id?: string | null
          validated_at?: string
          validation_message?: string | null
          validation_status: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          object_id?: string
          property_id?: string | null
          validated_at?: string
          validation_message?: string | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ontology_validation_results_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "ontology_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_validation_results_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "ontology_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          client_id: string | null
          competitor: string | null
          converted_to_engagement_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_value: number | null
          expected_close_date: string | null
          firm_id: string
          id: string
          lost_date: string | null
          lost_reason: string | null
          metadata: Json | null
          notes: string | null
          opportunity_name: string
          opportunity_type: string | null
          owner_id: string | null
          probability: number | null
          proposal_document_url: string | null
          proposal_sent_date: string | null
          stage: string
          stage_changed_at: string | null
          updated_at: string
          won_date: string | null
        }
        Insert: {
          client_id?: string | null
          competitor?: string | null
          converted_to_engagement_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          firm_id: string
          id?: string
          lost_date?: string | null
          lost_reason?: string | null
          metadata?: Json | null
          notes?: string | null
          opportunity_name: string
          opportunity_type?: string | null
          owner_id?: string | null
          probability?: number | null
          proposal_document_url?: string | null
          proposal_sent_date?: string | null
          stage?: string
          stage_changed_at?: string | null
          updated_at?: string
          won_date?: string | null
        }
        Update: {
          client_id?: string | null
          competitor?: string | null
          converted_to_engagement_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          firm_id?: string
          id?: string
          lost_date?: string | null
          lost_reason?: string | null
          metadata?: Json | null
          notes?: string | null
          opportunity_name?: string
          opportunity_type?: string | null
          owner_id?: string | null
          probability?: number | null
          proposal_document_url?: string | null
          proposal_sent_date?: string | null
          stage?: string
          stage_changed_at?: string | null
          updated_at?: string
          won_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_converted_to_engagement_id_fkey"
            columns: ["converted_to_engagement_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_financial_data: {
        Row: {
          billing_email: string | null
          created_at: string | null
          created_by: string | null
          encrypted_data: Json | null
          id: string
          organization_id: string
          payment_method_id: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          billing_email?: string | null
          created_at?: string | null
          created_by?: string | null
          encrypted_data?: Json | null
          id?: string
          organization_id: string
          payment_method_id?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_email?: string | null
          created_at?: string | null
          created_by?: string | null
          encrypted_data?: Json | null
          id?: string
          organization_id?: string
          payment_method_id?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_financial_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          permission: Database["public"]["Enums"]["permission_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          permission: Database["public"]["Enums"]["permission_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["permission_type"]
        }
        Relationships: []
      }
      pipeline_edges: {
        Row: {
          created_at: string
          edge_config: Json | null
          id: string
          pipeline_id: string
          source_node_id: string
          target_node_id: string
        }
        Insert: {
          created_at?: string
          edge_config?: Json | null
          id?: string
          pipeline_id: string
          source_node_id: string
          target_node_id: string
        }
        Update: {
          created_at?: string
          edge_config?: Json | null
          id?: string
          pipeline_id?: string
          source_node_id?: string
          target_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_edges_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "data_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "pipeline_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "pipeline_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_node_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          input_data: Json | null
          metrics: Json | null
          node_id: string
          output_data: Json | null
          run_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          metrics?: Json | null
          node_id: string
          output_data?: Json | null
          run_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          metrics?: Json | null
          node_id?: string
          output_data?: Json | null
          run_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_node_executions_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "pipeline_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_node_executions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "pipeline_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_nodes: {
        Row: {
          created_at: string
          id: string
          node_config: Json
          node_type: string
          pipeline_id: string
          position_x: number
          position_y: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          node_config?: Json
          node_type: string
          pipeline_id: string
          position_x?: number
          position_y?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          node_config?: Json
          node_type?: string
          pipeline_id?: string
          position_x?: number
          position_y?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_nodes_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "data_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          execution_logs: Json | null
          id: string
          metrics: Json | null
          pipeline_id: string
          started_at: string
          status: string
          trigger_type: string
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_logs?: Json | null
          id?: string
          metrics?: Json | null
          pipeline_id: string
          started_at?: string
          status?: string
          trigger_type?: string
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_logs?: Json | null
          id?: string
          metrics?: Json | null
          pipeline_id?: string
          started_at?: string
          status?: string
          trigger_type?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_runs_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "data_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_access_requests: {
        Row: {
          company_name: string
          company_size: string | null
          created_at: string
          email: string
          estimated_users: number | null
          id: string
          industry: string | null
          invitation_expires_at: string | null
          invitation_sent_at: string | null
          invitation_token: string | null
          metadata: Json | null
          organization_id: string | null
          reason: string
          requested_at: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_name: string
          company_size?: string | null
          created_at?: string
          email: string
          estimated_users?: number | null
          id?: string
          industry?: string | null
          invitation_expires_at?: string | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          metadata?: Json | null
          organization_id?: string | null
          reason: string
          requested_at?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          company_size?: string | null
          created_at?: string
          email?: string
          estimated_users?: number | null
          id?: string
          industry?: string | null
          invitation_expires_at?: string | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          metadata?: Json | null
          organization_id?: string | null
          reason?: string
          requested_at?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_access_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_dependencies: {
        Row: {
          created_at: string | null
          dependency_type: string | null
          depends_on_procedure_id: string
          id: string
          procedure_id: string
        }
        Insert: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_procedure_id: string
          id?: string
          procedure_id: string
        }
        Update: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_procedure_id?: string
          id?: string
          procedure_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_dependencies_depends_on_procedure_id_fkey"
            columns: ["depends_on_procedure_id"]
            isOneToOne: false
            referencedRelation: "audit_procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_dependencies_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "audit_procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_review_requirements: {
        Row: {
          created_at: string | null
          engagement_procedure_id: string
          id: string
          required_reviewer_id: string | null
          required_reviewer_role: string | null
          review_comments: string | null
          review_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          sign_off_date: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          engagement_procedure_id: string
          id?: string
          required_reviewer_id?: string | null
          required_reviewer_role?: string | null
          review_comments?: string | null
          review_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sign_off_date?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          engagement_procedure_id?: string
          id?: string
          required_reviewer_id?: string | null
          required_reviewer_role?: string | null
          review_comments?: string | null
          review_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sign_off_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedure_review_requirements_engagement_procedure_id_fkey"
            columns: ["engagement_procedure_id"]
            isOneToOne: false
            referencedRelation: "engagement_procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          client_id: string | null
          created_at: string | null
          department: string | null
          email: string
          firm_id: string | null
          first_name: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          license_number: string | null
          metadata: Json | null
          phone: string | null
          practice_area: string | null
          termination_date: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          firm_id?: string | null
          first_name?: string | null
          hire_date?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          license_number?: string | null
          metadata?: Json | null
          phone?: string | null
          practice_area?: string | null
          termination_date?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          firm_id?: string | null
          first_name?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          license_number?: string | null
          metadata?: Json | null
          phone?: string | null
          practice_area?: string | null
          termination_date?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      program_procedures: {
        Row: {
          can_be_customized: boolean | null
          created_at: string | null
          default_assigned_role: string | null
          id: string
          is_required: boolean | null
          procedure_id: string
          program_template_id: string
          sequence_order: number
        }
        Insert: {
          can_be_customized?: boolean | null
          created_at?: string | null
          default_assigned_role?: string | null
          id?: string
          is_required?: boolean | null
          procedure_id: string
          program_template_id: string
          sequence_order?: number
        }
        Update: {
          can_be_customized?: boolean | null
          created_at?: string | null
          default_assigned_role?: string | null
          id?: string
          is_required?: boolean | null
          procedure_id?: string
          program_template_id?: string
          sequence_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_procedures_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "audit_procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_procedures_program_template_id_fkey"
            columns: ["program_template_id"]
            isOneToOne: false
            referencedRelation: "audit_program_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      project_baselines: {
        Row: {
          baseline_date: string
          baseline_number: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_current: boolean | null
          name: string
          organization_id: string
          project_id: string
        }
        Insert: {
          baseline_date: string
          baseline_number: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_current?: boolean | null
          name: string
          organization_id: string
          project_id: string
        }
        Update: {
          baseline_date?: string
          baseline_number?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_current?: boolean | null
          name?: string
          organization_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_baselines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_baselines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_budgets: {
        Row: {
          allocated_amount: number | null
          budget_type: string
          created_at: string
          created_by: string | null
          fiscal_year: number | null
          id: string
          notes: string | null
          organization_id: string
          planned_amount: number
          project_id: string
          remaining_amount: number | null
          spent_amount: number | null
          updated_at: string
        }
        Insert: {
          allocated_amount?: number | null
          budget_type?: string
          created_at?: string
          created_by?: string | null
          fiscal_year?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          planned_amount: number
          project_id: string
          remaining_amount?: number | null
          spent_amount?: number | null
          updated_at?: string
        }
        Update: {
          allocated_amount?: number | null
          budget_type?: string
          created_at?: string
          created_by?: string | null
          fiscal_year?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          planned_amount?: number
          project_id?: string
          remaining_amount?: number | null
          spent_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_budgets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          cost_category_id: string | null
          created_at: string
          currency: string | null
          description: string
          expense_date: string
          id: string
          is_billable: boolean
          notes: string | null
          organization_id: string
          project_id: string
          receipt_url: string | null
          rejection_reason: string | null
          status: string
          submitted_by: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          cost_category_id?: string | null
          created_at?: string
          currency?: string | null
          description: string
          expense_date: string
          id?: string
          is_billable?: boolean
          notes?: string | null
          organization_id: string
          project_id: string
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_by: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          cost_category_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string
          expense_date?: string
          id?: string
          is_billable?: boolean
          notes?: string | null
          organization_id?: string
          project_id?: string
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_by?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_expenses_cost_category_id_fkey"
            columns: ["cost_category_id"]
            isOneToOne: false
            referencedRelation: "cost_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string
          invited_by: string | null
          project_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          project_id: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          project_id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_scenarios: {
        Row: {
          assumptions: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          project_id: string
          scenario_type: string
          updated_at: string
        }
        Insert: {
          assumptions?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          project_id: string
          scenario_type?: string
          updated_at?: string
        }
        Update: {
          assumptions?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          project_id?: string
          scenario_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_scenarios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_scenarios_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_schedule_metrics: {
        Row: {
          actual_cost: number | null
          cost_performance_index: number | null
          cost_variance: number | null
          created_at: string
          earned_value: number | null
          estimate_at_completion: number | null
          estimate_to_complete: number | null
          id: string
          metric_date: string
          planned_value: number | null
          project_id: string
          schedule_performance_index: number | null
          schedule_variance: number | null
          variance_at_completion: number | null
        }
        Insert: {
          actual_cost?: number | null
          cost_performance_index?: number | null
          cost_variance?: number | null
          created_at?: string
          earned_value?: number | null
          estimate_at_completion?: number | null
          estimate_to_complete?: number | null
          id?: string
          metric_date: string
          planned_value?: number | null
          project_id: string
          schedule_performance_index?: number | null
          schedule_variance?: number | null
          variance_at_completion?: number | null
        }
        Update: {
          actual_cost?: number | null
          cost_performance_index?: number | null
          cost_variance?: number | null
          created_at?: string
          earned_value?: number | null
          estimate_at_completion?: number | null
          estimate_to_complete?: number | null
          id?: string
          metric_date?: string
          planned_value?: number | null
          project_id?: string
          schedule_performance_index?: number | null
          schedule_variance?: number | null
          variance_at_completion?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_schedule_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          client: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          name: string
          organization_id: string | null
          priority: string | null
          progress: number
          spent: number | null
          start_date: string
          status: string
          team_members: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number | null
          client: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          name: string
          organization_id?: string | null
          priority?: string | null
          progress?: number
          spent?: number | null
          start_date: string
          status?: string
          team_members?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number | null
          client?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          name?: string
          organization_id?: string | null
          priority?: string | null
          progress?: number
          spent?: number | null
          start_date?: string
          status?: string
          team_members?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_templates: {
        Row: {
          created_at: string
          created_by: string | null
          default_sections: Json | null
          description: string | null
          firm_id: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_used_at: string | null
          template_category: string | null
          template_content: Json
          template_name: string
          updated_at: string
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_sections?: Json | null
          description?: string | null
          firm_id: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_used_at?: string | null
          template_category?: string | null
          template_content: Json
          template_name: string
          updated_at?: string
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_sections?: Json | null
          description?: string | null
          firm_id?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_used_at?: string | null
          template_category?: string | null
          template_content?: Json
          template_name?: string
          updated_at?: string
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_templates_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          created_at: string
          created_by: string | null
          decision_date: string | null
          description: string | null
          document_url: string | null
          estimated_value: number | null
          firm_id: string
          id: string
          notes: string | null
          opportunity_id: string
          proposal_number: string
          sent_date: string | null
          status: string
          template_used: string | null
          title: string
          updated_at: string
          view_count: number | null
          viewed_date: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          decision_date?: string | null
          description?: string | null
          document_url?: string | null
          estimated_value?: number | null
          firm_id: string
          id?: string
          notes?: string | null
          opportunity_id: string
          proposal_number: string
          sent_date?: string | null
          status?: string
          template_used?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
          viewed_date?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          decision_date?: string | null
          description?: string | null
          document_url?: string | null
          estimated_value?: number | null
          firm_id?: string
          id?: string
          notes?: string | null
          opportunity_id?: string
          proposal_number?: string
          sent_date?: string | null
          status?: string
          template_used?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
          viewed_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      query_engines: {
        Row: {
          connection_config: Json
          created_at: string | null
          engine_type: string
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          connection_config?: Json
          created_at?: string | null
          engine_type: string
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          connection_config?: Json
          created_at?: string | null
          engine_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      query_executions: {
        Row: {
          bytes_scanned: number | null
          created_at: string | null
          engine_type: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          organization_id: string
          query_text: string
          rows_returned: number | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          bytes_scanned?: number | null
          created_at?: string | null
          engine_type: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          organization_id: string
          query_text: string
          rows_returned?: number | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          bytes_scanned?: number | null
          created_at?: string | null
          engine_type?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          organization_id?: string
          query_text?: string
          rows_returned?: number | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      raci_assignments: {
        Row: {
          assignment_type: string
          created_at: string
          deliverable_id: string | null
          id: string
          organization_id: string
          project_id: string | null
          stakeholder_id: string | null
          task_id: string | null
        }
        Insert: {
          assignment_type: string
          created_at?: string
          deliverable_id?: string | null
          id?: string
          organization_id: string
          project_id?: string | null
          stakeholder_id?: string | null
          task_id?: string | null
        }
        Update: {
          assignment_type?: string
          created_at?: string
          deliverable_id?: string | null
          id?: string
          organization_id?: string
          project_id?: string | null
          stakeholder_id?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raci_assignments_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raci_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raci_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raci_assignments_stakeholder_id_fkey"
            columns: ["stakeholder_id"]
            isOneToOne: false
            referencedRelation: "stakeholders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raci_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_allocations: {
        Row: {
          allocation_percentage: number
          created_at: string
          created_by: string | null
          end_date: string
          hours_per_day: number | null
          id: string
          notes: string | null
          organization_id: string
          project_id: string
          role: string | null
          start_date: string
          status: string
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allocation_percentage?: number
          created_at?: string
          created_by?: string | null
          end_date: string
          hours_per_day?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          project_id: string
          role?: string | null
          start_date: string
          status?: string
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allocation_percentage?: number
          created_at?: string
          created_by?: string | null
          end_date?: string
          hours_per_day?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          project_id?: string
          role?: string | null
          start_date?: string
          status?: string
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_allocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_allocations_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_conflicts: {
        Row: {
          conflict_date: string
          detected_at: string
          id: string
          organization_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          total_allocation_percentage: number
          total_hours: number
          user_id: string
        }
        Insert: {
          conflict_date: string
          detected_at?: string
          id?: string
          organization_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          total_allocation_percentage: number
          total_hours: number
          user_id: string
        }
        Update: {
          conflict_date?: string
          detected_at?: string
          id?: string
          organization_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          total_allocation_percentage?: number
          total_hours?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_conflicts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_registry: {
        Row: {
          app_id: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          name: string
          organization_id: string
          resource_id: string
          resource_type: string
          updated_at: string
          url: string
        }
        Insert: {
          app_id: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          organization_id: string
          resource_id: string
          resource_type: string
          updated_at?: string
          url: string
        }
        Update: {
          app_id?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          organization_id?: string
          resource_id?: string
          resource_type?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_registry_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_registry_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          assessed_by: string | null
          assessment_date: string
          control_effectiveness: number | null
          created_at: string
          entity_id: string | null
          id: string
          impact_score: number
          inherent_risk: number | null
          likelihood_score: number
          mitigation_strategy: string | null
          organization_id: string
          residual_risk: number | null
          review_date: string | null
          reviewed_by: string | null
          risk_category: string | null
          risk_description: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assessed_by?: string | null
          assessment_date?: string
          control_effectiveness?: number | null
          created_at?: string
          entity_id?: string | null
          id?: string
          impact_score: number
          inherent_risk?: number | null
          likelihood_score: number
          mitigation_strategy?: string | null
          organization_id: string
          residual_risk?: number | null
          review_date?: string | null
          reviewed_by?: string | null
          risk_category?: string | null
          risk_description?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assessed_by?: string | null
          assessment_date?: string
          control_effectiveness?: number | null
          created_at?: string
          entity_id?: string | null
          id?: string
          impact_score?: number
          inherent_risk?: number | null
          likelihood_score?: number
          mitigation_strategy?: string | null
          organization_id?: string
          residual_risk?: number | null
          review_date?: string | null
          reviewed_by?: string | null
          risk_category?: string | null
          risk_description?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "audit_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          actual_closure_date: string | null
          category: string
          contingency_plan: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          identified_date: string
          impact: string
          mitigation_plan: string | null
          organization_id: string
          owner_id: string | null
          probability: string
          project_id: string
          risk_score: number | null
          status: string
          target_closure_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_closure_date?: string | null
          category?: string
          contingency_plan?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          identified_date?: string
          impact?: string
          mitigation_plan?: string | null
          organization_id: string
          owner_id?: string | null
          probability?: string
          project_id: string
          risk_score?: number | null
          status?: string
          target_closure_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_closure_date?: string | null
          category?: string
          contingency_plan?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          identified_date?: string
          impact?: string
          mitigation_plan?: string | null
          organization_id?: string
          owner_id?: string | null
          probability?: string
          project_id?: string
          risk_score?: number | null
          status?: string
          target_closure_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          permission: string
          resource_type: string
          role: Database["public"]["Enums"]["app_role"]
          scope: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          permission: string
          resource_type: string
          role: Database["public"]["Enums"]["app_role"]
          scope?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          permission?: string
          resource_type?: string
          role?: Database["public"]["Enums"]["app_role"]
          scope?: string | null
        }
        Relationships: []
      }
      scenario_tasks: {
        Row: {
          adjusted_cost: number | null
          adjusted_due_date: string | null
          adjusted_duration: number | null
          adjusted_effort_hours: number | null
          adjusted_start_date: string | null
          created_at: string
          id: string
          notes: string | null
          probability_percentage: number | null
          scenario_id: string
          task_id: string
        }
        Insert: {
          adjusted_cost?: number | null
          adjusted_due_date?: string | null
          adjusted_duration?: number | null
          adjusted_effort_hours?: number | null
          adjusted_start_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          probability_percentage?: number | null
          scenario_id: string
          task_id: string
        }
        Update: {
          adjusted_cost?: number | null
          adjusted_due_date?: string | null
          adjusted_duration?: number | null
          adjusted_effort_hours?: number | null
          adjusted_start_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          probability_percentage?: number | null
          scenario_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_tasks_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "project_scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      security_markings: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          name: string
          organization_id: string
          sensitivity_level: number
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          name: string
          organization_id: string
          sensitivity_level: number
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          name?: string
          organization_id?: string
          sensitivity_level?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_approvers: {
        Row: {
          created_at: string | null
          id: string
          stage_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          stage_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          stage_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_approvers_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "approval_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholder_communications: {
        Row: {
          communication_type: string
          completed_at: string | null
          content: string | null
          created_at: string
          created_by: string | null
          direction: string
          id: string
          metadata: Json | null
          organization_id: string
          scheduled_at: string | null
          stakeholder_id: string
          subject: string | null
        }
        Insert: {
          communication_type?: string
          completed_at?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string
          id?: string
          metadata?: Json | null
          organization_id: string
          scheduled_at?: string | null
          stakeholder_id: string
          subject?: string | null
        }
        Update: {
          communication_type?: string
          completed_at?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          scheduled_at?: string | null
          stakeholder_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stakeholder_communications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholder_communications_stakeholder_id_fkey"
            columns: ["stakeholder_id"]
            isOneToOne: false
            referencedRelation: "stakeholders"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholders: {
        Row: {
          communication_frequency: string | null
          created_at: string
          created_by: string | null
          department: string | null
          email: string | null
          engagement_strategy: string | null
          id: string
          influence_level: string
          interest_level: string
          metadata: Json | null
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          preferred_channel: string | null
          project_id: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          communication_frequency?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string | null
          engagement_strategy?: string | null
          id?: string
          influence_level?: string
          interest_level?: string
          metadata?: Json | null
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          preferred_channel?: string | null
          project_id?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          communication_frequency?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string | null
          engagement_strategy?: string | null
          id?: string
          influence_level?: string
          interest_level?: string
          metadata?: Json | null
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          preferred_channel?: string | null
          project_id?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakeholders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          dependency_type: string
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          dependency_type?: string
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          dependency_type?: string
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          early_finish: string | null
          early_start: string | null
          float_days: number | null
          id: string
          is_on_critical_path: boolean | null
          late_finish: string | null
          late_start: string | null
          priority: string
          project_id: string
          status: string
          tags: Json | null
          title: string
          updated_at: string
          workstream_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          early_finish?: string | null
          early_start?: string | null
          float_days?: number | null
          id?: string
          is_on_critical_path?: boolean | null
          late_finish?: string | null
          late_start?: string | null
          priority?: string
          project_id: string
          status?: string
          tags?: Json | null
          title: string
          updated_at?: string
          workstream_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          early_finish?: string | null
          early_start?: string | null
          float_days?: number | null
          id?: string
          is_on_critical_path?: boolean | null
          late_finish?: string | null
          late_start?: string | null
          priority?: string
          project_id?: string
          status?: string
          tags?: Json | null
          title?: string
          updated_at?: string
          workstream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workstream_id_fkey"
            columns: ["workstream_id"]
            isOneToOne: false
            referencedRelation: "workstreams"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          billable_rate: number | null
          created_at: string
          description: string | null
          duration_hours: number | null
          end_time: string | null
          id: string
          is_billable: boolean
          organization_id: string
          project_id: string
          rejection_reason: string | null
          start_time: string
          status: string
          submitted_at: string | null
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          billable_rate?: number | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          end_time?: string | null
          id?: string
          is_billable?: boolean
          organization_id: string
          project_id: string
          rejection_reason?: string | null
          start_time: string
          status?: string
          submitted_at?: string | null
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          billable_rate?: number | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          end_time?: string | null
          id?: string
          is_billable?: boolean
          organization_id?: string
          project_id?: string
          rejection_reason?: string | null
          start_time?: string
          status?: string
          submitted_at?: string | null
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      transform_checkpoints: {
        Row: {
          checkpoint_type: string | null
          checkpoint_value: string
          created_at: string | null
          id: string
          transform_id: string | null
        }
        Insert: {
          checkpoint_type?: string | null
          checkpoint_value: string
          created_at?: string | null
          id?: string
          transform_id?: string | null
        }
        Update: {
          checkpoint_type?: string | null
          checkpoint_value?: string
          created_at?: string | null
          id?: string
          transform_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transform_checkpoints_transform_id_fkey"
            columns: ["transform_id"]
            isOneToOne: false
            referencedRelation: "transforms"
            referencedColumns: ["id"]
          },
        ]
      }
      transform_dependencies: {
        Row: {
          created_at: string | null
          depends_on_transform_id: string | null
          id: string
          transform_id: string | null
        }
        Insert: {
          created_at?: string | null
          depends_on_transform_id?: string | null
          id?: string
          transform_id?: string | null
        }
        Update: {
          created_at?: string | null
          depends_on_transform_id?: string | null
          id?: string
          transform_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transform_dependencies_depends_on_transform_id_fkey"
            columns: ["depends_on_transform_id"]
            isOneToOne: false
            referencedRelation: "transforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transform_dependencies_transform_id_fkey"
            columns: ["transform_id"]
            isOneToOne: false
            referencedRelation: "transforms"
            referencedColumns: ["id"]
          },
        ]
      }
      transform_repositories: {
        Row: {
          branch: string | null
          created_at: string | null
          description: string | null
          git_url: string | null
          id: string
          last_sync_at: string | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          branch?: string | null
          created_at?: string | null
          description?: string | null
          git_url?: string | null
          id?: string
          last_sync_at?: string | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          branch?: string | null
          created_at?: string | null
          description?: string | null
          git_url?: string | null
          id?: string
          last_sync_at?: string | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transform_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          rows_affected: number | null
          started_at: string | null
          status: string
          transform_id: string | null
          trigger_type: string | null
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          rows_affected?: number | null
          started_at?: string | null
          status: string
          transform_id?: string | null
          trigger_type?: string | null
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          rows_affected?: number | null
          started_at?: string | null
          status?: string
          transform_id?: string | null
          trigger_type?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transform_runs_transform_id_fkey"
            columns: ["transform_id"]
            isOneToOne: false
            referencedRelation: "transforms"
            referencedColumns: ["id"]
          },
        ]
      }
      transforms: {
        Row: {
          code: string
          created_at: string | null
          depends_on: string[] | null
          file_path: string
          id: string
          is_active: boolean | null
          name: string
          output_dataset_id: string | null
          repository_id: string | null
          transform_type: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          depends_on?: string[] | null
          file_path: string
          id?: string
          is_active?: boolean | null
          name: string
          output_dataset_id?: string | null
          repository_id?: string | null
          transform_type: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          depends_on?: string[] | null
          file_path?: string
          id?: string
          is_active?: boolean | null
          name?: string
          output_dataset_id?: string | null
          repository_id?: string | null
          transform_type?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transforms_output_dataset_id_fkey"
            columns: ["output_dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transforms_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "transform_repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      upsell_opportunities: {
        Row: {
          client_id: string
          confidence_score: number | null
          created_at: string
          created_by: string | null
          estimated_value: number | null
          firm_id: string
          id: string
          identification_reason: string | null
          identified_by: string
          opportunity_type: string
          priority: string | null
          service_suggested: string
          status: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          estimated_value?: number | null
          firm_id: string
          id?: string
          identification_reason?: string | null
          identified_by: string
          opportunity_type: string
          priority?: string | null
          service_suggested: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          estimated_value?: number | null
          firm_id?: string
          id?: string
          identification_reason?: string | null
          identified_by?: string
          opportunity_type?: string
          priority?: string | null
          service_suggested?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "upsell_opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_opportunities_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_app_preferences: {
        Row: {
          access_count: number
          app_id: string
          created_at: string
          id: string
          is_favorite: boolean
          last_accessed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_count?: number
          app_id: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          last_accessed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_count?: number
          app_id?: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          last_accessed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_app_preferences_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_clearances: {
        Row: {
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          marking_id: string | null
          user_id: string | null
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          marking_id?: string | null
          user_id?: string | null
        }
        Update: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          marking_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_clearances_marking_id_fkey"
            columns: ["marking_id"]
            isOneToOne: false
            referencedRelation: "security_markings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          expires_at: string | null
          firm_id: string | null
          id: string
          metadata: Json | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          expires_at?: string | null
          firm_id?: string | null
          id?: string
          metadata?: Json | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          expires_at?: string | null
          firm_id?: string | null
          id?: string
          metadata?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skills: {
        Row: {
          certified: boolean | null
          created_at: string
          id: string
          last_used_date: string | null
          notes: string | null
          proficiency_level: string
          skill_id: string
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          certified?: boolean | null
          created_at?: string
          id?: string
          last_used_date?: string | null
          notes?: string | null
          proficiency_level?: string
          skill_id: string
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          certified?: boolean | null
          created_at?: string
          id?: string
          last_used_date?: string | null
          notes?: string | null
          proficiency_level?: string
          skill_id?: string
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          created_by: string | null
          events: string[]
          failure_count: number | null
          id: string
          is_active: boolean
          last_triggered_at: string | null
          metadata: Json | null
          name: string
          organization_id: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          events?: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          metadata?: Json | null
          name: string
          organization_id: string
          secret: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          events?: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      workpaper_collaboration: {
        Row: {
          color: string
          cursor_position: number | null
          id: string
          last_seen: string | null
          selection_end: number | null
          selection_start: number | null
          user_email: string
          user_id: string
          user_name: string
          workpaper_id: string
        }
        Insert: {
          color: string
          cursor_position?: number | null
          id?: string
          last_seen?: string | null
          selection_end?: number | null
          selection_start?: number | null
          user_email: string
          user_id: string
          user_name: string
          workpaper_id: string
        }
        Update: {
          color?: string
          cursor_position?: number | null
          id?: string
          last_seen?: string | null
          selection_end?: number | null
          selection_start?: number | null
          user_email?: string
          user_id?: string
          user_name?: string
          workpaper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workpaper_collaboration_workpaper_id_fkey"
            columns: ["workpaper_id"]
            isOneToOne: false
            referencedRelation: "audit_workpapers"
            referencedColumns: ["id"]
          },
        ]
      }
      workpaper_review_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          position: number | null
          resolved: boolean | null
          user_id: string | null
          workpaper_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          position?: number | null
          resolved?: boolean | null
          user_id?: string | null
          workpaper_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          position?: number | null
          resolved?: boolean | null
          user_id?: string | null
          workpaper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workpaper_review_comments_workpaper_id_fkey"
            columns: ["workpaper_id"]
            isOneToOne: false
            referencedRelation: "audit_workpapers"
            referencedColumns: ["id"]
          },
        ]
      }
      workpaper_templates: {
        Row: {
          category: string | null
          content: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          firm_id: string
          id: string
          is_standard: boolean | null
          template_name: string
          updated_at: string | null
          workpaper_type: string
        }
        Insert: {
          category?: string | null
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          firm_id: string
          id?: string
          is_standard?: boolean | null
          template_name: string
          updated_at?: string | null
          workpaper_type: string
        }
        Update: {
          category?: string | null
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          firm_id?: string
          id?: string
          is_standard?: boolean | null
          template_name?: string
          updated_at?: string | null
          workpaper_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workpaper_templates_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      workstreams: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          metadata: Json | null
          name: string
          order_index: number | null
          owner_id: string | null
          project_id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          name: string
          order_index?: number | null
          owner_id?: string | null
          project_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          order_index?: number | null
          owner_id?: string | null
          project_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workstreams_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_schema_boundary: {
        Args: { _approved: boolean; _log_id: string; _reason: string }
        Returns: Json
      }
      assign_platform_admin_role: {
        Args: {
          _assigned_by?: string
          _expires_at?: string
          _metadata?: Json
          _user_id: string
        }
        Returns: string
      }
      can_access_project: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      check_admin_bootstrap_needed: { Args: never; Returns: boolean }
      complete_admin_migration: {
        Args: {
          _migration_token: string
          _new_password_hash: string
          _username: string
        }
        Returns: Json
      }
      create_access_justification: {
        Args: {
          _duration_minutes?: number
          _ip_address?: string
          _reason: string
          _target_org_id: string
          _ticket_reference: string
          _user_agent?: string
        }
        Returns: Json
      }
      create_admin_session: {
        Args: {
          _admin_user_id: string
          _expires_minutes?: number
          _ip_address: string
          _session_token: string
          _user_agent: string
        }
        Returns: {
          expires_at: string
          session_token: string
        }[]
      }
      create_emergency_access: {
        Args: {
          _incident_ticket: string
          _ip_address?: string
          _reason: string
          _target_org_id: string
          _user_agent?: string
        }
        Returns: Json
      }
      create_platform_admin_user: {
        Args: {
          _email: string
          _full_name: string
          _password_hash: string
          _username: string
        }
        Returns: {
          email: string
          full_name: string
          id: string
          username: string
        }[]
      }
      deploy_app: {
        Args: {
          _app_id: string
          _deployment_type: string
          _target_orgs?: Json
          _version_id: string
        }
        Returns: Json
      }
      end_emergency_access: {
        Args: { _actions_taken: Json; _emergency_id: string }
        Returns: boolean
      }
      export_audit_logs: {
        Args: { _end_date: string; _log_type?: string; _start_date: string }
        Returns: {
          action: string
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          resource_id: string
          resource_type: string
          user_email: string
          user_id: string
        }[]
      }
      generate_admin_migration_tokens: {
        Args: never
        Returns: {
          email: string
          expires_at: string
          full_name: string
          migration_token: string
        }[]
      }
      get_active_access_sessions: {
        Args: never
        Returns: {
          admin_email: string
          admin_name: string
          admin_user_id: string
          created_at: string
          expires_at: string
          id: string
          org_name: string
          reason: string
          target_organization_id: string
          ticket_reference: string
          time_remaining: unknown
        }[]
      }
      get_active_ip_whitelist_count: { Args: never; Returns: number }
      get_admin_scopes: {
        Args: { _admin_id?: string }
        Returns: {
          admin_email: string
          admin_name: string
          admin_user_id: string
          created_at: string
          created_by_name: string
          description: string
          expires_at: string
          id: string
          is_active: boolean
          scope_type: string
          scope_value: Json
        }[]
      }
      get_admin_user: {
        Args: { _identifier: string }
        Returns: {
          email: string
          failed_login_attempts: number
          full_name: string
          id: string
          is_active: boolean
          locked_until: string
          mfa_enabled: boolean
          password_hash: string
          username: string
        }[]
      }
      get_admin_user_by_id: {
        Args: { _id: string }
        Returns: {
          email: string
          full_name: string
          id: string
          is_active: boolean
          username: string
        }[]
      }
      get_app_health_overview: {
        Args: never
        Returns: {
          app_id: string
          app_name: string
          avg_response_time: number
          avg_uptime: number
          critical_orgs: number
          degraded_orgs: number
          healthy_orgs: number
          offline_orgs: number
          total_orgs: number
        }[]
      }
      get_app_usage_summary: {
        Args: { _app_id?: string; _days_back?: number }
        Returns: Json
      }
      get_boundary_crossing_analytics: {
        Args: { days_back?: number }
        Returns: Json
      }
      get_data_classifications: {
        Args: never
        Returns: {
          classification: Database["public"]["Enums"]["data_classification"]
          created_at: string
          description: string
          encryption_required: boolean
          id: string
          retention_days: number
          schema_name: string
          table_name: string
          updated_at: string
        }[]
      }
      get_emergency_access_log: {
        Args: { _limit?: number }
        Returns: {
          access_ended_at: string
          access_started_at: string
          actions_taken: Json
          admin_email: string
          admin_name: string
          admin_user_id: string
          created_at: string
          duration_minutes: number
          id: string
          incident_ticket: string
          org_name: string
          reason: string
          target_organization_id: string
        }[]
      }
      get_object_type_properties: {
        Args: { object_type_id_param: string }
        Returns: {
          data_type: string
          default_value: Json
          display_name: string
          is_required: boolean
          name: string
          property_id: string
        }[]
      }
      get_object_with_properties: {
        Args: { object_id_param: string }
        Returns: Json
      }
      get_performance_summary: {
        Args: { _hours_back?: number; _org_id?: string }
        Returns: Json
      }
      get_platform_access_logs: {
        Args: { limit_count?: number }
        Returns: {
          accessed_organization_id: string
          accessed_schema: string
          accessed_table: string
          action: string
          admin_email: string
          admin_name: string
          admin_user_id: string
          created_at: string
          id: string
          org_name: string
          reason: string
          success: boolean
        }[]
      }
      get_platform_admin_count: { Args: never; Returns: number }
      get_platform_metrics: { Args: never; Returns: Json }
      get_schema_boundary_logs: {
        Args: { limit_count?: number }
        Returns: {
          approval_reason: string
          approved: boolean
          approved_by: string
          approver_name: string
          created_at: string
          data_classification: Database["public"]["Enums"]["data_classification"]
          id: string
          metadata: Json
          operation: string
          source_schema: string
          target_schema: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_security_metrics: { Args: { _days_back?: number }; Returns: Json }
      get_user_permissions: {
        Args: { _org_id: string; _user_id: string }
        Returns: {
          permission: Database["public"]["Enums"]["permission_type"]
        }[]
      }
      get_user_primary_firm: { Args: { _user_id: string }; Returns: string }
      get_user_primary_org: { Args: { _user_id: string }; Returns: string }
      get_user_roles: {
        Args: { _firm_id: string; _user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_permission:
        | {
            Args: {
              _firm_id: string
              _permission: string
              _resource_type: string
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _org_id: string
              _permission: Database["public"]["Enums"]["permission_type"]
              _user_id: string
            }
            Returns: boolean
          }
      has_role: {
        Args: {
          _firm_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_failed_login: {
        Args: { _admin_id: string }
        Returns: {
          failed_login_attempts: number
          locked_until: string
        }[]
      }
      is_firm_member: {
        Args: { _firm_id: string; _user_id: string }
        Returns: boolean
      }
      is_ip_whitelisted: { Args: { _ip_address: string }; Returns: boolean }
      is_org_member: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          _action: string
          _metadata?: Json
          _organization_id: string
          _resource_id?: string
          _resource_type: string
          _user_id: string
        }
        Returns: string
      }
      manage_admin_scope: {
        Args: {
          _description?: string
          _expires_at?: string
          _operation: string
          _scope_id?: string
          _scope_type?: string
          _scope_value?: Json
          _target_admin_id?: string
        }
        Returns: Json
      }
      request_privilege_elevation: {
        Args: {
          _duration_minutes?: number
          _justification: string
          _privilege: string
          _ticket_reference?: string
        }
        Returns: Json
      }
      reset_failed_login_and_update_last_login: {
        Args: { _admin_id: string }
        Returns: undefined
      }
      revoke_access_justification: {
        Args: { _justification_id: string; _revoke_reason?: string }
        Returns: boolean
      }
      revoke_admin_session: {
        Args: { _reason?: string; _session_token: string }
        Returns: boolean
      }
      update_admin_session_activity: {
        Args: { _session_token: string }
        Returns: boolean
      }
      validate_firm_isolation: {
        Args: never
        Returns: {
          details: string
          passed: boolean
          test_name: string
        }[]
      }
    }
    Enums: {
      ai_agent_status: "draft" | "active" | "paused" | "archived"
      ai_agent_type: "rag" | "workflow" | "automation" | "analysis"
      ai_execution_status:
        | "pending"
        | "running"
        | "success"
        | "failed"
        | "cancelled"
      ai_trigger_type: "manual" | "scheduled" | "event" | "webhook"
      app_role:
        | "firm_administrator"
        | "partner"
        | "practice_leader"
        | "business_development"
        | "engagement_manager"
        | "senior_auditor"
        | "staff_auditor"
        | "client_administrator"
        | "client_user"
      data_classification:
        | "public"
        | "internal"
        | "confidential"
        | "restricted"
        | "highly_restricted"
      permission_type:
        | "org.manage"
        | "org.view"
        | "project.create"
        | "project.manage"
        | "project.view"
        | "task.create"
        | "task.manage"
        | "task.view"
        | "deliverable.create"
        | "deliverable.manage"
        | "deliverable.approve"
        | "deliverable.view"
        | "file.upload"
        | "file.download"
        | "file.delete"
        | "form.create"
        | "form.assign"
        | "form.complete"
        | "stakeholder.invite"
        | "stakeholder.manage"
        | "audit.view"
        | "settings.manage"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_agent_status: ["draft", "active", "paused", "archived"],
      ai_agent_type: ["rag", "workflow", "automation", "analysis"],
      ai_execution_status: [
        "pending",
        "running",
        "success",
        "failed",
        "cancelled",
      ],
      ai_trigger_type: ["manual", "scheduled", "event", "webhook"],
      app_role: [
        "firm_administrator",
        "partner",
        "practice_leader",
        "business_development",
        "engagement_manager",
        "senior_auditor",
        "staff_auditor",
        "client_administrator",
        "client_user",
      ],
      data_classification: [
        "public",
        "internal",
        "confidential",
        "restricted",
        "highly_restricted",
      ],
      permission_type: [
        "org.manage",
        "org.view",
        "project.create",
        "project.manage",
        "project.view",
        "task.create",
        "task.manage",
        "task.view",
        "deliverable.create",
        "deliverable.manage",
        "deliverable.approve",
        "deliverable.view",
        "file.upload",
        "file.download",
        "file.delete",
        "form.create",
        "form.assign",
        "form.complete",
        "stakeholder.invite",
        "stakeholder.manage",
        "audit.view",
        "settings.manage",
      ],
    },
  },
} as const
