#!/bin/bash

# =============================================================================
# GitHub Repository Sync Script
# =============================================================================
# Purpose: Automatically sync repository changes across multiple machines
# Repository: https://github.com/nmang004/SEOAuditer.git
# Main Branch: main
# 
# Features:
# - Handles uncommitted changes safely
# - Network error recovery
# - Merge conflict detection
# - Comprehensive logging
# - Works from any directory
# - Cron job compatible
# =============================================================================

# Configuration
REPO_URL="https://github.com/nmang004/SEOAuditer.git"
REPO_NAME="seodirector"
MAIN_BRANCH="main"
DEFAULT_REPO_PATH="$HOME/Documents/Coding/$REPO_NAME"

# Logging setup
LOG_DIR="$HOME/.repo-sync-logs"
LOG_FILE="$LOG_DIR/sync-$(date +%Y%m%d).log"
VERBOSE=false

# Colors for output (only when running interactively)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    PURPLE='\033[0;35m'
    CYAN='\033[0;36m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    PURPLE=''
    CYAN=''
    NC=''
fi

# =============================================================================
# Utility Functions
# =============================================================================

# Initialize logging directory
init_logging() {
    mkdir -p "$LOG_DIR"
    if [ ! -f "$LOG_FILE" ]; then
        touch "$LOG_FILE"
    fi
}

# Logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    case "$level" in
        "ERROR")
            echo -e "${RED}❌ ERROR: $message${NC}" >&2
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  WARN: $message${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}✅ SUCCESS: $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  INFO: $message${NC}"
            ;;
        "DEBUG")
            if [ "$VERBOSE" = true ]; then
                echo -e "${PURPLE}🔍 DEBUG: $message${NC}"
            fi
            ;;
        *)
            echo -e "${CYAN}📝 $message${NC}"
            ;;
    esac
}

# Check if we're in a git repository
is_git_repo() {
    git rev-parse --git-dir > /dev/null 2>&1
}

# Check if we're in the correct repository
is_correct_repo() {
    if ! is_git_repo; then
        return 1
    fi
    
    local current_remote=$(git remote get-url origin 2>/dev/null)
    if [[ "$current_remote" == *"SEOAuditer"* ]] || [[ "$current_remote" == *"seodirector"* ]]; then
        return 0
    fi
    return 1
}

# Check network connectivity
check_connectivity() {
    log "DEBUG" "Checking network connectivity to GitHub"
    if ! gh auth status > /dev/null 2>&1; then
        log "ERROR" "GitHub CLI not authenticated. Run: gh auth login"
        return 1
    fi
    
    if ! ping -c 1 github.com > /dev/null 2>&1; then
        log "ERROR" "Cannot reach GitHub. Check your internet connection."
        return 1
    fi
    
    log "DEBUG" "Network connectivity confirmed"
    return 0
}

# Check for uncommitted changes
check_uncommitted_changes() {
    if ! git diff --quiet || ! git diff --cached --quiet; then
        return 0  # Has uncommitted changes
    fi
    return 1  # No uncommitted changes
}

# Handle uncommitted changes
handle_uncommitted_changes() {
    local action="$1"
    
    case "$action" in
        "stash")
            log "INFO" "Stashing uncommitted changes"
            if git stash push -m "Auto-stash before sync $(date)"; then
                log "SUCCESS" "Changes stashed successfully"
                return 0
            else
                log "ERROR" "Failed to stash changes"
                return 1
            fi
            ;;
        "commit")
            log "INFO" "Committing uncommitted changes"
            git add .
            if git commit -m "Auto-commit before sync $(date)"; then
                log "SUCCESS" "Changes committed successfully"
                return 0
            else
                log "ERROR" "Failed to commit changes"
                return 1
            fi
            ;;
        "abort")
            log "ERROR" "Sync aborted due to uncommitted changes"
            log "INFO" "Use --stash or --commit to handle uncommitted changes"
            return 1
            ;;
        *)
            log "ERROR" "Unknown action for uncommitted changes: $action"
            return 1
            ;;
    esac
}

# Navigate to repository directory
navigate_to_repo() {
    local target_path="$1"
    
    if [ -z "$target_path" ]; then
        target_path="$DEFAULT_REPO_PATH"
    fi
    
    # If we're already in the correct repo, stay here
    if is_correct_repo; then
        log "INFO" "Already in repository directory: $(pwd)"
        return 0
    fi
    
    # Try to navigate to the specified path
    if [ -d "$target_path" ]; then
        cd "$target_path"
        if is_correct_repo; then
            log "INFO" "Navigated to repository: $target_path"
            return 0
        else
            log "WARN" "Directory exists but is not the correct repository: $target_path"
        fi
    fi
    
    # Try to find the repository
    log "INFO" "Searching for repository..."
    local possible_paths=(
        "$HOME/Documents/Coding/seodirector"
        "$HOME/seodirector"
        "$HOME/Desktop/seodirector"
        "$HOME/Projects/seodirector"
        "$PWD/seodirector"
    )
    
    for path in "${possible_paths[@]}"; do
        if [ -d "$path" ]; then
            cd "$path"
            if is_correct_repo; then
                log "SUCCESS" "Found repository at: $path"
                return 0
            fi
        fi
    done
    
    log "ERROR" "Repository not found. Clone it first with: gh repo clone nmang004/SEOAuditer $DEFAULT_REPO_PATH"
    return 1
}

# Clone repository if it doesn't exist
clone_repository() {
    local target_path="$DEFAULT_REPO_PATH"
    
    log "INFO" "Cloning repository to: $target_path"
    
    # Create parent directory if it doesn't exist
    mkdir -p "$(dirname "$target_path")"
    
    if gh repo clone nmang004/SEOAuditer "$target_path"; then
        log "SUCCESS" "Repository cloned successfully"
        cd "$target_path"
        return 0
    else
        log "ERROR" "Failed to clone repository"
        return 1
    fi
}

# Perform the actual sync
sync_repository() {
    local force_pull="$1"
    
    log "INFO" "Starting repository sync"
    
    # Fetch latest changes
    log "DEBUG" "Fetching latest changes from remote"
    if ! git fetch origin; then
        log "ERROR" "Failed to fetch from remote"
        return 1
    fi
    
    # Check if we're behind
    local behind=$(git rev-list --count HEAD..origin/$MAIN_BRANCH 2>/dev/null || echo "0")
    local ahead=$(git rev-list --count origin/$MAIN_BRANCH..HEAD 2>/dev/null || echo "0")
    
    log "INFO" "Local branch is $ahead commits ahead, $behind commits behind remote"
    
    if [ "$behind" -eq 0 ]; then
        log "SUCCESS" "Repository is already up to date"
        return 0
    fi
    
    # Switch to main branch if not already there
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "$MAIN_BRANCH" ]; then
        log "INFO" "Switching to $MAIN_BRANCH branch"
        if ! git checkout "$MAIN_BRANCH"; then
            log "ERROR" "Failed to switch to $MAIN_BRANCH branch"
            return 1
        fi
    fi
    
    # Pull changes
    log "INFO" "Pulling latest changes"
    if git pull origin "$MAIN_BRANCH"; then
        log "SUCCESS" "Successfully pulled $behind commits from remote"
        
        # Show recent commits
        log "INFO" "Recent commits:"
        git log --oneline -5 >> "$LOG_FILE"
        
        return 0
    else
        # Check if it's a merge conflict
        if git status | grep -q "merge conflict"; then
            log "ERROR" "Merge conflict detected"
            log "INFO" "Resolve conflicts manually and run: git add . && git commit"
            return 2
        else
            log "ERROR" "Failed to pull changes"
            return 1
        fi
    fi
}

# Cleanup function
cleanup() {
    local exit_code="$1"
    
    if [ "$exit_code" -eq 0 ]; then
        log "SUCCESS" "Repository sync completed successfully"
    else
        log "ERROR" "Repository sync failed with exit code: $exit_code"
    fi
    
    # Clean up old log files (keep last 7 days)
    if [ -d "$LOG_DIR" ]; then
        find "$LOG_DIR" -name "sync-*.log" -mtime +7 -delete 2>/dev/null
    fi
}

# =============================================================================
# Main Functions
# =============================================================================

show_help() {
    cat << EOF
GitHub Repository Sync Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -h, --help              Show this help message
    -v, --verbose           Enable verbose output
    -p, --path PATH         Specify repository path
    -s, --stash             Stash uncommitted changes before sync
    -c, --commit            Commit uncommitted changes before sync
    -f, --force             Force pull even with uncommitted changes
    --clone                 Clone repository if not found
    --status                Show sync status and recent activity

EXAMPLES:
    $0                      # Basic sync
    $0 --stash              # Stash changes and sync
    $0 --path ~/my-repo     # Sync specific path
    $0 --verbose            # Verbose output
    $0 --status             # Show status only

LOGS:
    Logs are stored in: $LOG_DIR/
    Current log file: $LOG_FILE

EOF
}

show_status() {
    if ! navigate_to_repo "$REPO_PATH"; then
        log "ERROR" "Cannot show status - repository not found"
        return 1
    fi
    
    log "INFO" "Repository Status Report"
    echo
    echo "📍 Repository Location: $(pwd)"
    echo "🌿 Current Branch: $(git branch --show-current)"
    echo "📊 Repository Status:"
    git status --porcelain | head -10
    echo
    echo "📝 Recent Commits (last 5):"
    git log --oneline -5
    echo
    echo "🔄 Remote Status:"
    git fetch origin 2>/dev/null
    local behind=$(git rev-list --count HEAD..origin/$MAIN_BRANCH 2>/dev/null || echo "0")
    local ahead=$(git rev-list --count origin/$MAIN_BRANCH..HEAD 2>/dev/null || echo "0")
    echo "   Ahead: $ahead commits"
    echo "   Behind: $behind commits"
    echo
    echo "📋 Recent Sync Activity:"
    if [ -f "$LOG_FILE" ]; then
        tail -10 "$LOG_FILE"
    else
        echo "   No recent activity logged"
    fi
}

main() {
    # Initialize
    init_logging
    
    # Parse command line arguments
    local uncommitted_action="abort"
    local force_pull=false
    local should_clone=false
    local show_status_only=false
    local REPO_PATH=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -p|--path)
                REPO_PATH="$2"
                shift 2
                ;;
            -s|--stash)
                uncommitted_action="stash"
                shift
                ;;
            -c|--commit)
                uncommitted_action="commit"
                shift
                ;;
            -f|--force)
                force_pull=true
                uncommitted_action="stash"
                shift
                ;;
            --clone)
                should_clone=true
                shift
                ;;
            --status)
                show_status_only=true
                shift
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log "INFO" "=== GitHub Repository Sync Started ==="
    log "INFO" "Timestamp: $(date)"
    log "INFO" "Machine: $(hostname)"
    log "INFO" "User: $(whoami)"
    
    # Show status only if requested
    if [ "$show_status_only" = true ]; then
        show_status
        exit 0
    fi
    
    # Check connectivity
    if ! check_connectivity; then
        cleanup 1
        exit 1
    fi
    
    # Navigate to repository or clone if needed
    if ! navigate_to_repo "$REPO_PATH"; then
        if [ "$should_clone" = true ]; then
            if ! clone_repository; then
                cleanup 1
                exit 1
            fi
        else
            log "ERROR" "Use --clone to clone the repository automatically"
            cleanup 1
            exit 1
        fi
    fi
    
    # Handle uncommitted changes
    if check_uncommitted_changes; then
        log "WARN" "Uncommitted changes detected"
        if ! handle_uncommitted_changes "$uncommitted_action"; then
            cleanup 1
            exit 1
        fi
    fi
    
    # Perform sync
    if sync_repository "$force_pull"; then
        cleanup 0
        exit 0
    else
        local sync_exit_code=$?
        cleanup $sync_exit_code
        exit $sync_exit_code
    fi
}

# =============================================================================
# Script Execution
# =============================================================================

# Trap for cleanup on script exit
trap 'cleanup $?' EXIT

# Run main function with all arguments
main "$@"