# Windows Development PC Setup Guide

Complete step-by-step guide for setting up a Windows PC for backend development with Node.js, TypeScript, and related tools.

---

## Overview

This guide will help you set up a complete development environment for the hotel management system backend on Windows.

**What you'll install:**
- ✅ Node.js & npm
- ✅ Git
- ✅ Visual Studio Code
- ✅ MongoDB (optional - can be on separate PC)
- ✅ Postman (API testing)
- ✅ Additional tools

**Estimated time**: 30-45 minutes

---

## Step 1: Install Node.js

Node.js is required to run the backend server and npm for package management.

### 1.1 Download Node.js

1. Visit [nodejs.org](https://nodejs.org/)
2. Download **LTS version** (Long Term Support)
   - Current LTS: v20.x.x or newer
   - Click the "LTS" button (recommended for most users)

### 1.2 Install Node.js

1. Run the downloaded installer (e.g., `node-v20.11.0-x64.msi`)
2. Follow installation wizard:
   - ✅ Accept license agreement
   - ✅ Choose installation location (default: `C:\Program Files\nodejs\`)
   - ✅ Select "Add to PATH" option
   - ✅ Install additional tools (chocolatey) - **Optional**, you can skip this
3. Click "Install"
4. Wait for installation to complete

### 1.3 Verify Installation

Open **PowerShell** or **Command Prompt**:

```powershell
# Check Node.js version
node --version
# Expected output: v20.11.0 (or similar)

# Check npm version
npm --version
# Expected output: 10.2.4 (or similar)
```

✅ If both commands show version numbers, Node.js is installed correctly!

---

## Step 2: Install Git

Git is used for version control and is essential for development.

### 2.1 Download Git

1. Visit [git-scm.com/download/win](https://git-scm.com/download/win)
2. Download will start automatically
3. Save the installer (e.g., `Git-2.43.0-64-bit.exe`)

### 2.2 Install Git

1. Run the installer
2. **Important settings** during installation:

   **Select Components**:
   - ✅ Windows Explorer integration
   - ✅ Git Bash Here
   - ✅ Git GUI Here
   - ✅ Associate .sh files

   **Default editor**:
   - Choose "Use Visual Studio Code as Git's default editor" (if VS Code installed)
   - Or keep default (Vim)

   **Adjust PATH environment**:
   - ✅ Select "Git from the command line and also from 3rd-party software"

   **Line ending conversions**:
   - ✅ Select "Checkout Windows-style, commit Unix-style line endings"

   **Terminal emulator**:
   - ✅ Select "Use Windows' default console window"

   **Default branch name**:
   - ✅ Select "Override the default branch name" → enter `main`

3. Click "Install"

### 2.3 Verify Installation

```powershell
git --version
# Expected output: git version 2.43.0 (or similar)
```

### 2.4 Configure Git

Set your name and email (required for commits):

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify configuration
git config --list
```

---

## Step 3: Install Visual Studio Code

VS Code is a powerful, free code editor with excellent TypeScript support.

### 3.1 Download VS Code

1. Visit [code.visualstudio.com](https://code.visualstudio.com/)
2. Click "Download for Windows"
3. Save the installer (e.g., `VSCodeUserSetup-x64-1.86.0.exe`)

### 3.2 Install VS Code

1. Run the installer
2. **Important settings**:
   - ✅ Add "Open with Code" action to Windows Explorer
   - ✅ Add "Open with Code" to directory context menu
   - ✅ Register Code as an editor for supported file types
   - ✅ Add to PATH
3. Click "Install"
4. Launch VS Code after installation

### 3.3 Install Essential Extensions

Open VS Code and install these extensions:

**Method 1: Via Extensions Panel**
1. Click Extensions icon (or press `Ctrl+Shift+X`)
2. Search and install each extension below

**Method 2: Via Command Palette**
```powershell
# Open PowerShell in VS Code (Ctrl+`)
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension mongodb.mongodb-vscode
code --install-extension christian-kohler.path-intellisense
code --install-extension streetsidesoftware.code-spell-checker
```

**Recommended Extensions:**
- **ESLint** (`dbaeumer.vscode-eslint`) - JavaScript/TypeScript linting
- **Prettier** (`esbenp.prettier-vscode`) - Code formatting
- **TypeScript Nightly** (`ms-vscode.vscode-typescript-next`) - Latest TypeScript features
- **MongoDB for VS Code** (`mongodb.mongodb-vscode`) - MongoDB integration
- **Path Intellisense** (`christian-kohler.path-intellisense`) - Autocomplete file paths
- **Code Spell Checker** (`streetsidesoftware.code-spell-checker`) - Spell checking
- **GitLens** (`eamodio.gitlens`) - Enhanced Git features
- **Thunder Client** (`rangav.vscode-thunder-client`) - API testing (alternative to Postman)

### 3.4 Configure VS Code Settings

Press `Ctrl+,` to open settings, then search for and configure:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.updateImportsOnFileMove.enabled": "always",
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000
}
```

---

## Step 4: Install MongoDB (Optional)

**Note**: If you're running MongoDB on a separate PC, skip this step and refer to `mongodb-network-setup.md` instead.

### 4.1 Download MongoDB

1. Visit [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Select:
   - **Version**: Latest 7.0.x
   - **Platform**: Windows x64
   - **Package**: MSI
3. Click "Download"

### 4.2 Install MongoDB

1. Run the installer (e.g., `mongodb-windows-x86_64-7.0.5-signed.msi`)
2. **Setup Type**: Choose "Complete"
3. **Service Configuration**:
   - ✅ Install MongoDB as a Service
   - ✅ Run service as Network Service user
   - Service Name: `MongoDB`
   - Data Directory: `C:\Program Files\MongoDB\Server\7.0\data\`
   - Log Directory: `C:\Program Files\MongoDB\Server\7.0\log\`
4. **MongoDB Compass**: Uncheck (we'll use VS Code extension or mongosh)
5. Click "Install"

### 4.3 Verify MongoDB Installation

```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# Expected output:
# Status   Name               DisplayName
# ------   ----               -----------
# Running  MongoDB            MongoDB Server
```

### 4.4 Install MongoDB Shell (mongosh)

1. Visit [mongodb.com/try/download/shell](https://www.mongodb.com/try/download/shell)
2. Download the Windows MSI installer
3. Install it
4. Verify:

```powershell
mongosh --version
# Expected output: 2.1.1 (or similar)
```

### 4.5 Test MongoDB Connection

```powershell
mongosh

# You should see:
# Current Mongosh Log ID: ...
# Connecting to: mongodb://127.0.0.1:27017
# Using MongoDB: 7.0.5
# test>
```

Type `exit` to quit mongosh.

---

## Step 5: Install Postman (API Testing Tool)

Postman is used for testing API endpoints.

### 5.1 Download Postman

1. Visit [postman.com/downloads](https://www.postman.com/downloads/)
2. Click "Download" for Windows (64-bit)
3. Save the installer

### 5.2 Install Postman

1. Run the installer
2. Postman will install automatically
3. **First Launch**:
   - You can create a free account or "Skip and go to the app"
   - Choose workspace name (e.g., "Hotel Management")

### 5.3 Alternative: Thunder Client (VS Code Extension)

If you prefer staying in VS Code:

```powershell
code --install-extension rangav.vscode-thunder-client
```

---

## Step 6: Additional Useful Tools

### 6.1 Windows Terminal (Recommended)

Modern terminal with tabs and customization.

**Install via Microsoft Store**:
1. Open Microsoft Store
2. Search "Windows Terminal"
3. Click "Install"

**Or via winget**:
```powershell
winget install Microsoft.WindowsTerminal
```

### 6.2 Nodemon (Global npm package)

Automatically restarts Node.js server when files change.

```powershell
npm install -g nodemon
```

Verify:
```powershell
nodemon --version
```

### 6.3 TypeScript (Global - Optional)

```powershell
npm install -g typescript
tsc --version
```

### 6.4 ts-node (Global - Optional)

Run TypeScript files directly without compiling.

```powershell
npm install -g ts-node
```

---

## Step 7: Set Up Your Project

### 7.1 Clone or Navigate to Project

```powershell
# Navigate to your project location
cd D:\OneDrive\CODE\JAVASCRIPT\node-hotel-ts

# Or clone from repository
git clone <your-repo-url> node-hotel-ts
cd node-hotel-ts
```

### 7.2 Install Backend Dependencies

```powershell
cd backend
npm install
```

### 7.3 Create Environment File

```powershell
# Copy example env file
copy .env.example .env

# Edit .env file with your settings
code .env
```

**Example `.env` content**:
```env
PORT=5000
NODE_ENV=development

# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/hotel-db

# Or remote MongoDB on another PC
# MONGODB_URI=mongodb://hotel-app:password@192.168.1.100:27017/hotel-db

JWT_SECRET=your-very-secure-secret-key-change-this
JWT_EXPIRES_IN=7d
```

### 7.4 Build the Project

```powershell
npm run build
```

### 7.5 Start Development Server

```powershell
npm run dev
```

**Expected output**:
```
Server running on port 5000
MongoDB connected successfully
```

---

## Step 8: Verify Setup

### 8.1 Check Development Server

1. Open browser
2. Navigate to: `http://localhost:5000`
3. You should see a response (or 404 if no root route is defined)

### 8.2 Test API Endpoint

Using PowerShell:
```powershell
# Test health check or any endpoint
Invoke-RestMethod -Uri http://localhost:5000/api/rooms -Method Get
```

Or using Postman:
1. Create new request
2. Method: GET
3. URL: `http://localhost:5000/api/rooms`
4. Send

---

## Common Issues & Solutions

### Issue 1: "npm command not found"

**Solution**: Node.js not in PATH
1. Restart your terminal/PowerShell
2. If still not working, add manually to PATH:
   - Search "Environment Variables" in Windows
   - Edit "Path" variable
   - Add: `C:\Program Files\nodejs\`

### Issue 2: PowerShell Script Execution Policy

**Error**: "cannot be loaded because running scripts is disabled"

**Solution**:
```powershell
# Run as Administrator
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue 3: Port 5000 Already in Use

**Solution**:
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or change port in .env
PORT=3000
```

### Issue 4: MongoDB Connection Failed

**Solutions**:
1. Check MongoDB service is running:
   ```powershell
   Get-Service MongoDB
   net start MongoDB
   ```
2. Verify connection string in `.env`
3. Check firewall settings (if remote MongoDB)

---

## Development Workflow

### Start Working on Backend

```powershell
# 1. Navigate to backend folder
cd D:\OneDrive\CODE\JAVASCRIPT\node-hotel-ts\backend

# 2. Start development server
npm run dev

# 3. Open in VS Code
code .
```

### Running Tests

```powershell
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm run test:coverage
```

### Git Workflow

```powershell
# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "Add user authentication"

# Push to remote
git push origin main
```

---

## Quick Reference Commands

### npm Commands
```powershell
npm install              # Install dependencies
npm run dev              # Start development server
npm run build            # Build TypeScript to JavaScript
npm start                # Start production server
npm test                 # Run tests
npm run lint             # Run ESLint
```

### Git Commands
```powershell
git status               # Check status
git add .                # Stage all changes
git commit -m "message"  # Commit with message
git push                 # Push to remote
git pull                 # Pull from remote
git branch               # List branches
git checkout -b feature  # Create new branch
```

### MongoDB Commands
```powershell
mongosh                  # Open MongoDB shell
Get-Service MongoDB      # Check service status
net start MongoDB        # Start service
net stop MongoDB         # Stop service
```

---

## Project Structure Quick View

```
node-hotel-ts/
├── backend/
│   ├── src/              # TypeScript source code
│   ├── dist/             # Compiled JavaScript (after build)
│   ├── tests/            # Test files
│   ├── .env              # Environment variables (create this)
│   ├── package.json      # Dependencies
│   └── tsconfig.json     # TypeScript config
├── frontend/             # React app (future)
├── documentation/        # Project documentation
└── README.md
```

---

## Next Steps

After setup is complete:

1. ✅ **Test the backend**: Follow `implementation_plan.md` to create tests
2. ✅ **Set up MongoDB**: If on separate PC, see `windows-mongodb-setup.md`
3. ✅ **Learn the codebase**: Review `backend-structure-walkthrough.md`
4. ✅ **Start developing**: Create new features according to `high-level-plan.md`

---

## Useful Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB Manual](https://www.mongodb.com/docs/manual/)
- [VS Code Tips](https://code.visualstudio.com/docs/getstarted/tips-and-tricks)

---

**Setup Complete!** 🎉

Your Windows development environment is ready for backend development.
