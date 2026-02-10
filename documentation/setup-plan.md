# Hotel Management System - Setup Plan

## Project Structure Setup

```
hotel-node-ts/
├── backend/
├── frontend/
├── tests/
├── documentation/
└── package.json (root workspace)
```

---

## Backend Setup

### 1. Initialize Backend
```bash
cd backend
npm init -y
```

### 2. Core Dependencies
```bash
npm install express mongoose dotenv cors bcryptjs jsonwebtoken
```

### 3. TypeScript & Dev Dependencies
```bash
npm install -D typescript @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/cors ts-node nodemon
```

### 4. Validation & Utilities
```bash
npm install express-validator
npm install helmet express-rate-limit morgan
```

### 5. Testing (Jest)
```bash
npm install -D jest @types/jest ts-jest supertest @types/supertest
```

### 6. Configuration Files
- `tsconfig.json`
- `nodemon.json`
- `jest.config.js`
- `.env.example`

---

## Frontend Setup

### 1. Create React App with Vite
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

### 2. Core Dependencies
```bash
npm install react-router-dom axios
```

### 3. UI Framework (Choose One)
```bash
# Option A: Material-UI
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled

# Option B: Custom CSS (no installation needed)
```

### 4. State & Forms
```bash
npm install react-hook-form
```

### 5. Dev Dependencies
```bash
npm install -D @types/react-router-dom
```

---

## E2E Testing Setup (Playwright)

### 1. Initialize Playwright
```bash
cd tests
npm init -y
npm install -D @playwright/test
npx playwright install
```

### 2. Configuration
- `playwright.config.ts`

---

## Root Workspace Setup

### 1. Initialize Root Package
```bash
# In root directory
npm init -y
```

### 2. Setup Workspace Scripts
Edit root `package.json`:
```json
{
  "scripts": {
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "test:unit": "cd backend && npm test",
    "test:e2e": "cd tests && npx playwright test",
    "install:all": "npm install && cd backend && npm install && cd ../frontend && npm install && cd ../tests && npm install"
  }
}
```

---

## Database Setup

### MongoDB Atlas (Free Tier)
1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create new cluster (free M0)
3. Setup database user
4. Whitelist IP (0.0.0.0/0 for development)
5. Get connection string
6. Add to `backend/.env`

### Local MongoDB (Alternative)
```bash
# Windows: Download and install from mongodb.com
# macOS: brew install mongodb-community
# Linux: sudo apt-get install mongodb
```

---

## Environment Variables

### Backend `.env`
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=30d
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
```

---

## Quick Start Commands

### 1. Install Everything
```bash
npm run install:all
```

### 2. Start Development
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

### 3. Run Tests
```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e
```

---

## Complete Installation Checklist

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] MongoDB Atlas account OR local MongoDB

### Setup Steps
- [ ] Clone/initialize repository
- [ ] Create folder structure (backend, frontend, tests, documentation)
- [ ] Setup backend (dependencies + config)
- [ ] Setup frontend (Vite + dependencies)
- [ ] Setup Playwright tests
- [ ] Configure MongoDB connection
- [ ] Create `.env` files
- [ ] Setup root workspace scripts
- [ ] Test backend server starts
- [ ] Test frontend dev server starts
- [ ] Run initial test suite

### Estimated Time
- **Setup**: 30-45 minutes
- **Configuration**: 15-30 minutes
- **Total**: ~1 hour

---

## Next Steps After Setup

1. Create basic Express server (`backend/src/server.ts`)
2. Setup MongoDB connection (`backend/src/config/database.ts`)
3. Create first model (`backend/src/models/User.ts`)
4. Create first route (`backend/src/routes/auth.routes.ts`)
5. Setup React Router in frontend
6. Create auth context
7. Build login page
8. Connect frontend to backend

---

## Useful Commands Reference

```bash
# Backend
cd backend
npm run dev          # Start dev server with nodemon
npm test            # Run Jest tests
npm run build       # Compile TypeScript

# Frontend
cd frontend
npm run dev         # Start Vite dev server
npm run build       # Build for production
npm run preview     # Preview production build

# Tests
cd tests
npx playwright test              # Run all tests
npx playwright test --ui         # Run with UI
npx playwright test --headed     # Run in headed mode
npx playwright codegen           # Generate tests
```
