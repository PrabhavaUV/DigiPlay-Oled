# ✦ DigiPlay: IoT-Based Remote Digital Display Platform

> **A secure, full-stack IoT system that enables real-time remote updates to physical hardware name displays with human-in-the-loop administrative approval.**

---

## 📌 1. Project Overview

**DigiPlay** bridges the gap between mobile clients, cloud infrastructure, and low-power microcontrollers. Traditional digital signs either lack security, require tedious physical reprogramming via cables, or update immediately without managerial verification. 

DigiPlay solves this with a **three-tier ecosystem**:
1. **Mobile Application**: A user inputs a new name, status, or message for any display in the building.
2. **Central Management Server**: Holds requests in a `PENDING` queue on PostgreSQL and provides a web dashboard where administrators review, approve, or reject proposals.
3. **Hardware Displays (ESP32 DevKit)**: Low-power display nodes connected over an embedded **MQTT broker**. The moment an admin approves a message, the server pushes it instantly over the network. The hardware writes the message to non-volatile flash storage and renders it on a crisp OLED screen.

```
┌─────────────────────────────────┐
│     📱 DigiPlay Mobile App      │
│  (Propose new display content)  │
└────────────────┬────────────────┘
                 │ HTTP REST (x-api-key)
                 ▼
┌────────────────────────────────────────────────────────┐
│             🖥️ DigiPlay Central Server                 │
│  • Express.js Web Engine (Port 8000)                   │
│  • PostgreSQL Persistent Storage (Sequelize ORM)       │
│  • Glassmorphic Admin Dashboard (Approve / Reject)     │
│  • Embedded Aedes MQTT Broker (TCP Port 1883)          │
└────────────────┬───────────────────────────────────────┘
                 │ Real-Time MQTT Pub/Sub (QoS 1)
                 │ Topic: digiplay/devices/{id}/content
                 ▼
┌────────────────────────────────────────────────────────┐
│          📟 ESP32 Digital Name Display Node            │
│  • 0.96" SSD1306 128x64 OLED (I2C: GPIO 22 / 23)       │
│  • Non-Volatile Flash Storage (Preferences API)        │
│  • Dynamic Font Scaling & Status LED Indicators        │
└────────────────────────────────────────────────────────┘
```

---

## 🏢 2. Real-World Applications

* **University Faculty & Lab Doors**: Display professors' consulting hours, active lectures, or "Lab Exam in Progress" messages.
* **Corporate Conference Rooms**: Real-time room booking indicators ("Reserved: Product Sync 2PM - 3PM").
* **Hospitals & Clinics**: Doctor availability and on-duty status indicators outside consultation rooms.
* **Smart Desks & Coworking Spaces**: Dynamically assigned hot-desk nameplates.

---

## 🗂️ 3. Repository Directory Structure

```text
Version_3/
├── README.md                      # This comprehensive project manual
├── .gitignore                     # Repository-wide git ignore rules
│
├── server/                        # Backend Server & Administrative Web UI
│   ├── server_setup.md            # Step-by-step beginner's guide for the server
│   ├── .env.example               # Configuration template for environment variables
│   ├── index.js                   # Application entry point & MQTT presence engine
│   ├── database.js                # PostgreSQL connection pool (Sequelize)
│   ├── models.js                  # Database schemas (Admin, Device, UpdateRequest)
│   ├── auth.js                    # JWT token signing & session middleware
│   ├── package.json               # Node.js dependencies and run scripts
│   ├── routes/
│   │   ├── admin.js               # Approval and rejection controllers
│   │   ├── devices.js             # REST API for hardware registration & push
│   │   └── requests.js            # REST API for mobile update submissions
│   ├── templates/                 # Nunjucks server-rendered HTML views
│   │   ├── login.html             # Secure administrative login portal
│   │   ├── dashboard.html         # Live overview & 1-click approval queue
│   │   ├── devices.html           # Hardware provisioning & direct push tools
│   │   └── requests.html          # Historical audit logs
│   ├── static/                    # CSS stylesheets & visual branding
│   └── scripts/
│       └── create_admin.js        # CLI utility to seed initial administrator
│
├── digiplay_firmware/             # ESP32 C++ Arduino Source Code
│   ├── esp_setup.md               # Step-by-step flashing & wiring guide
│   └── digiplay_firmware.ino      # Firmware code (OLED, MQTT, NVS Storage)
│
└── DigiPlay_App/                  # Android Native Mobile Application
    ├── app_setup.md               # Step-by-step Android Studio setup guide
    └── app/                       # Java MVP Architecture codebase
```

---

## ⚙️ 4. System Technology Stack

| Domain | Technology | Role & Justification |
|---|---|---|
| **Server Framework** | Node.js (v18+) & Express.js | High-throughput asynchronous event loop ideal for handling concurrent web clients. |
| **Database** | PostgreSQL | Robust relational database ensuring ACID-compliant transaction records. |
| **ORM Layer** | Sequelize (v6) | Programmatic model definitions, migrations, and relationship cascading. |
| **IoT Protocol** | MQTT via Aedes Engine | Embedded broker running on TCP Port 1883; delivers sub-50ms message push to displays. |
| **Web Frontend** | Nunjucks Templating & Custom CSS | Server-side rendered glassmorphic admin dashboard; lightweight, fast, and responsive. |
| **Hardware** | ESP32 DevKit V1 (38-Pin) | 240MHz dual-core CPU with built-in 802.11 b/g/n Wi-Fi transceiver. |
| **Display Panel** | SSD1306 0.96" OLED (128x64) | Low-power I2C display readable from wide angles under ambient room lighting. |
| **Flash Storage** | ESP32 Preferences (NVS) | Stores last approved message to survive sudden power cuts or battery drain. |
| **Mobile App** | Native Android (Java) | MVP architecture with Retrofit 2/OkHttp networking for device lookup & requests. |

---

## 🔄 5. End-to-End Data Lifecycle

Here is the exact step-by-step path a message takes through the platform:

```
[User on Android]
      │ Types "Meeting in Room 4B" and taps Submit
      ▼
[POST /api/requests]
      │ Authenticated via shared x-api-key
      ▼
[PostgreSQL Database]
      │ Inserted into update_requests table with status='PENDING'
      ▼
[Admin Dashboard]
      │ Admin reviews request on Web UI and clicks "Approve"
      ▼
[POST /api/admin/requests/{id}/approve]
      │ 1. Status updated to 'APPROVED' in PostgreSQL
      │ 2. target device.current_content updated to "Meeting in Room 4B"
      │ 3. Checksum computed
      ▼
[Embedded Aedes MQTT Broker]
      │ Publishes JSON payload to topic: digiplay/devices/DP001/content
      ▼
[ESP32 Hardware Display]
      │ 1. PubSubClient callback triggers instantly
      │ 2. Compares checksum (prevents redundant flash writes)
      │ 3. Saves to non-volatile flash (Preferences API)
      │ 4. Dynamically scales font and draws to OLED
      │ 5. Blinks onboard status LED 3 times in confirmation
```

---

## 🚀 6. Quick Start Navigation

For detailed, step-by-step setup guides designed for complete beginners, please refer to the dedicated guides in each component folder:

* 🖥️ **[Server Setup & Troubleshooting Guide](file:///home/prabhava/Desktop/Expeminet/Display_Device/Version_3/server/server_setup.md)**
* 📟 **[ESP32 Hardware Wiring & Flashing Guide](file:///home/prabhava/Desktop/Expeminet/Display_Device/Version_3/digiplay_firmware/esp_setup.md)**
* 📱 **[Android App Build & Deployment Guide](file:///home/prabhava/Desktop/Expeminet/Display_Device/Version_3/DigiPlay_App/app_setup.md)**

---

## 🛡️ 7. Security Architecture

1. **Dual-Layer Admin Authentication**:
   * API endpoints require `Authorization: Bearer <JWT_TOKEN>`.
   * Web browser interactions use secure, `HttpOnly`, `SameSite=Lax` session cookies.
   * **Runtime Session Invalidation**: The server generates an ephemeral boot identifier on startup. If the server is restarted, all previous sessions are instantly invalidated to prevent session hijacking.
2. **Mobile API Authorization**:
   * All mobile endpoints enforce an `X-API-Key` verification filter, preventing open internet scraping.
3. **Hardware Isolation**:
   * Displays only listen on their designated hardware topic (`digiplay/devices/{DEVICE_ID}/content`) and never accept content from unapproved sources.

---

## 📜 8. License

This project is licensed under the MIT License — see the [LICENSE](file:///home/prabhava/Desktop/Expeminet/Display_Device/Version_3/server/LICENSE) file for details.
