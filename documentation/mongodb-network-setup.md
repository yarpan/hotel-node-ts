# MongoDB Local Network Setup Guide

This guide explains how to install and configure MongoDB on a separate PC in your local network, allowing your backend server to connect to it remotely.

---

## Overview

**Scenario**: You want to run MongoDB on **PC-A** and connect to it from your backend server running on **PC-B** within the same local network.

```
┌─────────────────┐         Local Network        ┌─────────────────┐
│     PC-A        │◄────────────────────────────►│     PC-B        │
│  (MongoDB)      │      192.168.1.100           │  (Backend)      │
│  Port: 27017    │      192.168.1.150           │                 │
└─────────────────┘                              └─────────────────┘
```

---

## Part 1: Installing MongoDB on PC-A (Database Server)

### Step 1.1: Download MongoDB Community Edition

**For Windows:**
1. Visit [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Select:
   - **Version**: Latest (e.g., 7.0.x)
   - **Platform**: Windows
   - **Package**: MSI
3. Download the installer

**For Linux (Ubuntu/Debian):**
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org
```

**For macOS:**
```bash
# Install via Homebrew
brew tap mongodb/brew
brew install mongodb-community@7.0
```

---

### Step 1.2: Install MongoDB

**Windows:**
1. Run the downloaded MSI installer
2. Choose "Complete" installation
3. **Important**: During installation, select:
   - ✅ Install MongoDB as a Service
   - ✅ Run service as Network Service user
4. Uncheck "Install MongoDB Compass" (optional GUI, not needed for network setup)
5. Complete installation

**Linux:**
- MongoDB is installed via the commands above
- Default installation path: `/var/lib/mongodb`
- Config file: `/etc/mongod.conf`

---

### Step 1.3: Configure MongoDB for Network Access

By default, MongoDB only accepts connections from localhost. You need to configure it to accept connections from your local network.

#### Windows Configuration

**File**: `C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg`

1. Open the file as Administrator (use Notepad or any text editor)
2. Find the `net:` section:

```yaml
# network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1  # Change this line
```

3. Replace `127.0.0.1` with `0.0.0.0` to accept connections from any IP:

```yaml
# network interfaces
net:
  port: 27017
  bindIp: 0.0.0.0  # Now accepts connections from any network interface
```

**Alternative (More Secure)**: Specify exact IP addresses:
```yaml
net:
  port: 27017
  bindIp: 127.0.0.1,192.168.1.100  # localhost + your PC-A IP
```

4. **Enable Authentication** (Recommended for security):

Add this section to the config file:
```yaml
security:
  authorization: enabled
```

#### Linux Configuration

**File**: `/etc/mongod.conf`

```bash
# Edit the configuration file
sudo nano /etc/mongod.conf
```

Change:
```yaml
net:
  port: 27017
  bindIp: 127.0.0.1
```

To:
```yaml
net:
  port: 27017
  bindIp: 0.0.0.0
```

---

### Step 1.4: Configure Windows Firewall (Windows Only)

MongoDB uses port **27017** by default. You need to allow this port through Windows Firewall.

**Method 1: Using Windows Firewall GUI**
1. Open "Windows Defender Firewall with Advanced Security"
2. Click "Inbound Rules" → "New Rule"
3. Select "Port" → Next
4. Select "TCP" → Specific local ports: `27017` → Next
5. Select "Allow the connection" → Next
6. Select all profiles (Domain, Private, Public) → Next
7. Name: `MongoDB Port 27017` → Finish

**Method 2: Using PowerShell (Run as Administrator)**
```powershell
New-NetFirewallRule -DisplayName "MongoDB Port 27017" -Direction Inbound -Protocol TCP -LocalPort 27017 -Action Allow
```

**For Linux (UFW):**
```bash
sudo ufw allow 27017/tcp
sudo ufw reload
```

---

### Step 1.5: Restart MongoDB Service

**Windows:**
```powershell
# Open PowerShell as Administrator
net stop MongoDB
net start MongoDB
```

Or via Services:
1. Press `Win + R` → type `services.msc`
2. Find "MongoDB Server"
3. Right-click → Restart

**Linux:**
```bash
sudo systemctl restart mongod
sudo systemctl status mongod  # Check status
```

---

### Step 1.6: Find PC-A's IP Address

You need to know the IP address of the PC running MongoDB.

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (e.g., `192.168.1.100`)

**Linux/macOS:**
```bash
ip addr show  # Linux
ifconfig      # macOS
```

**Example output**: `192.168.1.100`

---

## Part 2: Create Database User (Optional but Recommended)

If you enabled authentication, you need to create a user for your backend to connect.

### Step 2.1: Connect to MongoDB Locally

**Windows:**
```powershell
cd "C:\Program Files\MongoDB\Server\7.0\bin"
.\mongosh.exe
```

**Linux/macOS:**
```bash
mongosh
```

---

### Step 2.2: Create Admin User

```javascript
// Switch to admin database
use admin

// Create admin user
db.createUser({
  user: "admin",
  pwd: "secure-admin-password",
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }]
})

// Exit
exit
```

---

### Step 2.3: Create Database and Application User

```javascript
// Reconnect with authentication
mongosh -u admin -p secure-admin-password --authenticationDatabase admin

// Switch to your hotel database
use hotel-db

// Create application user
db.createUser({
  user: "hotel-app",
  pwd: "hotel-app-password-123",
  roles: [
    { role: "readWrite", db: "hotel-db" }
  ]
})

// Verify user was created
db.getUsers()
```

---

## Part 3: Testing Connection from PC-A

Before trying from PC-B, verify MongoDB is accessible locally.

```bash
# Test local connection (on PC-A)
mongosh "mongodb://localhost:27017"

# Or with authentication
mongosh "mongodb://hotel-app:hotel-app-password-123@localhost:27017/hotel-db"
```

**Expected output**: You should see the MongoDB shell prompt.

---

## Part 4: Configure Backend on PC-B

### Step 4.1: Find Network Connection String

The connection string format depends on whether you enabled authentication:

**Without Authentication:**
```
mongodb://192.168.1.100:27017/hotel-db
```

**With Authentication:**
```
mongodb://hotel-app:hotel-app-password-123@192.168.1.100:27017/hotel-db?authSource=hotel-db
```

> Replace `192.168.1.100` with the actual IP address of PC-A

---

### Step 4.2: Update Backend .env File

**File**: `d:\OneDrive\CODE\JAVASCRIPT\node-hotel-ts\backend\.env`

```env
# Database - Remote MongoDB on PC-A
MONGODB_URI=mongodb://hotel-app:hotel-app-password-123@192.168.1.100:27017/hotel-db?authSource=hotel-db

# Other settings
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=development
```

---

### Step 4.3: Test Connection from PC-B

**Method 1: Using mongosh (if installed on PC-B)**
```bash
mongosh "mongodb://192.168.1.100:27017/hotel-db"
```

**Method 2: Using Node.js Script**

Create a test file:
```javascript
// test-connection.js
const mongoose = require('mongoose');

const uri = 'mongodb://hotel-app:hotel-app-password-123@192.168.1.100:27017/hotel-db?authSource=hotel-db';

mongoose.connect(uri)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB on PC-A!');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
  });
```

Run:
```bash
node test-connection.js
```

**Method 3: Start Your Backend**
```bash
cd backend
npm run dev
```

Check the console for:
```
✅ MongoDB connected successfully
```

---

## Part 5: Troubleshooting

### Problem 1: "Connection Refused" Error

**Causes:**
- MongoDB service not running on PC-A
- Firewall blocking port 27017
- Wrong IP address

**Solutions:**
```bash
# On PC-A: Check if MongoDB is running
# Windows
net start MongoDB

# Linux
sudo systemctl status mongod

# Verify MongoDB is listening on correct port
netstat -an | findstr 27017  # Windows
netstat -an | grep 27017     # Linux
```

---

### Problem 2: "Authentication Failed"

**Causes:**
- Wrong username/password
- User doesn't exist in specified database

**Solutions:**
```javascript
// On PC-A MongoDB shell
use hotel-db
db.getUsers()  // Verify user exists

// Re-create user if needed
db.createUser({
  user: "hotel-app",
  pwd: "hotel-app-password-123",
  roles: [{ role: "readWrite", db: "hotel-db" }]
})
```

---

### Problem 3: "Timeout" or "Network Error"

**Causes:**
- PCs not on same network
- Firewall blocking connection
- Wrong IP address

**Solutions:**
```bash
# On PC-B: Test if PC-A is reachable
ping 192.168.1.100

# On PC-B: Test if port 27017 is open
# Windows (PowerShell)
Test-NetConnection -ComputerName 192.168.1.100 -Port 27017

# Linux/macOS
telnet 192.168.1.100 27017
# or
nc -zv 192.168.1.100 27017
```

If ping works but port test fails → Firewall is blocking the port

---

### Problem 4: MongoDB Binds Only to Localhost

**Symptom**: Can connect locally but not from PC-B

**Solution**: Verify `mongod.cfg`/`mongod.conf` has:
```yaml
net:
  bindIp: 0.0.0.0  # NOT 127.0.0.1
```

Then restart MongoDB service.

---

## Part 6: Security Best Practices

### 6.1 Use Authentication
Always enable authentication in production or network environments:
```yaml
security:
  authorization: enabled
```

### 6.2 Use Strong Passwords
Generate strong passwords for database users:
```bash
# Example strong password
hotel-app-2024!SecureP@ssw0rd#Random789
```

### 6.3 Restrict Network Access
Instead of `0.0.0.0`, specify only the IPs that need access:
```yaml
net:
  bindIp: 127.0.0.1,192.168.1.150  # localhost + PC-B IP
```

### 6.4 Use TLS/SSL (Advanced)
For production, enable TLS encryption between backend and MongoDB.

### 6.5 Keep MongoDB Updated
Regularly update MongoDB to get security patches.

---

## Connection String Reference

### Format
```
mongodb://[username:password@]host[:port][/database][?options]
```

### Examples

**Local connection (localhost):**
```
mongodb://localhost:27017/hotel-db
```

**Network connection without auth:**
```
mongodb://192.168.1.100:27017/hotel-db
```

**Network connection with auth:**
```
mongodb://hotel-app:password123@192.168.1.100:27017/hotel-db?authSource=hotel-db
```

**Multiple hosts (replica set):**
```
mongodb://host1:27017,host2:27017,host3:27017/hotel-db?replicaSet=rs0
```

### Common Options
- `authSource=admin` - Database to authenticate against
- `retryWrites=true` - Automatically retry write operations
- `w=majority` - Write concern (wait for majority acknowledgment)

---

## Quick Setup Summary

### On PC-A (MongoDB Server):
1. ✅ Install MongoDB Community Edition
2. ✅ Edit `mongod.cfg` → set `bindIp: 0.0.0.0`
3. ✅ Enable authentication (optional but recommended)
4. ✅ Allow port 27017 in firewall
5. ✅ Restart MongoDB service
6. ✅ Create database user
7. ✅ Get PC-A IP address (e.g., `192.168.1.100`)

### On PC-B (Backend Server):
1. ✅ Update `.env` with MongoDB connection string
2. ✅ Test connection
3. ✅ Start backend server

---

## Next Steps

After MongoDB is set up on the network:
1. ✅ Proceed with backend testing (see `implementation_plan.md`)
2. ✅ Run integration tests
3. ✅ Verify all API endpoints work correctly

---

## Additional Resources

- [MongoDB Installation Guide](https://www.mongodb.com/docs/manual/installation/)
- [MongoDB Network Configuration](https://www.mongodb.com/docs/manual/core/security-mongodb-configuration/)
- [MongoDB Connection String URI Format](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
