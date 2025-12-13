#!/bin/bash

# Deploy All Edge Functions Script
# Run this to deploy all Supabase edge functions at once

cd "$(dirname "$0")/supabase/functions"

echo "🚀 Deploying all edge functions to Supabase..."
echo "================================================"
echo ""

# Counter for tracking
TOTAL=0
SUCCESS=0
FAILED=0

# Get all function directories (exclude deno.json which is not a function)
for dir in */; do
  # Remove trailing slash
  func_name="${dir%/}"

  # Skip if it's not a directory or if it's a hidden directory
  if [ ! -d "$func_name" ] || [[ "$func_name" == .* ]]; then
    continue
  fi

  TOTAL=$((TOTAL + 1))

  echo "[$TOTAL] Deploying: $func_name"

  # Deploy the function
  if supabase functions deploy "$func_name" --no-verify-jwt 2>&1 | grep -q "Deployed"; then
    SUCCESS=$((SUCCESS + 1))
    echo "    ✅ Success"
  else
    FAILED=$((FAILED + 1))
    echo "    ❌ Failed"
  fi

  echo ""
done

echo "================================================"
echo "📊 Deployment Summary:"
echo "   Total:   $TOTAL functions"
echo "   Success: $SUCCESS functions"
echo "   Failed:  $FAILED functions"
echo "================================================"

if [ $FAILED -eq 0 ]; then
  echo "✅ All functions deployed successfully!"
else
  echo "⚠️  Some functions failed to deploy. Check errors above."
fi
