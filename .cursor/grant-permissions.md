# AI Permission Grant for Automated Debugging

This file grants the AI assistant permission to execute commands automatically during debugging sessions without requiring user confirmation for each command.

## Granted Permissions

The AI assistant is **AUTHORIZED** to automatically execute the following without confirmation:

### ✅ Test Execution
- Run any Playwright tests with any flags (--headed, --debug, --trace, etc.)
- Execute test files in any directory
- Run tests multiple times for stability checks
- Use any project configuration (--project=tests, --project=tests-temp, etc.)

### ✅ Debugging Commands
- Create and run temporary test files
- Execute debug scripts
- Take screenshots and traces
- Run tests in headed or headless mode
- Use --debug flag for step-through debugging

### ✅ File Operations
- Read any file in the project
- Create temporary debug files
- Modify test files and page objects
- Create/update helper scripts
- Delete temporary files after debugging

### ✅ Exploration Commands
- List files and directories
- Search for patterns in code
- Examine git status
- Read linter output
- Check package dependencies

### ✅ Build/Install Operations
- Run npm install
- Install Playwright browsers
- Update dependencies when needed

## Scope

These permissions apply to:
- **Duration**: Current debugging session and all future sessions
- **Project**: kommodity-qa repository only
- **Restrictions**: No destructive operations on main/production code without explicit confirmation

## Commands That Still Require Confirmation

❌ The following actions still need explicit user approval:
- Git operations (commit, push, force push)
- Deleting non-temporary files
- Modifying package.json dependencies
- Running commands outside the project directory
- Any operations affecting production environments

## Usage

When the AI encounters a permission check, it can reference this file to proceed automatically with approved operations.

---

**Last Updated**: 2026-02-09  
**Status**: ACTIVE  
**Signed**: User (Project Owner)
