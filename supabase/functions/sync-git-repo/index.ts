import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Parse SQL/Python files to detect dependencies
function extractDependencies(code: string, fileType: string): string[] {
  const dependencies: string[] = [];

  if (fileType === "sql") {
    // Look for comments like: -- depends: transform_name
    const dependsPattern = /--\s*depends:\s*([a-zA-Z0-9_,\s]+)/gi;
    let match;
    while ((match = dependsPattern.exec(code)) !== null) {
      const deps = match[1].split(",").map(d => d.trim()).filter(Boolean);
      dependencies.push(...deps);
    }
  } else if (fileType === "python") {
    // Look for comments like: # depends: transform_name
    const dependsPattern = /#\s*depends:\s*([a-zA-Z0-9_,\s]+)/gi;
    let match;
    while ((match = dependsPattern.exec(code)) !== null) {
      const deps = match[1].split(",").map(d => d.trim()).filter(Boolean);
      dependencies.push(...deps);
    }
  }

  return [...new Set(dependencies)]; // Remove duplicates
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        status: "healthy",
        function: "sync-git-repo",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { repositoryId } = await req.json();

    if (!repositoryId) {
      throw new Error("Missing required field: repositoryId");
    }

    // Get repository details
    const { data: repo, error: repoError } = await supabaseClient
      .from("transform_repositories")
      .select("*")
      .eq("id", repositoryId)
      .single();

    if (repoError) throw repoError;

    // In a real implementation, this would:
    // 1. Clone/pull the Git repository
    // 2. Parse transform files (.sql, .py)
    // 3. Extract dependencies from file comments
    // 4. Create/update transforms in the database
    
    // For demo purposes, we'll simulate finding transforms
    // In production, you'd use git commands or a Git library
    
    // Mock transforms found in repository
    const mockTransforms = [
      {
        name: "raw_to_staging",
        file_path: "transforms/raw_to_staging.sql",
        transform_type: "sql",
        code: `-- depends: 
-- Raw data to staging transformation
INSERT INTO staging.customers
SELECT * FROM raw.customers
WHERE updated_at > (SELECT MAX(updated_at) FROM staging.customers);`,
        depends_on: [],
        version: "abc123",
      },
      {
        name: "staging_to_analytics",
        file_path: "transforms/staging_to_analytics.sql",
        transform_type: "sql",
        code: `-- depends: raw_to_staging
-- Staging to analytics transformation
CREATE OR REPLACE VIEW analytics.customer_summary AS
SELECT 
  customer_id,
  COUNT(*) as order_count,
  SUM(amount) as total_spent
FROM staging.orders
GROUP BY customer_id;`,
        depends_on: ["raw_to_staging"],
        version: "def456",
      },
    ];

    const syncedTransforms = [];
    const transformIdMap = new Map<string, string>();

    // Upsert transforms
    for (const mockTransform of mockTransforms) {
      const transformData = {
        repository_id: repositoryId,
        name: mockTransform.name,
        file_path: mockTransform.file_path,
        transform_type: mockTransform.transform_type,
        code: mockTransform.code,
        depends_on: mockTransform.depends_on,
        version: mockTransform.version,
        is_active: true,
      };

      // Check if transform exists
      const { data: existingTransform } = await supabaseClient
        .from("transforms")
        .select("id")
        .eq("repository_id", repositoryId)
        .eq("name", mockTransform.name)
        .single();

      if (existingTransform) {
        // Update existing
        const { data, error } = await supabaseClient
          .from("transforms")
          .update(transformData)
          .eq("id", existingTransform.id)
          .select()
          .single();

        if (error) throw error;
        transformIdMap.set(mockTransform.name, data.id);
        syncedTransforms.push(data);
      } else {
        // Insert new
        const { data, error } = await supabaseClient
          .from("transforms")
          .insert(transformData)
          .select()
          .single();

        if (error) throw error;
        transformIdMap.set(mockTransform.name, data.id);
        syncedTransforms.push(data);
      }
    }

    // Update dependencies
    for (const transform of syncedTransforms) {
      if (transform.depends_on && transform.depends_on.length > 0) {
        // Delete existing dependencies
        await supabaseClient
          .from("transform_dependencies")
          .delete()
          .eq("transform_id", transform.id);

        // Insert new dependencies
        const dependencyRecords = transform.depends_on
          .map((depName: string) => {
            const depId = transformIdMap.get(depName);
            if (!depId) return null;
            return {
              transform_id: transform.id,
              depends_on_transform_id: depId,
            };
          })
          .filter(Boolean);

        if (dependencyRecords.length > 0) {
          await supabaseClient
            .from("transform_dependencies")
            .insert(dependencyRecords);
        }
      }
    }

    // Update last sync timestamp
    await supabaseClient
      .from("transform_repositories")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", repositoryId);

    return new Response(
      JSON.stringify({
        success: true,
        syncedCount: syncedTransforms.length,
        transforms: syncedTransforms.map(t => ({
          id: t.id,
          name: t.name,
          file_path: t.file_path,
        })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error syncing repository:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
