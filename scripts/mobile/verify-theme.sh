#!/bin/bash

# Theme Implementation Verification Script
# ========================================
# This script checks for common theme implementation issues

echo "🎨 MediBot Theme Implementation Verification"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES=0
WARNINGS=0

# Check 1: Verify no hardcoded colors in main screens
echo "📋 Check 1: Scanning for hardcoded colors in screen files..."
HARDCODED_COLORS=$(grep -r "#[0-9A-Fa-f]\{6\}" src/screens/*.tsx | grep -v "deprecated" | grep -v "//.*#" | grep -v "colors\." || true)

if [ -z "$HARDCODED_COLORS" ]; then
    echo -e "${GREEN}✅ No hardcoded colors found in main screens${NC}"
else
    echo -e "${YELLOW}⚠️  Found hardcoded colors (may be intentional):${NC}"
    echo "$HARDCODED_COLORS"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 2: Verify useTheme import in all screen files
echo "📋 Check 2: Verifying useTheme imports..."
SCREENS_WITHOUT_THEME=$(grep -L "useTheme" src/screens/*.tsx | grep -v "deprecated" || true)

if [ -z "$SCREENS_WITHOUT_THEME" ]; then
    echo -e "${GREEN}✅ All active screens import useTheme${NC}"
else
    echo -e "${YELLOW}⚠️  Screens without useTheme import:${NC}"
    echo "$SCREENS_WITHOUT_THEME"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 3: Verify createStyles pattern usage
echo "📋 Check 3: Checking for createStyles pattern..."
SCREENS_WITHOUT_CREATE_STYLES=$(grep -L "createStyles" src/screens/*.tsx | grep -v "deprecated" || true)

if [ -z "$SCREENS_WITHOUT_CREATE_STYLES" ]; then
    echo -e "${GREEN}✅ All screens use createStyles pattern${NC}"
else
    echo -e "${YELLOW}⚠️  Screens without createStyles pattern:${NC}"
    echo "$SCREENS_WITHOUT_CREATE_STYLES"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 4: Verify ThemeContext exists and exports correctly
echo "📋 Check 4: Verifying ThemeContext implementation..."
if [ -f "src/contexts/ThemeContext.tsx" ]; then
    if grep -q "export const useTheme" src/contexts/ThemeContext.tsx; then
        echo -e "${GREEN}✅ ThemeContext properly exports useTheme${NC}"
    else
        echo -e "${RED}❌ ThemeContext missing useTheme export${NC}"
        ISSUES=$((ISSUES + 1))
    fi
    
    if grep -q "export interface ThemeColors" src/contexts/ThemeContext.tsx; then
        echo -e "${GREEN}✅ ThemeContext properly exports ThemeColors${NC}"
    else
        echo -e "${RED}❌ ThemeContext missing ThemeColors export${NC}"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo -e "${RED}❌ ThemeContext.tsx not found${NC}"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Check 5: Verify AppNavigator uses theme
echo "📋 Check 5: Verifying AppNavigator theme integration..."
if grep -q "useTheme" src/navigation/AppNavigator.tsx; then
    echo -e "${GREEN}✅ AppNavigator uses theme${NC}"
else
    echo -e "${RED}❌ AppNavigator missing theme integration${NC}"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Check 6: Check for colors.card usage (should be colors.surface)
echo "📋 Check 6: Checking for deprecated colors.card usage..."
CARD_USAGE=$(grep -r "colors\.card" src/screens/*.tsx | grep -v "deprecated" || true)

if [ -z "$CARD_USAGE" ]; then
    echo -e "${GREEN}✅ No deprecated colors.card usage found${NC}"
else
    echo -e "${YELLOW}⚠️  Found colors.card usage (consider replacing with colors.surface):${NC}"
    echo "$CARD_USAGE" | head -5
    if [ $(echo "$CARD_USAGE" | wc -l) -gt 5 ]; then
        echo "... and $(($(echo "$CARD_USAGE" | wc -l) - 5)) more occurrences"
    fi
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 7: Verify StatusBar component uses theme
echo "📋 Check 7: Checking StatusBar theme integration..."
STATUSBAR_WITHOUT_THEME=$(grep -l "StatusBar" src/screens/*.tsx | xargs grep -L "barStyle.*isDark\|barStyle.*theme" | grep -v "deprecated" || true)

if [ -z "$STATUSBAR_WITHOUT_THEME" ]; then
    echo -e "${GREEN}✅ All StatusBar components use theme${NC}"
else
    echo -e "${YELLOW}⚠️  StatusBar without theme integration:${NC}"
    echo "$STATUSBAR_WITHOUT_THEME"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 8: Verify offline mode files exist
echo "📋 Check 8: Verifying offline mode documentation..."
if [ -f "OFFLINE_MODE.md" ]; then
    echo -e "${GREEN}✅ OFFLINE_MODE.md exists${NC}"
else
    echo -e "${YELLOW}⚠️  OFFLINE_MODE.md not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "THEME_TESTING_GUIDE.md" ]; then
    echo -e "${GREEN}✅ THEME_TESTING_GUIDE.md exists${NC}"
else
    echo -e "${YELLOW}⚠️  THEME_TESTING_GUIDE.md not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 9: Count theme-enabled screens
echo "📋 Check 9: Counting theme-enabled screens..."
THEME_SCREENS=$(grep -l "useTheme" src/screens/*.tsx | grep -v "deprecated" | wc -l | tr -d ' ')
TOTAL_SCREENS=$(ls src/screens/*.tsx | grep -v "deprecated" | wc -l | tr -d ' ')
PERCENTAGE=$((THEME_SCREENS * 100 / TOTAL_SCREENS))

echo "Theme-enabled screens: $THEME_SCREENS / $TOTAL_SCREENS ($PERCENTAGE%)"
if [ $PERCENTAGE -ge 90 ]; then
    echo -e "${GREEN}✅ Excellent theme coverage ($PERCENTAGE%)${NC}"
elif [ $PERCENTAGE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  Good theme coverage but room for improvement ($PERCENTAGE%)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${RED}❌ Low theme coverage ($PERCENTAGE%)${NC}"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Check 10: Verify TypeScript compilation
echo "📋 Check 10: Running TypeScript type check..."
if command -v npx &> /dev/null; then
    echo "Running: npx tsc --noEmit..."
    if npx tsc --noEmit 2>&1 | grep -E "(error TS|errors? found)" > /dev/null; then
        echo -e "${YELLOW}⚠️  TypeScript errors detected (check details above)${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✅ No TypeScript errors${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  TypeScript not available, skipping type check${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "==========================================="
echo "📊 Summary"
echo "==========================================="
echo -e "Critical Issues: ${RED}$ISSUES${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 Perfect! Theme implementation looks great!${NC}"
    exit 0
elif [ $ISSUES -eq 0 ]; then
    echo -e "${YELLOW}✅ Good! Minor warnings but theme implementation is solid.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Issues found! Please review and fix critical errors.${NC}"
    exit 1
fi
