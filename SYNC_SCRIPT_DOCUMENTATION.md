# GitHub Repository Sync Script Documentation

## Overview

The `sync-repo.sh` script is a robust automation tool designed to synchronize your GitHub repository across multiple machines (Mac mini and MacBook Air). It provides comprehensive error handling, logging, and flexible options for managing uncommitted changes.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Command Line Options](#command-line-options)
- [Examples](#examples)
- [Automation Setup](#automation-setup)
- [Logging](#logging)
- [Error Handling](#error-handling)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

## Features

### ✅ Core Functionality
- **Automatic Repository Detection**: Finds your repository even when run from different directories
- **Smart Branch Management**: Automatically switches to main branch and pulls latest changes
- **GitHub CLI Integration**: Uses `gh` commands for enhanced authentication and functionality
- **Cross-Machine Compatibility**: Works seamlessly across Mac mini and MacBook Air

### 🛡️ Safety Features
- **Uncommitted Changes Handling**: Multiple options for safely managing local changes
- **Merge Conflict Detection**: Identifies and reports merge conflicts with guidance
- **Network Validation**: Checks connectivity and authentication before attempting operations
- **Repository Validation**: Ensures you're working with the correct repository

### 📊 Monitoring & Reporting
- **Comprehensive Logging**: Detailed logs with timestamps and machine information
- **Status Reporting**: Visual status reports showing repository state and recent activity
- **Progress Tracking**: Real-time feedback on sync operations
- **Historical Activity**: Maintains sync history for troubleshooting

## Requirements

### System Requirements
- macOS (tested on Mac mini and MacBook Air)
- Bash shell (default on macOS)
- Git installed and configured
- GitHub CLI (`gh`) installed and authenticated

### Prerequisites Setup

1. **Install GitHub CLI** (if not already installed):
   ```bash
   brew install gh
   ```

2. **Authenticate GitHub CLI**:
   ```bash
   gh auth login
   ```

3. **Verify Authentication**:
   ```bash
   gh auth status
   ```

## Installation

1. **Download the Script**:
   The script should be located at:
   ```
   /Users/nickmangubat/Documents/Coding/seodirector/sync-repo.sh
   ```

2. **Make Executable**:
   ```bash
   chmod +x sync-repo.sh
   ```

3. **Verify Installation**:
   ```bash
   ./sync-repo.sh --help
   ```

## Usage

### Basic Syntax
```bash
./sync-repo.sh [OPTIONS]
```

### Quick Start
```bash
# Basic sync (safest option)
./sync-repo.sh

# Sync with automatic stashing of uncommitted changes
./sync-repo.sh --stash

# Check repository status without syncing
./sync-repo.sh --status
```

## Command Line Options

### Help and Information
| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message and usage examples |
| `--status` | Display repository status without performing sync |
| `-v, --verbose` | Enable verbose output for debugging |

### Repository Management
| Option | Argument | Description |
|--------|----------|-------------|
| `-p, --path` | `PATH` | Specify custom repository path |
| `--clone` | - | Clone repository if not found locally |

### Uncommitted Changes Handling
| Option | Description | Behavior |
|--------|-------------|----------|
| `-s, --stash` | Stash uncommitted changes | Saves changes to git stash before sync |
| `-c, --commit` | Commit uncommitted changes | Creates auto-commit before sync |
| `-f, --force` | Force sync | Automatically stashes changes and proceeds |
| (default) | Abort on uncommitted changes | Exits safely if uncommitted changes exist |

## Examples

### Basic Operations

```bash
# Standard sync - will abort if uncommitted changes exist
./sync-repo.sh

# Safe sync - stash changes first, then sync
./sync-repo.sh --stash

# Quick status check
./sync-repo.sh --status

# Verbose sync for troubleshooting
./sync-repo.sh --verbose --stash
```

### Handling Uncommitted Changes

```bash
# Option 1: Stash changes (recommended)
./sync-repo.sh --stash

# Option 2: Auto-commit changes
./sync-repo.sh --commit

# Option 3: Force sync (auto-stashes)
./sync-repo.sh --force
```

### Advanced Usage

```bash
# Sync specific repository path
./sync-repo.sh --path ~/Documents/Projects/my-repo

# Clone repository if missing
./sync-repo.sh --clone

# Combine options for maximum automation
./sync-repo.sh --verbose --force --clone
```

## Automation Setup

### Cron Job Configuration

1. **Edit Crontab**:
   ```bash
   crontab -e
   ```

2. **Add Sync Jobs**:

   **Hourly Sync** (recommended for active development):
   ```bash
   # Sync every hour, stash uncommitted changes
   0 * * * * /Users/nickmangubat/Documents/Coding/seodirector/sync-repo.sh --stash >/dev/null 2>&1
   ```

   **Twice Daily Sync** (for less frequent updates):
   ```bash
   # Sync at 9 AM and 5 PM
   0 9,17 * * * /Users/nickmangubat/Documents/Coding/seodirector/sync-repo.sh --stash
   ```

   **Development Mode** (frequent sync during work hours):
   ```bash
   # Sync every 30 minutes from 9 AM to 6 PM, Monday to Friday
   */30 9-18 * * 1-5 /Users/nickmangubat/Documents/Coding/seodirector/sync-repo.sh --stash
   ```

3. **Verify Cron Jobs**:
   ```bash
   crontab -l
   ```

### Launchd Integration (macOS Alternative)

Create a launchd plist for more advanced scheduling:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.user.repo-sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/nickmangubat/Documents/Coding/seodirector/sync-repo.sh</string>
        <string>--stash</string>
    </array>
    <key>StartInterval</key>
    <integer>3600</integer>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

## Logging

### Log Location
- **Directory**: `~/.repo-sync-logs/`
- **Format**: `sync-YYYYMMDD.log`
- **Retention**: 7 days (automatic cleanup)

### Log Levels
| Level | Description | Example |
|-------|-------------|---------|
| `ERROR` | Critical failures | Network connectivity issues |
| `WARN` | Warnings | Uncommitted changes detected |
| `SUCCESS` | Successful operations | Repository synced successfully |
| `INFO` | General information | Starting sync process |
| `DEBUG` | Detailed debugging | Network connectivity checks |

### Log Format
```
[YYYY-MM-DD HH:MM:SS] [LEVEL] Message content
```

### Viewing Logs

```bash
# View today's log
cat ~/.repo-sync-logs/sync-$(date +%Y%m%d).log

# Monitor real-time sync
tail -f ~/.repo-sync-logs/sync-$(date +%Y%m%d).log

# View recent activity
./sync-repo.sh --status
```

## Error Handling

### Common Scenarios

#### 1. Uncommitted Changes
**Problem**: Local changes prevent sync
**Solution**: Use `--stash`, `--commit`, or `--force` options

#### 2. Merge Conflicts
**Problem**: Automatic merge fails
**Resolution**:
```bash
# Script will detect and report conflicts
# Manually resolve conflicts:
git status
git add .
git commit
./sync-repo.sh
```

#### 3. Network Issues
**Problem**: Cannot reach GitHub
**Check**:
- Internet connectivity
- GitHub CLI authentication: `gh auth status`
- GitHub service status

#### 4. Repository Not Found
**Problem**: Script cannot locate repository
**Solutions**:
- Use `--clone` to clone automatically
- Specify path with `--path`
- Verify repository location

### Error Codes
| Code | Description | Action |
|------|-------------|--------|
| 0 | Success | Operation completed successfully |
| 1 | General error | Check logs for details |
| 2 | Merge conflict | Resolve conflicts manually |

## Troubleshooting

### Debug Mode
```bash
# Enable verbose output
./sync-repo.sh --verbose

# Check authentication
gh auth status

# Verify repository status
./sync-repo.sh --status
```

### Common Issues

#### Permission Denied
```bash
# Fix script permissions
chmod +x sync-repo.sh
```

#### GitHub Authentication
```bash
# Re-authenticate
gh auth login --force
```

#### Repository Path Issues
```bash
# Find repository location
find ~ -name "seodirector" -type d 2>/dev/null

# Use absolute path
./sync-repo.sh --path /full/path/to/repository
```

#### Cron Job Not Running
```bash
# Check cron service
sudo launchctl list | grep cron

# Verify crontab
crontab -l

# Check system logs
grep CRON /var/log/system.log
```

## Advanced Usage

### Custom Configuration

You can modify script variables at the top of the file:

```bash
# Repository configuration
REPO_URL="https://github.com/nmang004/SEOAuditer.git"
REPO_NAME="seodirector"
MAIN_BRANCH="main"
DEFAULT_REPO_PATH="$HOME/Documents/Coding/$REPO_NAME"

# Logging configuration
LOG_DIR="$HOME/.repo-sync-logs"
```

### Integration with Other Tools

#### Combine with Build Scripts
```bash
# Sync and build
./sync-repo.sh --stash && npm run build
```

#### Git Hooks Integration
Add to `.git/hooks/post-merge`:
```bash
#!/bin/bash
echo "Repository updated via sync script" >> ~/.repo-sync-logs/hooks.log
```

#### IDE Integration
Add as external tool in your IDE with command:
```bash
/Users/nickmangubat/Documents/Coding/seodirector/sync-repo.sh --stash
```

### Multiple Repository Support

To adapt for multiple repositories, create repository-specific versions:

```bash
# Copy script for each repo
cp sync-repo.sh sync-repo-project1.sh

# Modify configuration variables in each copy
# Or use environment variables:
REPO_URL="https://github.com/user/project2.git" ./sync-repo.sh
```

### Performance Optimization

For large repositories:
```bash
# Use shallow clone for faster initial setup
git clone --depth 1 https://github.com/nmang004/SEOAuditer.git

# Configure git for better performance
git config core.preloadindex true
git config core.fscache true
```

## Security Considerations

### Credentials
- Uses GitHub CLI authentication (more secure than tokens)
- No credentials stored in script
- Respects system keychain integration

### File Permissions
```bash
# Secure the script
chmod 755 sync-repo.sh

# Secure log directory
chmod 750 ~/.repo-sync-logs
```

### Network Security
- All connections use HTTPS
- GitHub CLI handles authentication securely
- No sensitive data in logs

## Support and Maintenance

### Regular Maintenance
- Monitor log files for errors
- Update GitHub CLI periodically: `brew upgrade gh`
- Review and clean old log files

### Script Updates
- Keep script in version control
- Test changes in development environment
- Backup working configuration before updates

### Getting Help
1. Check script help: `./sync-repo.sh --help`
2. Review logs: `~/.repo-sync-logs/`
3. Test connectivity: `gh auth status`
4. Verify repository: `./sync-repo.sh --status`

---

## Appendix

### File Structure
```
seodirector/
├── sync-repo.sh                 # Main sync script
├── SYNC_SCRIPT_DOCUMENTATION.md # This documentation
└── logs/                        # Application logs

~/.repo-sync-logs/               # Sync logs directory
├── sync-20250606.log           # Daily log files
└── hooks.log                   # Git hooks log
```

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `HOME` | User home | Used for default paths |
| `PWD` | Current directory | Used for repository detection |

### Dependencies
- **Git**: Repository operations
- **GitHub CLI (gh)**: Authentication and enhanced features
- **Bash**: Script execution
- **Common Unix tools**: grep, find, tail, etc.

---

*Last updated: June 6, 2025*
*Script version: 1.0*