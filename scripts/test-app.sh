#!/bin/bash

# Comprehensive Application Testing Script
# Tests all major features and endpoints

BASE_URL="${1:-http://localhost:3001}"
RESULTS_FILE="test-results.txt"

echo "🧪 Starting Comprehensive Application Testing"
echo "Testing URL: $BASE_URL"
echo "Results will be saved to: $RESULTS_FILE"
echo ""
echo "========================================" > $RESULTS_FILE
echo "Application Test Results" >> $RESULTS_FILE
echo "Date: $(date)" >> $RESULTS_FILE
echo "URL: $BASE_URL" >> $RESULTS_FILE
echo "========================================" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0
TOTAL=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    TOTAL=$((TOTAL + 1))
    echo -n "Testing $name... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status)"
        echo "✓ PASS - $name (Status: $status)" >> $RESULTS_FILE
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status)"
        echo "✗ FAIL - $name (Expected: $expected_status, Got: $status)" >> $RESULTS_FILE
        FAILED=$((FAILED + 1))
    fi
}

# Function to test page content
test_content() {
    local name=$1
    local url=$2
    local search_text=$3
    
    TOTAL=$((TOTAL + 1))
    echo -n "Testing $name content... "
    
    content=$(curl -s "$url" 2>/dev/null)
    
    if echo "$content" | grep -q "$search_text"; then
        echo -e "${GREEN}✓ PASS${NC}"
        echo "✓ PASS - $name content check" >> $RESULTS_FILE
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (Content not found: $search_text)"
        echo "✗ FAIL - $name content check (Content not found)" >> $RESULTS_FILE
        FAILED=$((FAILED + 1))
    fi
}

echo "📄 Testing Public Pages..."
echo "" >> $RESULTS_FILE
echo "PUBLIC PAGES:" >> $RESULTS_FILE
test_endpoint "Home Page" "$BASE_URL/" "200"
test_endpoint "Login Page" "$BASE_URL/login" "200"
test_endpoint "Features Page" "$BASE_URL/features" "200"
test_endpoint "Pricing Page" "$BASE_URL/pricing" "200"
test_endpoint "Docs Page" "$BASE_URL/docs" "200"

echo ""
echo "🔐 Testing Authentication Pages..."
echo "" >> $RESULTS_FILE
echo "AUTHENTICATION:" >> $RESULTS_FILE
test_endpoint "Auth Page" "$BASE_URL/auth" "200"
test_endpoint "Reset Password" "$BASE_URL/auth/reset-password" "200"

echo ""
echo "🔒 Testing Protected Routes (Should redirect or 401)..."
echo "" >> $RESULTS_FILE
echo "PROTECTED ROUTES:" >> $RESULTS_FILE
test_endpoint "Dashboard" "$BASE_URL/dashboard" "401"
test_endpoint "Dashboard Analytics" "$BASE_URL/dashboard/analytics" "401"
test_endpoint "Dashboard Billing" "$BASE_URL/dashboard/billing" "401"
test_endpoint "Settings AI" "$BASE_URL/settings/ai" "401"

echo ""
echo "🔌 Testing API Endpoints..."
echo "" >> $RESULTS_FILE
echo "API ENDPOINTS:" >> $RESULTS_FILE
test_endpoint "API Health" "$BASE_URL/api/health" "200"
test_endpoint "NextAuth API" "$BASE_URL/api/auth/providers" "200"

echo ""
echo "📝 Testing Page Content..."
echo "" >> $RESULTS_FILE
echo "CONTENT CHECKS:" >> $RESULTS_FILE
test_content "Login Page" "$BASE_URL/login" "Test Credentials"
test_content "Home Page" "$BASE_URL/" "SAAS"

echo ""
echo "========================================" >> $RESULTS_FILE
echo "SUMMARY:" >> $RESULTS_FILE
echo "Total Tests: $TOTAL" >> $RESULTS_FILE
echo "Passed: $PASSED" >> $RESULTS_FILE
echo "Failed: $FAILED" >> $RESULTS_FILE
echo "Success Rate: $(( PASSED * 100 / TOTAL ))%" >> $RESULTS_FILE
echo "========================================" >> $RESULTS_FILE

echo ""
echo "========================================="
echo "📊 Test Summary"
echo "========================================="
echo "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Success Rate: $(( PASSED * 100 / TOTAL ))%"
echo "========================================="
echo ""
echo "Full results saved to: $RESULTS_FILE"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✨ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check $RESULTS_FILE for details.${NC}"
    exit 1
fi
