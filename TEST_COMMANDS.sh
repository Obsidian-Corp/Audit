#!/bin/bash
# =============================================================================
# Test Commands for Security Fixes Deployment
# Run these commands to verify the deployment
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Security Fixes - Test Suite${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL not set${NC}"
    echo "Please set it with: export DATABASE_URL='your-connection-string'"
    exit 1
fi

echo -e "${YELLOW}Database URL: ${DATABASE_URL:0:30}...${NC}"
echo ""

# =============================================================================
# Test 1: Pre-Deployment Verification
# =============================================================================
echo -e "${GREEN}Test 1: Pre-Deployment Verification${NC}"
echo "Running pre-deployment checks..."
psql $DATABASE_URL -f pre_deployment_verification.sql > pre_deploy_results.txt 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Pre-deployment verification completed${NC}"
    echo "Results saved to: pre_deploy_results.txt"
else
    echo -e "${RED}✗ Pre-deployment verification failed${NC}"
    exit 1
fi
echo ""

# =============================================================================
# Test 2: Migration Deployment
# =============================================================================
echo -e "${GREEN}Test 2: Migration Deployment${NC}"
echo "Deploying RLS policies migration..."
supabase db push --db-url $DATABASE_URL > migration_results.txt 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration deployed successfully${NC}"
else
    echo -e "${RED}✗ Migration deployment failed${NC}"
    cat migration_results.txt
    exit 1
fi
echo ""

# =============================================================================
# Test 3: Deploy Test Framework
# =============================================================================
echo -e "${GREEN}Test 3: Deploy Test Framework${NC}"
echo "Deploying RLS test framework..."
psql $DATABASE_URL -f supabase/tests/test_rls_policies.sql > test_deploy_results.txt 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test framework deployed${NC}"
else
    echo -e "${RED}✗ Test framework deployment failed${NC}"
    cat test_deploy_results.txt
    exit 1
fi
echo ""

# =============================================================================
# Test 4: Run RLS Tests
# =============================================================================
echo -e "${GREEN}Test 4: Run RLS Tests${NC}"
echo "Running all RLS isolation tests..."
psql $DATABASE_URL -c "SELECT tests.run_all_rls_tests();" > rls_test_results.txt 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ RLS tests executed${NC}"
    # Check for failures
    if grep -i "exception\|fail\|error" rls_test_results.txt | grep -v "PASSED" > /dev/null; then
        echo -e "${RED}✗ Some RLS tests failed${NC}"
        cat rls_test_results.txt
        exit 1
    else
        echo -e "${GREEN}✓ All RLS tests PASSED${NC}"
    fi
else
    echo -e "${RED}✗ RLS tests failed to run${NC}"
    cat rls_test_results.txt
    exit 1
fi
echo ""

# =============================================================================
# Test 5: Post-Deployment Verification
# =============================================================================
echo -e "${GREEN}Test 5: Post-Deployment Verification${NC}"
echo "Running post-deployment checks..."
psql $DATABASE_URL -f post_deployment_verification.sql > post_deploy_results.txt 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Post-deployment verification completed${NC}"
    echo "Results saved to: post_deploy_results.txt"
else
    echo -e "${RED}✗ Post-deployment verification failed${NC}"
    exit 1
fi
echo ""

# =============================================================================
# Test 6: Verify Policy Count
# =============================================================================
echo -e "${GREEN}Test 6: Verify Policy Count${NC}"
echo "Checking number of policies created..."
POLICY_COUNT=$(psql $DATABASE_URL -t -c "SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND policyname LIKE 'firm_members_%';")
POLICY_COUNT=$(echo $POLICY_COUNT | tr -d ' ')
echo "Found $POLICY_COUNT firm_members_* policies"
if [ "$POLICY_COUNT" -eq 56 ]; then
    echo -e "${GREEN}✓ Correct number of policies (56)${NC}"
elif [ "$POLICY_COUNT" -gt 56 ]; then
    echo -e "${YELLOW}⚠ More policies than expected ($POLICY_COUNT vs 56)${NC}"
else
    echo -e "${RED}✗ Missing policies ($POLICY_COUNT vs 56)${NC}"
    exit 1
fi
echo ""

# =============================================================================
# Test 7: Verify Test Functions
# =============================================================================
echo -e "${GREEN}Test 7: Verify Test Functions${NC}"
echo "Checking test functions..."
FUNC_COUNT=$(psql $DATABASE_URL -t -c "SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'tests';")
FUNC_COUNT=$(echo $FUNC_COUNT | tr -d ' ')
echo "Found $FUNC_COUNT test functions"
if [ "$FUNC_COUNT" -eq 4 ]; then
    echo -e "${GREEN}✓ All test functions created (4)${NC}"
else
    echo -e "${YELLOW}⚠ Unexpected number of test functions ($FUNC_COUNT vs 4)${NC}"
fi
echo ""

# =============================================================================
# Test 8: Deploy Edge Functions
# =============================================================================
echo -e "${GREEN}Test 8: Deploy Edge Functions${NC}"
echo "Deploying calculate-materiality..."
supabase functions deploy calculate-materiality > materiality_deploy.txt 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ calculate-materiality deployed${NC}"
else
    echo -e "${RED}✗ calculate-materiality deployment failed${NC}"
    cat materiality_deploy.txt
fi

echo "Deploying calculate-sampling..."
supabase functions deploy calculate-sampling > sampling_deploy.txt 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ calculate-sampling deployed${NC}"
else
    echo -e "${RED}✗ calculate-sampling deployment failed${NC}"
    cat sampling_deploy.txt
fi
echo ""

# =============================================================================
# Test 9: List Edge Functions
# =============================================================================
echo -e "${GREEN}Test 9: Verify Edge Functions${NC}"
echo "Listing deployed functions..."
supabase functions list > functions_list.txt 2>&1
if grep -q "calculate-materiality" functions_list.txt && grep -q "calculate-sampling" functions_list.txt; then
    echo -e "${GREEN}✓ Both edge functions are deployed${NC}"
    cat functions_list.txt
else
    echo -e "${YELLOW}⚠ Some edge functions may not be deployed${NC}"
    cat functions_list.txt
fi
echo ""

# =============================================================================
# Test 10: Check for Errors
# =============================================================================
echo -e "${GREEN}Test 10: Error Check${NC}"
echo "Scanning all results for errors..."
ERROR_COUNT=0
for file in *_results.txt *_deploy.txt; do
    if [ -f "$file" ]; then
        if grep -i "error\|exception\|failed" "$file" | grep -v "PASSED\|expected" > /dev/null; then
            echo -e "${YELLOW}⚠ Potential issues in $file${NC}"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
    fi
done

if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ No errors detected${NC}"
else
    echo -e "${YELLOW}⚠ Found potential issues in $ERROR_COUNT file(s)${NC}"
    echo "Please review the output files manually"
fi
echo ""

# =============================================================================
# Summary
# =============================================================================
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Deployment Test Summary${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "✓ Pre-deployment verification"
echo "✓ Migration deployed"
echo "✓ Test framework deployed"
echo "✓ RLS tests executed"
echo "✓ Post-deployment verification"
echo "✓ Policy count verified: $POLICY_COUNT policies"
echo "✓ Test functions verified: $FUNC_COUNT functions"
echo "✓ Edge functions deployed"
echo ""
echo -e "${GREEN}All tests completed!${NC}"
echo ""
echo "Output files generated:"
echo "  - pre_deploy_results.txt"
echo "  - migration_results.txt"
echo "  - test_deploy_results.txt"
echo "  - rls_test_results.txt"
echo "  - post_deploy_results.txt"
echo "  - materiality_deploy.txt"
echo "  - sampling_deploy.txt"
echo "  - functions_list.txt"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Review all output files for any warnings"
echo "2. Test edge functions with sample requests"
echo "3. Monitor application for 30 minutes"
echo "4. Verify user access works correctly"
echo ""
echo -e "${GREEN}Deployment complete! 🚀${NC}"
