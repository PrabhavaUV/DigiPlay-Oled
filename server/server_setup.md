# 🖥️ DigiPlay Server: Complete Setup & Troubleshooting Guide

> **Welcome!** This guide is designed so that anyone—even with **zero prior programming experience**—can set up, configure, run, and troubleshoot the DigiPlay central backend server.

---

## 📖 1. What Does This Server Do?

Imagine the DigiPlay server as the **central post office and security gate** for your smart display screens:
* It runs a **Web Management Dashboard** (on port `8000`) where managers log in and view displays.
* It securely connects to a **PostgreSQL Database** to store authorized users, device records, and message logs.
* It houses an embedded **MQTT Broker** (on port `1883`) that acts as an instant radio tower, broadcasting approved messages directly to your physical ESP32 screens in milliseconds.
* It accepts incoming update proposals submitted from the **Mobile App**.

---

## 📋 2. Prerequisites (What You Need Before Starting)

You need two free pieces of software installed on your computer:
1. **Node.js (Version 18 or newer)**: The engine that runs our JavaScript backend.
2. **PostgreSQL**: The database that remembers all our devices and messages.

### How to Install on Ubuntu / Linux:
Open your terminal (press `Ctrl + Alt + T`) and paste the following commands:
```bash
# 1. Update your package manager
sudo apt update

# 2. Install Node.js & npm
sudo apt install -y nodejs npm

# 3. Verify Node.js version (should be v18 or higher)
node -v

# 4. Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 5. Ensure PostgreSQL is running
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### How to Install on Windows or macOS:
* **Node.js**: Download and run the **LTS Installer** from [nodejs.org](https://nodejs.org/).
* **PostgreSQL**: Download and install from [postgresql.org](https://www.postgresql.org/download/).

---

## 🗄️ 3. Setting Up the PostgreSQL Database

Before starting the server, we need to create an empty database room for DigiPlay. Run these commands in your terminal:

```bash
# 1. Switch to the postgres administrator user
sudo -u postgres psql
```

You will see a prompt that looks like `postgres=#`. Copy and paste these three SQL commands one by one:

```sql
-- 1. Create a dedicated database user
CREATE USER iot_user WITH PASSWORD 'iot_password';

-- 2. Create the project database
CREATE DATABASE iot_devices OWNER iot_user;

-- 3. Grant full permissions to your new user
GRANT ALL PRIVILEGES ON DATABASE iot_devices TO iot_user;

-- 4. Exit the postgres shell
\q
```

*Congratulations! Your database is now prepared and waiting for connections.*

---

## 🚀 4. Step-by-Step Server Setup

### Step 1: Open the Server Directory
Open your terminal and navigate to the `server` folder inside `Version_3`:
```bash
cd /path/to/Display_Device/Version_3/server
```

### Step 2: Install Node.js Dependencies
Download all the necessary libraries specified in `package.json`:
```bash
npm install
```
*What this does:* It automatically downloads Express (web framework), Sequelize (database tool), Aedes (MQTT engine), and bcrypt (password security) into a local `node_modules` folder.

### Step 3: Create Your `.env` Configuration File
The server looks for an environment file named `.env` to read passwords and connection addresses.

Make a copy of the provided template:
```bash
cp .env.example .env
```

Open the `.env` file in any text editor (like VS Code, Nano, or Gedit):
```env
DATABASE_URL=postgresql://iot_user:iot_password@localhost:5432/iot_devices
SECRET_KEY=94c502b48d88e04eababa2e7bcca198a28f7d983411b43958cc5c18f1a1c93de
APP_API_KEY=my-mobile-app-static-key
ENVIRONMENT=development
PORT=8000
```
* **`DATABASE_URL`**: Matches the user (`iot_user`), password (`iot_password`), host (`localhost`), port (`5432`), and database (`iot_devices`).
  * **Format**: `postgresql://<username>:<password>@<host>:<port>/<database_name>`
  * **⚠️ Important Note on Port `5432`**: `5432` is PostgreSQL's default port. However, if your system has multiple PostgreSQL versions installed or a custom cluster, your active port might be `5433` or another number.
  * **How to check your PostgreSQL port**:
    ```bash
    sudo -u postgres psql -c 'SHOW port;'
    ```
    *(If the output displays `5433` or another port, change `5432` in your `DATABASE_URL` to match that number!)*
* **`SECRET_KEY`**: A secure random string used to sign administrator login tokens.
* **`APP_API_KEY`**: A password shared between this server and the mobile app.

### Step 4: Seed the Administrator Account
Run our database setup script to initialize the database tables and create an administrator account. You have two options:

#### Option A: Quick Default Admin (Fastest)
```bash
npm run seed
```
*Expected Output:*
```text
[DB] Database synchronized. System ready.
Successfully created admin user 'admin'!
```
This automatically sets up default credentials:
* **Username:** `admin`
* **Password:** `admin123`

#### Option B: Custom Admin Username & Password (Recommended for Security)
To create your own custom credentials instead of the defaults, pass your chosen username and password directly:
```bash
node scripts/create_admin.js <your_username> <your_password>
```
*Example:*
```bash
node scripts/create_admin.js superadmin MyStrongP@ss2026!
```
*(Or using npm: `npm run seed -- superadmin MyStrongP@ss2026!`)*

*Expected Output:*
```text
[DB] Database synchronized. System ready.
Successfully created admin user 'superadmin'!
```

> [!TIP]
> You can run this command again at any time with a new username to create additional administrator accounts for other operators. If an admin username already exists, the script will let you know and safely leave it untouched.

### Step 5: Start the Server!
Now, launch the platform:
```bash
npm start
```

*Expected Output:*
```text
> digiplay-backend@1.0.0 start
> node index.js

[MQTT] Broker is running on port 1883
[DB] Database synchronized. System ready.
--------------------------------------------------
🚀 DigiPlay Platform: http://localhost:8000
📁 Admin Credentials: Run npm run seed
--------------------------------------------------
```

---

## 🖥️ 5. Using the Web Administration Dashboard

1. **Log in**: Open your browser and go to `http://localhost:8000/login`.
   * Enter Username: `admin`
   * Enter Password: `admin123`
   * Click **Authenticate Session**.
2. **Dashboard Overview (`/dashboard`)**:
   * Displays the total number of hardware displays registered, how many are currently powered on and online, and any pending update requests submitted by mobile users.
3. **Registering a New Hardware Display (`/devices`)**:
   * Navigate to the **Devices** tab.
   * Enter a display name (e.g., `Main Entrance Display`) and location.
   * Click **+ Generate Credentials**.
   * The system generates a permanent hardware ID (e.g. `DP001`) and a cryptographic device token. 
4. **Instant Push Updates (`/devices`)**:
   * Each device row includes a **Quick Push Update** field.
   * Type any announcement (e.g., `Class Suspended`) and click **Push Update**. The server instantly broadcasts it over MQTT directly to the OLED display!

---

## 🛠️ 6. Troubleshooting & Common Errors

Here is a troubleshooting cheat sheet for any error you might encounter:

| Error Message | Why It Happens | How to Fix It (Step-by-Step) |
|---|---|---|
| `Error: listen EADDRINUSE: address already in use 0.0.0.0:1883` | Another instance of the server is already running in the background and holding port 1883. | Run `lsof -i :1883` to find the process ID (PID), then run `kill -9 <PID>` to close it. Then run `npm start` again. |
| `Error: listen EADDRINUSE: address already in use :::8000` | Port 8000 is occupied by another app or an old server instance. | Run `lsof -i :8000` to find the PID, run `kill -9 <PID>`, and restart. |
| `ConnectionRefusedError: connect ECONNREFUSED 127.0.0.1:5432` | Either PostgreSQL is stopped, OR PostgreSQL is listening on a different port (such as 5433). | 1. Ensure PostgreSQL is active: `sudo systemctl start postgresql`.<br>2. Check your active port: `sudo -u postgres psql -c 'SHOW port;'`. If it is running on 5433 or another port, change `5432` in your `.env` `DATABASE_URL` to match it. |
| `password authentication failed for user "iot_user"` | The password in `.env` doesn't match the PostgreSQL user password. | Reset the password by running: `sudo -u postgres psql -c "ALTER USER iot_user WITH PASSWORD 'iot_password';"` |
| `database "iot_devices" does not exist` | The database was not created yet. | Create it with: `sudo -u postgres createdb -O iot_user iot_devices`. |
| `[Database] FATAL: DATABASE_URL environment variable is required` | The `.env` file is missing or in the wrong folder. | Make sure `.env` is sitting directly inside the `server/` directory. Run `cp .env.example .env`. |

---

## 💡 7. Suggestions for Future Production Improvements

If you plan to scale this system for an enterprise or public deployment, here are the top recommended enhancements:

1. **Standalone MQTT Broker (Mosquitto / AWS IoT Core)**:
   * Currently, the MQTT broker runs inside Node.js. For thousands of displays, running a dedicated broker like Eclipse Mosquitto or AWS IoT Core provides higher throughput.
2. **Reverse Proxy with HTTPS (Nginx + Let's Encrypt)**:
   * Place Nginx in front of Node.js on port 80/443 with an SSL certificate to encrypt all web and API traffic over HTTPS.
3. **Database Migrations (Sequelize CLI)**:
   * Transition from automatic `db.sync()` to versioned migration scripts so database schema updates can be deployed without risk to existing production records.
4. **Containerization (Docker)**:
   * Create a `docker-compose.yml` that boots the Node.js server and PostgreSQL container together in a single command (`docker compose up`).
