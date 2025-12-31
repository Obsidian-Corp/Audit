#!/bin/bash

SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic"
BASE_URL="https://qtsvdeauuawfewdzbflr.supabase.co/rest/v1"

echo "=== COMPREHENSIVE DATABASE INVENTORY ==="
echo "Date: $(date)"
echo ""

tables=(
  "firms"
  "profiles"
  "clients"
  "audits"
  "audit_findings"
  "confirmations"
  "tasks"
  "audit_procedures"
  "engagement_procedures"
  "materiality_calculations"
  "time_entries"
  "review_notes"
  "audit_programs"
  "risks"
  "audit_samples"
  "audit_workpapers"
  "projects"
  "engagement_activity"
  "audit_program_steps"
  "workpaper_templates"
  "procedure_templates"
  "documents"
  "client_contacts"
  "user_roles"
)

for table in "${tables[@]}"; do
  response=$(curl -s "$BASE_URL/$table?select=*&limit=0" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Prefer: count=exact" \
    -w "\n%{http_code}" 2>/dev/null)

  http_code=$(echo "$response" | tail -n1)

  if [ "$http_code" = "200" ]; then
    count=$(curl -s -I "$BASE_URL/$table?select=*&limit=0" \
      -H "apikey: $SERVICE_KEY" \
      -H "Authorization: Bearer $SERVICE_KEY" \
      -H "Prefer: count=exact" 2>/dev/null | grep -i "content-range" | sed 's/.*\///' | tr -d '\r')
    echo "$table: $count"
  else
    echo "$table: TABLE_NOT_FOUND"
  fi
done

echo ""
echo "=== END INVENTORY ==="
