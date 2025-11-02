#!/bin/bash
# Documentation Cleanup Script
# Removes redundant and outdated documentation files

echo "🧹 MediBot Documentation Cleanup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Counter
DELETED=0
KEPT=0

# Function to delete file
delete_file() {
    local file="$1"
    if [ -f "$file" ]; then
        rm "$file"
        echo -e "${RED}❌ Deleted:${NC} $file"
        DELETED=$((DELETED + 1))
    fi
}

# Function to keep file
keep_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ Keeping:${NC} $file"
        KEPT=$((KEPT + 1))
    fi
}

echo "Analyzing documentation files..."
echo ""

# === ROOT LEVEL - Keep essential, delete redundant ===
echo "=== Root Level Documentation ==="

# Keep these essential files
keep_file "README.md"
keep_file "GETTING_STARTED.md"
keep_file "QUICK_START_GUIDE.md"
keep_file "FAQ.md"
keep_file "DOCUMENTATION_INDEX.md"

# Delete redundant root files (duplicates of content in new consolidated docs)
delete_file "QUICK_START.md"                    # Replaced by QUICK_START_GUIDE.md
delete_file "QUICK-START-AI.md"                 # Merged into QUICK_START_GUIDE.md
delete_file "IMPLEMENTATION_SUMMARY.md"          # Archived content
delete_file "AI-IMPLEMENTATION-SUMMARY.md"       # Archived content
delete_file "PROJECT_COMPLETE.md"                # Archived content
delete_file "EVALUATION_REPORT.md"               # Archived content
delete_file "FINAL_STATUS_REPORT.md"             # Archived content
delete_file "SYSTEM_OPERATIONAL.md"              # Merged into QUICK_START_GUIDE.md
delete_file "AI-AGENT-INTEGRATION.md"            # Merged into main docs

echo ""

# === DOCS FOLDER - Clean up old status reports ===
echo "=== docs/ Folder Cleanup ==="

# Keep current docs
keep_file "docs/README.md"

# Delete redundant docs/ root files
delete_file "docs/ANALYSIS_SUMMARY.md"
delete_file "docs/NEW_CHANGES_ANALYSIS.md"
delete_file "docs/README_OLD.md"
delete_file "docs/FEATURE_COMPARISON.md"
delete_file "docs/ALL_ERRORS_FIXED_FINAL.md"
delete_file "docs/FINAL_STATUS_CURRENT.md"
delete_file "docs/CLEANUP_REPORT.md"
delete_file "docs/VISUAL_STATUS_MAP.md"
delete_file "docs/AI_AGENT_INTEGRATION.md"
delete_file "docs/PROJECT_STATUS_OLD.md"
delete_file "docs/DEEP_ANALYSIS_FINDINGS.md"
delete_file "docs/IMPLEMENTATION_COMPLETE.md"
delete_file "docs/DOCUMENTATION_ORGANIZATION.md"
delete_file "docs/PROJECT_STATUS_CURRENT.md"
delete_file "docs/ALL_ISSUES_FIXED.md"

echo ""

# Archive folder is already organized, just note it
echo "=== Archive Folder ==="
echo -e "${YELLOW}ℹ️  Archive folder preserved:${NC} docs/archive/ (historical reference)"
echo ""

# === COMPONENT-SPECIFIC DOCS - Keep these ===
echo "=== Component Documentation ==="

keep_file "AIAgent/README.md"
keep_file "medibot-backend/README.md"
keep_file "medibot-web/README.md"
keep_file "MediBot/README.md"
keep_file "k8s/README.md"
keep_file "shared/README.md"

# Clean up redundant component docs
delete_file "medibot-web/PERFORMANCE_OPTIMIZATION.md"    # Outdated
delete_file "medibot-web/COMPLETE_MIGRATION.md"          # Completed, no longer needed
delete_file "medibot-web/PHASE1_COMPLETE.md"             # Archive
delete_file "medibot-web/PHASE2_COMPLETE.md"             # Archive
delete_file "medibot-web/docs/ERROR_FIX_SUMMARY.md"      # Archive
delete_file "medibot-web/docs/WEB_MIGRATION_COMPLETE.md" # Archive

delete_file "k8s/TASK-12-COMPLETE.md"                    # Archive

echo ""

# === SUMMARY ===
echo "=================================="
echo "Cleanup Summary"
echo "=================================="
echo -e "${GREEN}Files Kept: $KEPT${NC}"
echo -e "${RED}Files Deleted: $DELETED${NC}"
echo ""

echo "📚 New Documentation Structure:"
echo ""
echo "Root Level (Essential):"
echo "  ✅ README.md                 - Project overview"
echo "  ✅ GETTING_STARTED.md        - Complete setup guide"
echo "  ✅ QUICK_START_GUIDE.md      - 10-minute quick start"
echo "  ✅ FAQ.md                    - Common questions"
echo "  ✅ DOCUMENTATION_INDEX.md    - Navigation guide"
echo ""
echo "To Be Created:"
echo "  📝 DEVELOPMENT_GUIDE.md      - Development workflow"
echo "  📝 API_REFERENCE.md          - API documentation"
echo "  📝 TESTING_GUIDE.md          - Testing guide"
echo "  📝 DEPLOYMENT_GUIDE.md       - Deployment instructions"
echo "  📝 TROUBLESHOOTING.md        - Problem solving"
echo "  📝 ARCHITECTURE.md           - System architecture"
echo "  📝 CHANGELOG.md              - Version history"
echo ""
echo "Component-Specific:"
echo "  ✅ AIAgent/README.md"
echo "  ✅ medibot-backend/README.md"
echo "  ✅ medibot-web/README.md"
echo "  ✅ MediBot/README.md"
echo "  ✅ k8s/README.md"
echo ""
echo "Archive:"
echo "  📁 docs/archive/             - Historical documents preserved"
echo ""

if [ $DELETED -gt 0 ]; then
    echo -e "${YELLOW}⚠️  ${DELETED} files were deleted${NC}"
    echo "   These were redundant or superseded by new consolidated docs"
    echo ""
fi

echo "✅ Documentation cleanup complete!"
echo ""
echo "Next steps:"
echo "  1. Review the new documentation structure"
echo "  2. Create remaining guides (DEVELOPMENT_GUIDE.md, etc.)"
echo "  3. Update component READMEs if needed"
echo "  4. Test documentation links"
echo ""
