# Windows MongoDB Server Setup Guide

Step-by-step guide for setting up a dedicated Windows PC as a MongoDB database server.

---

## Overview

This guide is for setting up a Windows PC that will **only run MongoDB** as a database server for your network. This PC will not have development tools - just MongoDB.

**Use case**: You want a dedicated PC (PC-A) to run MongoDB, and your development PC (PC-B) will connect to it over the local network.

**What you'll install:**
- ✅ MongoDB Community Edition
- ✅ MongoDB Shell (mongosh)
- ✅ MongoDB Compass (optional GUI tool)

**Estimated time**: 20-30 minutes

---

## Prerequisites

- Windows 10 or Windows 11
- Administrator access
- Stable internet connection
- At least 4GB free disk space
- PC connected to local network

---

## Step 1: Download MongoDB Community Edition

### 1.1 Visit MongoDB Download Center

1. Open web browser
2. Go to: [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)

### 1.2 Select Download Options

Configure the download:
- **Version**: Select latest stable (e.g., 7.0.5)
- **Platform**: Windows
- **Package**: MSI

### 1.3 Download

1. Click "Download" button
2. Save the file (e.g., `mongodb-windows-x86_64-7.0.5-signed.msi`)
3. File size is approximately 200-300 MB
4. Wait for download to complete

---

## Step 2: Install MongoDB

### 2.1 Run the Installer

1. Navigate to Downloads folder
2. **Right-click** the MSI file → **Run as administrator**
3. Click "Yes" if User Account Control appears

### 2.2 Installation Wizard

**Welcome Screen**:
- Click "Next"

**End-User License Agreement**:
- ✅ Check "I accept the terms in the License Agreement"
- Click "Next"

**Setup Type**:
- Select **"Complete"** installation
- Click "Next"

**Service Configuration** (Important!):
This is the most important screen for network setup.

- ✅ **Install MongoDB as a Service**
  
- **Service Name**: `MongoDB`
  
- **Data Directory**: 
  ```
  C:\Program Files\MongoDB\Server\7.0\data\
  ```
  
- **Log Directory**:
  ```
  C:\Program Files\MongoDB\Server\7.0\log\
  ```
  
- ✅ **Run service as Network Service user**
  
- Click "Next"

**MongoDB Compass**:
- ❌ **Uncheck** "Install MongoDB Compass" (we'll install manually if needed)
- Click "Next"

**Ready to Install**:
- Review settings
- Click "Install"

### 2.3 Wait for Installation

- Installation takes 3-5 minutes
- Progress bar will show installation status
- Do not interrupt the process

### 2.4 Complete Installation

- Click "Finish"
- MongoDB is now installed and running as a Windows service

---

## Step 3: Verify MongoDB Installation

### 3.1 Check MongoDB Service

**Method 1: Using Services Manager**
1. Press `Win + R`
2. Type `services.msc`
3. Press Enter
4. Find **"MongoDB Server"** in the list
5. Status should be **"Running"**
6. Startup Type should be **"Automatic"**

**Method 2: Using PowerShell**
```powershell
# Open PowerShell
Get-Service MongoDB
```

**Expected output**:
```
Status   Name               DisplayName
------   ----               -----------
Running  MongoDB            MongoDB Server
```

### 3.2 Verify MongoDB is Listening

```powershell
netstat -an | findstr :27017
```

**Expected output**:
```
TCP    0.0.0.0:27017          0.0.0.0:0              LISTENING
```

This shows MongoDB is listening on port 27017.

---

## Step 4: Install MongoDB Shell (mongosh)

The MongoDB Shell allows you to interact with the database from command line.

### 4.1 Download MongoDB Shell

1. Visit: [mongodb.com/try/download/shell](https://www.mongodb.com/try/download/shell)
2. Select:
   - **Version**: Latest
   - **Platform**: Windows 64-bit (MSI)
3. Click "Download"
4. Save the installer (e.g., `mongosh-2.1.1-x64.msi`)

### 4.2 Install MongoDB Shell

1. Run the downloaded MSI file
2. Follow the installation wizard
3. Accept defaults
4. Click "Install"
5. Click "Finish"

### 4.3 Verify Installation

Open **PowerShell** or **Command Prompt**:

```powershell
mongosh --version
```

**Expected output**:
```
2.1.1
```

### 4.4 Test Connection to Local MongoDB

```powershell
mongosh
```

**Expected output**:
```
Current Mongosh Log ID: 65abc123def456789
Connecting to:          mongodb://127.0.0.1:27017/?directConnection=true
Using MongoDB:          7.0.5
Using Mongosh:          2.1.1

test>
```

Type `exit` to quit the shell.

✅ MongoDB is working correctly!

---

## Step 5: Configure MongoDB for Network Access

By default, MongoDB only accepts connections from `localhost`. To allow connections from other computers on your network, you need to change the configuration.

### 5.1 Locate Configuration File

**File location**:
```
C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg
```

### 5.2 Edit Configuration File

**Important**: You need administrator privileges!

1. **Open Notepad as Administrator**:
   - Press `Win` key
   - Type "Notepad"
   - Right-click "Notepad"
   - Click "Run as administrator"

2. **Open the config file**:
   - In Notepad: File → Open
   - Navigate to: `C:\Program Files\MongoDB\Server\7.0\bin\`
   - Change file filter to "All Files (*.*)"
   - Select `mongod.cfg`
   - Click "Open"

### 5.3 Modify Network Settings

Find the `net:` section in the file:

**Before** (default):
```yaml
# network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1
```

**After** (for network access):
```yaml
# network interfaces
net:
  port: 27017
  bindIp: 0.0.0.0
```

> `0.0.0.0` means MongoDB will accept connections from any network interface.

**Alternative (More Secure)**:
If you know the IP of your development PC (e.g., 192.168.1.150), you can specify it:
```yaml
net:
  port: 27017
  bindIp: 127.0.0.1,192.168.1.150
```

This allows connections from localhost and only from 192.168.1.150.

### 5.4 Enable Authentication (Recommended)

Add this section to the config file (at the end):

```yaml
security:
  authorization: enabled
```

This requires users to authenticate before accessing the database.

### 5.5 Save the File

- Press `Ctrl + S` to save
- Close Notepad

---

## Step 6: Configure Windows Firewall

MongoDB uses port **27017**. You must allow this port through Windows Firewall.

### 6.1 Method 1: Using PowerShell (Recommended)

**Run PowerShell as Administrator**:
1. Press `Win` key
2. Type "PowerShell"
3. Right-click "Windows PowerShell"
4. Click "Run as administrator"

**Add firewall rule**:
```powershell
New-NetFirewallRule -DisplayName "MongoDB Port 27017" -Direction Inbound -Protocol TCP -LocalPort 27017 -Action Allow
```

**Expected output**:
```
Name                  : {generated-guid}
DisplayName           : MongoDB Port 27017
Description           :
DisplayGroup          :
Group                 :
Enabled               : True
Profile               : Any
Platform              : {}
Direction             : Inbound
Action                : Allow
EdgeTraversalPolicy   : Block
...
```

### 6.2 Method 2: Using Firewall GUI

1. Press `Win + R`
2. Type `wf.msc`
3. Press Enter
4. Click **"Inbound Rules"** on the left panel
5. Click **"New Rule..."** on the right panel
6. **Rule Type**: Select "Port" → Next
7. **Protocol and Ports**:
   - ✅ TCP
   - ✅ Specific local ports: `27017`
   - Click Next
8. **Action**: Select "Allow the connection" → Next
9. **Profile**: Check all (Domain, Private, Public) → Next
10. **Name**: Enter `MongoDB Port 27017` → Finish

### 6.3 Verify Firewall Rule

```powershell
Get-NetFirewallRule -DisplayName "MongoDB Port 27017"
```

You should see the rule listed.

---

## Step 7: Restart MongoDB Service

After changing configuration, MongoDB must be restarted.

### 7.1 Restart via PowerShell

```powershell
# Stop MongoDB
net stop MongoDB

# Start MongoDB
net start MongoDB
```

**Expected output**:
```
The MongoDB Server service is stopping.
The MongoDB Server service was stopped successfully.

The MongoDB Server service is starting.
The MongoDB Server service was started successfully.
```

### 7.2 Verify Service Started

```powershell
Get-Service MongoDB
```

Status should be **"Running"**.

---

## Step 8: Find Your PC's IP Address

You need to know this PC's IP address so other computers can connect to it.

### 8.1 Get IP Address

```powershell
ipconfig
```

**Look for**: "IPv4 Address" under your active network adapter (usually "Ethernet" or "Wi-Fi")

**Example output**:
```
Ethernet adapter Ethernet:
   Connection-specific DNS Suffix  . :
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . : 192.168.1.1
```

**Your MongoDB IP**: `192.168.1.100` (in this example)

📝 **Write this down!** You'll need it for connecting from other PCs.

---

## Step 9: Create Database Users (If Authentication Enabled)

If you enabled authentication in Step 5.4, you need to create users.

### 9.1 Connect to MongoDB Locally

```powershell
mongosh
```

### 9.2 Create Admin User

```javascript
// Switch to admin database
use admin

// Create admin user
db.createUser({
  user: "admin",
  pwd: "SecureAdminPassword123!",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" }
  ]
})
```

**Expected output**:
```javascript
{ ok: 1 }
```

### 9.3 Reconnect with Authentication

Exit and reconnect with admin credentials:

```javascript
exit
```

```powershell
mongosh -u admin -p SecureAdminPassword123! --authenticationDatabase admin
```

### 9.4 Create Application Database and User

```javascript
// Switch to hotel database
use hotel-db

// Create application user
db.createUser({
  user: "hotel-app",
  pwd: "HotelAppPassword456!",
  roles: [
    { role: "readWrite", db: "hotel-db" }
  ]
})
```

### 9.5 Verify User Creation

```javascript
// Show all users in current database
db.getUsers()
```

You should see the `hotel-app` user listed.

```javascript
exit
```

---

## Step 10: Test Network Connection

### 10.1 Test from MongoDB Server PC (Local Test)

```powershell
# Without authentication
mongosh "mongodb://localhost:27017/hotel-db"

# With authentication
mongosh "mongodb://hotel-app:HotelAppPassword456!@localhost:27017/hotel-db?authSource=hotel-db"
```

### 10.2 Test from Another PC on Network

On your **development PC** (or any other PC on the network):

```powershell
# Test with ping first
ping 192.168.1.100

# Test MongoDB connection (replace IP with your actual IP)
mongosh "mongodb://192.168.1.100:27017/hotel-db"

# Or with authentication
mongosh "mongodb://hotel-app:HotelAppPassword456!@192.168.1.100:27017/hotel-db?authSource=hotel-db"
```

**Expected result**: You should connect successfully and see the `hotel-db>` prompt.

---

## Step 11: Install MongoDB Compass (Optional GUI)

MongoDB Compass provides a graphical interface to manage your database.

### 11.1 Download Compass

1. Visit: [mongodb.com/try/download/compass](https://www.mongodb.com/try/download/compass)
2. Select: Windows 64-bit (MSI)
3. Download

### 11.2 Install Compass

1. Run the installer
2. Follow installation wizard
3. Accept defaults
4. Click "Install"

### 11.3 Connect with Compass

1. Launch MongoDB Compass
2. **Connection string**:
   - Without auth: `mongodb://localhost:27017`
   - With auth: `mongodb://admin:SecureAdminPassword123!@localhost:27017`
3. Click "Connect"

You can now browse databases, collections, and documents visually.

---

## Configuration Summary

### Your MongoDB Server Details

**PC Information**:
- PC Name: ________________ (e.g., "MONGODB-SERVER")
- IP Address: ______________ (e.g., 192.168.1.100)
- Port: 27017

**Connection Strings**:

**Without Authentication**:
```
mongodb://192.168.1.100:27017/hotel-db
```

**With Authentication**:
```
mongodb://hotel-app:HotelAppPassword456!@192.168.1.100:27017/hotel-db?authSource=hotel-db
```

---

## Common Issues & Troubleshooting

### Issue 1: Service Won't Start

**Check Event Logs**:
```powershell
Get-EventLog -LogName Application -Source MongoDB -Newest 10
```

**Common causes**:
- Configuration file syntax error
- Data directory doesn't exist or has wrong permissions
- Port 27017 already in use

**Solutions**:
```powershell
# Check if port is in use
netstat -ano | findstr :27017

# Recreate data directory
mkdir "C:\Program Files\MongoDB\Server\7.0\data"
```

### Issue 2: Cannot Connect from Other PC

**Checklist**:
1. ✅ MongoDB service is running
2. ✅ `bindIp` is set to `0.0.0.0` in config
3. ✅ Firewall rule added
4. ✅ Both PCs on same network
5. ✅ Using correct IP address

**Test from MongoDB PC**:
```powershell
# Check if MongoDB is listening on all interfaces
netstat -an | findstr :27017
# Should show: 0.0.0.0:27017
```

**Test from other PC**:
```powershell
# Test if PC is reachable
ping 192.168.1.100

# Test if port is accessible
Test-NetConnection -ComputerName 192.168.1.100 -Port 27017
```

### Issue 3: Authentication Failed

**Solutions**:
```javascript
// Verify user exists
use hotel-db
db.getUsers()

// If user doesn't exist, create it again
db.createUser({
  user: "hotel-app",
  pwd: "HotelAppPassword456!",
  roles: [{ role: "readWrite", db: "hotel-db" }]
})
```

---

## Maintenance Tasks

### Restart MongoDB Service

```powershell
net stop MongoDB
net start MongoDB
```

### Check MongoDB Logs

Location: `C:\Program Files\MongoDB\Server\7.0\log\mongod.log`

```powershell
# View last 50 lines
Get-Content "C:\Program Files\MongoDB\Server\7.0\log\mongod.log" -Tail 50
```

### Backup Database

```powershell
# Create backup directory
mkdir C:\MongoBackups

# Backup database
"C:\Program Files\MongoDB\Server\7.0\bin\mongodump.exe" --db hotel-db --out C:\MongoBackups
```

### Restore Database

```powershell
"C:\Program Files\MongoDB\Server\7.0\bin\mongorestore.exe" --db hotel-db C:\MongoBackups\hotel-db
```

---

## Security Recommendations

1. ✅ **Enable authentication** (already covered)
2. ✅ **Use strong passwords** (minimum 12 characters, mixed case, numbers, symbols)
3. ✅ **Restrict bindIp** to specific IPs if possible
4. ✅ **Keep MongoDB updated** (check for security patches)
5. ✅ **Regular backups** (schedule weekly backups)
6. ✅ **Limit user permissions** (give only necessary access)
7. ⚠️ **Don't expose to internet** (use VPN if remote access needed)

---

## Quick Reference

### Service Management
```powershell
Get-Service MongoDB          # Check status
net start MongoDB            # Start service
net stop MongoDB             # Stop service
net restart MongoDB          # Restart service (not available, use stop then start)
```

### Connection Strings
```powershell
# Local
mongosh

# Local with auth
mongosh -u admin -p password --authenticationDatabase admin

# Remote from other PC
mongosh "mongodb://hotel-app:password@192.168.1.100:27017/hotel-db?authSource=hotel-db"
```

### File Locations
```
Config:  C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg
Data:    C:\Program Files\MongoDB\Server\7.0\data\
Logs:    C:\Program Files\MongoDB\Server\7.0\log\mongod.log
Binary:  C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe
```

---

## Next Steps

After MongoDB server is set up:

1. ✅ **Share IP and credentials** with development team
2. ✅ **Test connection** from development PCs (see `mongodb-network-setup.md`)
3. ✅ **Configure backend** on dev PC (see `windows-dev-setup.md`)
4. ✅ **Set up regular backups**
5. ✅ **Monitor service status** periodically

---

**MongoDB Server Setup Complete!** 🎉

Your Windows PC is now configured as a MongoDB database server accessible from your local network.
