#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
REPORT_FILE="$PROJECT_DIR/data/test-report.txt"

API_URL="http://localhost:3848"
CRAWLER_URL="http://localhost:3849"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

log() { echo -e "$1"; echo "$1" | sed 's/\x1b\[[0-9;]*m//g' >> "$REPORT_FILE"; }
section() { log "\n${CYAN}═══════════════════════════════════════════════════════════════${NC}"; log "${CYAN}  $1${NC}"; log "${CYAN}═══════════════════════════════════════════════════════════════${NC}\n"; }
pass() { ((PASSED++)); log "${GREEN}[PASS]${NC} $1"; }
fail() { ((FAILED++)); log "${RED}[FAIL]${NC} $1"; }
warn() { ((WARNINGS++)); log "${YELLOW}[WARN]${NC} $1"; }
info() { log "${BLUE}[INFO]${NC} $1"; }

# Initialize report
mkdir -p "$(dirname "$REPORT_FILE")"
echo "QUOTATOR TEST REPORT" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "==========================================" >> "$REPORT_FILE"

section "1. SERVICE HEALTH TESTS"

# Test Crawler Health
info "Testing Crawler service..."
crawler_health=$(curl -s -w "\n%{http_code}" "$CRAWLER_URL/health" 2>/dev/null)
crawler_code=$(echo "$crawler_health" | tail -1)
crawler_body=$(echo "$crawler_health" | head -1)

if [ "$crawler_code" = "200" ]; then
    pass "Crawler health endpoint (HTTP $crawler_code)"
    info "  Response: $crawler_body"
else
    fail "Crawler health endpoint (HTTP $crawler_code)"
fi

# Test API Health
info "Testing API service..."
api_health=$(curl -s -w "\n%{http_code}" "$API_URL/health" 2>/dev/null)
api_code=$(echo "$api_health" | tail -1)
api_body=$(echo "$api_health" | head -1)

if [ "$api_code" = "200" ]; then
    pass "API health endpoint (HTTP $api_code)"
    info "  Response: $api_body"
else
    fail "API health endpoint (HTTP $api_code)"
fi

section "2. PRICING DATA TESTS"

# Test Flavors
info "Testing ECS flavors endpoint..."
flavors=$(curl -s "$API_URL/flavors" 2>/dev/null)
flavor_count=$(echo "$flavors" | grep -o '"id"' | wc -l | tr -d ' ')

if [ "$flavor_count" -gt 0 ]; then
    pass "ECS Flavors endpoint returned $flavor_count instance types"

    # Validate data structure
    if echo "$flavors" | grep -q '"vcpus"' && echo "$flavors" | grep -q '"ram_gb"' && echo "$flavors" | grep -q '"price_hourly"'; then
        pass "Flavor data structure is valid"
    else
        fail "Flavor data structure is missing required fields"
    fi

    # Check for Istanbul region
    if echo "$flavors" | grep -q '"tr-istanbul-1"'; then
        pass "Flavors are for Istanbul region"
    else
        warn "Flavors may not be for Istanbul region"
    fi
else
    fail "ECS Flavors endpoint returned no data"
fi

# Test Disk Types
info "Testing EVS disk types endpoint..."
disks=$(curl -s "$API_URL/disks" 2>/dev/null)
disk_count=$(echo "$disks" | grep -o '"id"' | wc -l | tr -d ' ')

if [ "$disk_count" -gt 0 ]; then
    pass "EVS Disk types endpoint returned $disk_count types"

    # Check for expected disk types
    for dtype in "sata" "sas" "ssd"; do
        if echo "$disks" | grep -q "\"$dtype\""; then
            pass "Found expected disk type: $dtype"
        else
            warn "Missing expected disk type: $dtype"
        fi
    done
else
    fail "EVS Disk types endpoint returned no data"
fi

section "3. QUOTE CRUD TESTS"

# Create Quote
info "Testing quote creation..."
create_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/quotes" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Quote"}' 2>/dev/null)
create_code=$(echo "$create_response" | tail -1)
create_body=$(echo "$create_response" | head -1)

if [ "$create_code" = "201" ]; then
    pass "Quote creation (HTTP $create_code)"
    QUOTE_ID=$(echo "$create_body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    info "  Created quote ID: $QUOTE_ID"
else
    fail "Quote creation (HTTP $create_code)"
    QUOTE_ID=""
fi

if [ -n "$QUOTE_ID" ]; then
    # Read Quote
    info "Testing quote retrieval..."
    read_response=$(curl -s -w "\n%{http_code}" "$API_URL/quotes/$QUOTE_ID" 2>/dev/null)
    read_code=$(echo "$read_response" | tail -1)

    if [ "$read_code" = "200" ]; then
        pass "Quote retrieval (HTTP $read_code)"
    else
        fail "Quote retrieval (HTTP $read_code)"
    fi

    # Update Quote
    info "Testing quote update..."
    update_response=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/quotes/$QUOTE_ID" \
        -H "Content-Type: application/json" \
        -d '{"name":"Updated Test Quote"}' 2>/dev/null)
    update_code=$(echo "$update_response" | tail -1)

    if [ "$update_code" = "200" ]; then
        pass "Quote update (HTTP $update_code)"
    else
        fail "Quote update (HTTP $update_code)"
    fi

    # Add Item to Quote
    info "Testing quote item creation..."
    item_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/quotes/$QUOTE_ID/items" \
        -H "Content-Type: application/json" \
        -d '{
            "flavor_id": "s6.large.2",
            "flavor_name": "s6.large.2",
            "vcpus": 2,
            "ram_gb": 4,
            "flavor_price": 0.036,
            "disk_type_id": "ssd",
            "disk_type_name": "SSD",
            "disk_size_gb": 100,
            "disk_price": 12.0,
            "hostname": "test-server-01",
            "code_number": "TS-001",
            "description": "Test server"
        }' 2>/dev/null)
    item_code=$(echo "$item_response" | tail -1)
    item_body=$(echo "$item_response" | head -1)

    if [ "$item_code" = "201" ]; then
        pass "Quote item creation (HTTP $item_code)"
        ITEM_ID=$(echo "$item_body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        info "  Created item ID: $ITEM_ID"
    else
        fail "Quote item creation (HTTP $item_code)"
    fi

    # Get Items
    info "Testing quote items retrieval..."
    items_response=$(curl -s -w "\n%{http_code}" "$API_URL/quotes/$QUOTE_ID/items" 2>/dev/null)
    items_code=$(echo "$items_response" | tail -1)

    if [ "$items_code" = "200" ]; then
        pass "Quote items retrieval (HTTP $items_code)"
    else
        fail "Quote items retrieval (HTTP $items_code)"
    fi

    # Delete Item
    if [ -n "$ITEM_ID" ]; then
        info "Testing quote item deletion..."
        del_item_response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/quotes/$QUOTE_ID/items/$ITEM_ID" 2>/dev/null)
        del_item_code=$(echo "$del_item_response" | tail -1)

        if [ "$del_item_code" = "200" ]; then
            pass "Quote item deletion (HTTP $del_item_code)"
        else
            fail "Quote item deletion (HTTP $del_item_code)"
        fi
    fi

    # Delete Quote
    info "Testing quote deletion..."
    del_response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/quotes/$QUOTE_ID" 2>/dev/null)
    del_code=$(echo "$del_response" | tail -1)

    if [ "$del_code" = "200" ]; then
        pass "Quote deletion (HTTP $del_code)"
    else
        fail "Quote deletion (HTTP $del_code)"
    fi
fi

section "4. SECURITY TESTS"

# Test CORS
info "Testing CORS headers..."
cors_response=$(curl -s -I -X OPTIONS "$API_URL/health" -H "Origin: http://localhost:3847" 2>/dev/null)
if echo "$cors_response" | grep -qi "access-control"; then
    pass "CORS headers present"
else
    warn "CORS headers may not be configured"
fi

# Test invalid JSON
info "Testing invalid JSON handling..."
invalid_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/quotes" \
    -H "Content-Type: application/json" \
    -d 'invalid json' 2>/dev/null)
invalid_code=$(echo "$invalid_response" | tail -1)

if [ "$invalid_code" = "400" ]; then
    pass "Invalid JSON returns 400 Bad Request"
elif [ "$invalid_code" != "200" ] && [ "$invalid_code" != "201" ]; then
    pass "Invalid JSON rejected (HTTP $invalid_code)"
else
    fail "Invalid JSON accepted (HTTP $invalid_code)"
fi

# Test SQL injection attempt
info "Testing SQL injection protection..."
sqli_response=$(curl -s -w "\n%{http_code}" "$API_URL/quotes/'; DROP TABLE quotes;--" 2>/dev/null)
sqli_code=$(echo "$sqli_response" | tail -1)

if [ "$sqli_code" = "404" ] || [ "$sqli_code" = "400" ]; then
    pass "SQL injection attempt safely handled"
else
    warn "SQL injection test returned unexpected code: $sqli_code"
fi

# Test XSS in input
info "Testing XSS protection in input..."
xss_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/quotes" \
    -H "Content-Type: application/json" \
    -d '{"name":"<script>alert(1)</script>"}' 2>/dev/null)
xss_code=$(echo "$xss_response" | tail -1)

if [ "$xss_code" = "201" ]; then
    # Check if script tag is stored (should be escaped or stored as-is for later escaping)
    pass "XSS input accepted (should be escaped on output)"
    # Clean up
    xss_id=$(echo "$xss_response" | head -1 | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    [ -n "$xss_id" ] && curl -s -X DELETE "$API_URL/quotes/$xss_id" > /dev/null 2>&1
else
    warn "XSS input handling (HTTP $xss_code)"
fi

section "5. PERFORMANCE TESTS"

# Response time test
info "Testing API response times..."
for endpoint in "/health" "/flavors" "/disks" "/quotes"; do
    start=$(date +%s%N)
    curl -s "$API_URL$endpoint" > /dev/null 2>&1
    end=$(date +%s%N)
    duration=$(( (end - start) / 1000000 ))

    if [ "$duration" -lt 100 ]; then
        pass "$endpoint response time: ${duration}ms (excellent)"
    elif [ "$duration" -lt 500 ]; then
        pass "$endpoint response time: ${duration}ms (good)"
    else
        warn "$endpoint response time: ${duration}ms (slow)"
    fi
done

# Concurrent requests test
info "Testing concurrent request handling..."
start=$(date +%s%N)
for i in {1..10}; do
    curl -s "$API_URL/flavors" > /dev/null 2>&1 &
done
wait
end=$(date +%s%N)
total_duration=$(( (end - start) / 1000000 ))
avg_duration=$(( total_duration / 10 ))

if [ "$avg_duration" -lt 200 ]; then
    pass "10 concurrent requests avg: ${avg_duration}ms (excellent)"
elif [ "$avg_duration" -lt 500 ]; then
    pass "10 concurrent requests avg: ${avg_duration}ms (good)"
else
    warn "10 concurrent requests avg: ${avg_duration}ms (slow)"
fi

section "6. SCALING TEST"

info "Running load test (100 requests)..."
success_count=0
fail_count=0
total_time=0

for i in {1..100}; do
    start=$(date +%s%N)
    response=$(curl -s -w "%{http_code}" -o /dev/null "$API_URL/flavors" 2>/dev/null)
    end=$(date +%s%N)
    duration=$(( (end - start) / 1000000 ))
    total_time=$((total_time + duration))

    if [ "$response" = "200" ]; then
        ((success_count++))
    else
        ((fail_count++))
    fi
done

avg_time=$((total_time / 100))
success_rate=$((success_count * 100 / 100))

info "  Total requests: 100"
info "  Successful: $success_count"
info "  Failed: $fail_count"
info "  Success rate: $success_rate%"
info "  Average response time: ${avg_time}ms"

if [ "$success_rate" -ge 99 ]; then
    pass "Load test: $success_rate% success rate"
elif [ "$success_rate" -ge 95 ]; then
    warn "Load test: $success_rate% success rate"
else
    fail "Load test: $success_rate% success rate"
fi

if [ "$avg_time" -lt 100 ]; then
    pass "Load test avg response: ${avg_time}ms (excellent)"
elif [ "$avg_time" -lt 300 ]; then
    pass "Load test avg response: ${avg_time}ms (good)"
else
    warn "Load test avg response: ${avg_time}ms (needs optimization)"
fi

section "7. DATA VALIDATION TESTS"

info "Validating pricing data consistency..."

# Check flavor pricing logic
flavors_json=$(curl -s "$API_URL/flavors" 2>/dev/null)
invalid_pricing=0

# Simple validation using grep and basic parsing
echo "$flavors_json" | grep -o '"vcpus":[0-9]*' | while read line; do
    vcpus=$(echo "$line" | cut -d: -f2)
    if [ "$vcpus" -lt 1 ] || [ "$vcpus" -gt 128 ]; then
        ((invalid_pricing++))
    fi
done

if [ "$invalid_pricing" -eq 0 ]; then
    pass "Flavor vCPU values are valid (1-128 range)"
else
    fail "Found $invalid_pricing invalid vCPU values"
fi

# Check RAM values
ram_valid=true
if echo "$flavors_json" | grep -qE '"ram_gb":[0-9]+\.[0-9]+' || echo "$flavors_json" | grep -qE '"ram_gb":[0-9]+'; then
    pass "Flavor RAM values present and numeric"
else
    fail "Flavor RAM values missing or invalid"
fi

# Check price values are positive
if echo "$flavors_json" | grep -qE '"price_hourly":0\.[0-9]+'; then
    pass "Flavor prices are positive decimals"
else
    warn "Price format may need review"
fi

section "TEST SUMMARY"

total=$((PASSED + FAILED))
log ""
log "  ${GREEN}Passed:${NC}   $PASSED"
log "  ${RED}Failed:${NC}   $FAILED"
log "  ${YELLOW}Warnings:${NC} $WARNINGS"
log "  Total:    $total"
log ""

if [ "$FAILED" -eq 0 ]; then
    log "${GREEN}✓ All tests passed!${NC}"
    exit_code=0
else
    log "${RED}✗ Some tests failed${NC}"
    exit_code=1
fi

log ""
log "Full report saved to: $REPORT_FILE"
exit $exit_code
