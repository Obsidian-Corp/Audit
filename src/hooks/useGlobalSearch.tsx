import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { format } from "date-fns";

export interface SearchResult {
  id: string;
  title: string;
  type: "project" | "task" | "meeting" | "stakeholder" | "form" | "risk" | "deliverable";
  status?: string;
  description?: string;
  date?: string;
  icon: any;
  url: string;
}

export function useGlobalSearch() {
  const { currentOrg } = useOrganization();
  const [searchData, setSearchData] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;

    const fetchSearchData = async () => {
      setIsLoading(true);
      try {
        const [projectsRes, meetingsRes, stakeholdersRes, formsRes] =
          await Promise.all([
            supabase
              .from("projects")
              .select("id, name, status, description, start_date")
              .eq("organization_id", currentOrg.id)
              .limit(100),
            supabase
              .from("meetings")
              .select("id, title, meeting_type, status, description, scheduled_at")
              .eq("organization_id", currentOrg.id)
              .limit(100),
            supabase
              .from("stakeholders")
              .select("id, name, role, influence_level, interest_level")
              .eq("organization_id", currentOrg.id)
              .limit(100),
            supabase
              .from("form_runs")
              .select("id, title, status, description, due_date")
              .eq("organization_id", currentOrg.id)
              .limit(100),
          ]);

        const results: SearchResult[] = [];

        // Projects
        if (projectsRes.data) {
          results.push(
            ...projectsRes.data.map((p) => ({
              id: p.id,
              title: p.name,
              type: "project" as const,
              status: p.status,
              description: p.description || undefined,
              date: p.start_date ? format(new Date(p.start_date), "PPP") : undefined,
              icon: null,
              url: `/dashboard/projects/${p.id}`,
            }))
          );
        }

        // Meetings
        if (meetingsRes.data) {
          results.push(
            ...meetingsRes.data.map((m) => ({
              id: m.id,
              title: m.title,
              type: "meeting" as const,
              status: m.status,
              description: m.description || undefined,
              date: m.scheduled_at
                ? format(new Date(m.scheduled_at), "PPP")
                : undefined,
              icon: null,
              url: `/dashboard/meetings/${m.id}`,
            }))
          );
        }

        // Stakeholders
        if (stakeholdersRes.data) {
          results.push(
            ...stakeholdersRes.data.map((s) => ({
              id: s.id,
              title: s.name,
              type: "stakeholder" as const,
              status: undefined,
              description: s.role || undefined,
              date: undefined,
              icon: null,
              url: `/dashboard/stakeholders`,
            }))
          );
        }

        // Forms
        if (formsRes.data) {
          results.push(
            ...formsRes.data.map((f) => ({
              id: f.id,
              title: f.title,
              type: "form" as const,
              status: f.status,
              description: f.description || undefined,
              date: f.due_date ? format(new Date(f.due_date), "PPP") : undefined,
              icon: null,
              url: `/dashboard/forms/${f.id}`,
            }))
          );
        }

        setSearchData(results);
      } catch (error) {
        console.error("Error fetching search data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchData();
  }, [currentOrg]);

  return { searchData, isLoading };
}
