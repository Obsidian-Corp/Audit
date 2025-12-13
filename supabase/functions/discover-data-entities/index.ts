import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Discover tables from information_schema
    const { data: tables, error: tablesError } = await supabase
      .rpc('pg_catalog.pg_tables')
      .select('*');

    // Get existing entities to avoid duplicates
    const { data: existingEntities } = await supabase
      .from('platform_admin.data_entities')
      .select('entity_name, schema_name')
      .eq('organization_id', organizationId);

    const existingSet = new Set(
      existingEntities?.map((e: any) => `${e.schema_name}.${e.entity_name}`) || []
    );

    // Discover public schema tables
    const { data: publicTables } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name, table_type')
      .eq('table_schema', 'public');

    const entities = [];
    const relationships = [];

    for (const table of publicTables || []) {
      const fullName = `${table.table_schema}.${table.table_name}`;
      
      if (existingSet.has(fullName)) continue;

      // Classify based on table name patterns
      const classification = classifyTable(table.table_name);

      entities.push({
        organization_id: organizationId,
        entity_name: table.table_name,
        entity_type: table.table_type === 'VIEW' ? 'view' : 'table',
        schema_name: table.table_schema,
        description: `Auto-discovered ${table.table_type.toLowerCase()}`,
        data_classification: classification,
        pii_contains: isPIITable(table.table_name),
        metadata: {
          discovered_at: new Date().toISOString(),
          auto_discovered: true
        }
      });
    }

    // Insert discovered entities
    let entityIds: any[] = [];
    if (entities.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('platform_admin.data_entities')
        .insert(entities)
        .select('id, entity_name, schema_name');

      if (insertError) throw insertError;
      entityIds = inserted || [];
    }

    // Discover relationships based on foreign keys
    const { data: foreignKeys } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('constraint_type', 'FOREIGN KEY')
      .eq('table_schema', 'public');

    // Create relationship mappings
    for (const fk of foreignKeys || []) {
      const sourceEntity = entityIds.find(e => e.entity_name === fk.table_name);
      const targetEntity = entityIds.find(e => e.entity_name === fk.referenced_table_name);

      if (sourceEntity && targetEntity) {
        relationships.push({
          source_entity_id: sourceEntity.id,
          target_entity_id: targetEntity.id,
          relationship_type: 'references',
          metadata: {
            constraint_name: fk.constraint_name,
            discovered_at: new Date().toISOString()
          }
        });
      }
    }

    // Insert relationships
    if (relationships.length > 0) {
      const { error: relError } = await supabase
        .from('platform_admin.data_relationships')
        .insert(relationships);

      if (relError) console.error('Error inserting relationships:', relError);
    }

    return new Response(
      JSON.stringify({ 
        discovered_entities: entities.length,
        discovered_relationships: relationships.length,
        entities: entityIds
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function classifyTable(tableName: string): string {
  const name = tableName.toLowerCase();
  
  if (name.includes('user') || name.includes('profile') || name.includes('auth')) {
    return 'confidential';
  }
  if (name.includes('payment') || name.includes('billing') || name.includes('financial')) {
    return 'restricted';
  }
  if (name.includes('audit') || name.includes('log')) {
    return 'internal';
  }
  
  return 'internal';
}

function isPIITable(tableName: string): boolean {
  const name = tableName.toLowerCase();
  return name.includes('user') || 
         name.includes('profile') || 
         name.includes('contact') ||
         name.includes('email') ||
         name.includes('phone');
}
