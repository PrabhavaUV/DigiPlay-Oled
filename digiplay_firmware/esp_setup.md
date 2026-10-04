# 📟 DigiPlay ESP32 Hardware Display: Flashing & Wiring Guide

> **Welcome!** This guide will take you step-by-step through wiring the display screen, configuring the Arduino IDE, and flashing the firmware onto the ESP32 microcontroller—even if you have **never touched electronics or microcontrollers before**.

---

## 📖 1. How Does the Display Work?

The **ESP32** is a tiny, powerful computer chip that costs less than $5. It has built-in Wi-Fi.
1. When you plug it into power, it reads the last approved message saved in its internal flash memory and immediately shows it on the screen.
2. It connects to your local Wi-Fi network.
3. It opens an instant real-time data link (MQTT) with your DigiPlay server.
4. The instant an administrator approves a message on the computer, the ESP32 receives the message, writes it to its permanent memory, blinks its status LED, and updates the screen text!

---

## 🛒 2. Hardware Components Required

You will need the following inexpensive components:

| Component | Image / Description | Where to Connect |
|---|---|---|
| **ESP32 DevKit V1** (30-pin or 38-pin) | The main microcontroller board with micro-USB port. | Connects to your PC via micro-USB cable. |
| **0.96" I2C OLED Display (SSD1306)** | 128x64 pixel screen with 4 pins: `GND`, `VCC`, `SCL`, `SDA`. | Connected to ESP32 GPIO 22 & 23. |
| **Female-to-Female Jumper Wires** (4 wires) | Dupont connector cables to bridge OLED and ESP32. | Pins described below. |
| **Micro-USB Data Cable** | Ensure it is a **data transfer cable**, not just a charge-only cable. | PC USB port $\leftrightarrow$ ESP32. |

---

## 🔌 3. Complete Circuit & Wiring Diagram

The OLED display uses the **I2C communication protocol**, which requires only **4 simple wires**:

```text
  ┌─────────────────────────────────┐
  │      0.96" SSD1306 OLED         │
  │     [GND]   [VCC]  [SCL]  [SDA] │
  └───────┬───────┬──────┬──────┬───┘
          │       │      │      │
          ▼       ▼      ▼      ▼
        [GND]   [3.3V] [GPIO22][GPIO23]
  ┌─────────────────────────────────┐
  │        ESP32 DevKit V1          │
  │           [Micro-USB]           │
  └─────────────────────────────────┘
```

### Wiring Connection Table:
| OLED Screen Pin | Wire Color (Example) | ESP32 Board Pin | Function |
|---|---|---|---|
| **GND** | Black | **GND** | Ground (Negative Power) |
| **VCC** | Red | **3V3 (or 3.3V)** | 3.3 Volts Power Supply |
| **SCL** | Yellow / White | **GPIO 22** | I2C Clock Line |
| **SDA** | Green / Blue | **GPIO 23** | I2C Data Line |

> ⚠️ **Important:** Do NOT connect OLED VCC to the `VIN` or `5V` pin on the ESP32. Connect it strictly to the **`3V3`** pin to prevent burning out the OLED display chip.

---

## 💻 4. Installing the Software (Arduino IDE)

### Step 1: Download & Install Arduino IDE
1. Go to the official website: [arduino.cc/en/software](https://www.arduino.cc/en/software).
2. Download and install **Arduino IDE 2.x** for Windows, macOS, or Linux.

### Step 2: Add ESP32 Board Support to Arduino IDE
1. Open Arduino IDE.
2. In the top menu, go to: **File $\rightarrow$ Preferences** (or `Ctrl + ,`).
3. Find the field labeled **"Additional Boards Manager URLs"**.
4. Paste the following URL into the box:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
5. Click **OK**.
6. Open **Tools $\rightarrow$ Board $\rightarrow$ Boards Manager** (or click the board icon on the left sidebar).
7. Search for `esp32` by **Espressif Systems** and click **Install**.

### Step 3: Install Required Libraries
The firmware uses 4 standard open-source libraries. Install them via the Library Manager:
1. In Arduino IDE, click the book icon on the left sidebar or go to: **Sketch $\rightarrow$ Include Library $\rightarrow$ Manage Libraries** (`Ctrl + Shift + I`).
2. Search and install each of these 4 libraries:
   * **`Adafruit SSD1306`** by *Adafruit* (Click "Install All" if it asks to install dependencies).
   * **`Adafruit GFX Library`** by *Adafruit*.
   * **`PubSubClient`** by *Nick O'Leary* (Handles the real-time MQTT protocol).
   * **`ArduinoJson`** by *Benoit Blanchon* (Version 6.x recommended).

---

## ⚙️ 5. Configuring the Firmware Code

1. Open the firmware sketch in Arduino IDE:
   Navigate to `Version_3/digiplay_firmware/digiplay_firmware.ino`.
2. Locate the **CONFIGURATION** block near line 16:

```cpp
// ─── CONFIGURATION ───────────────────────────────────────────
const char* MQTT_BROKER = "192.168.1.15"; // YOUR COMPUTER'S LOCAL IP
const int   MQTT_PORT   = 1883;          // DEFAULT SERVER MQTT PORT
const char* DEVICE_ID   = "DP001";       // MUST MATCH SERVER REGISTERED ID

// WiFi Credentials
const char* WIFI_SSID   = "Your_WiFi_Name";
const char* WIFI_PASS   = "Your_WiFi_Password";
```

### How to Find Your Computer's Local IP (`MQTT_BROKER`):
Your ESP32 needs to know where your server lives on your local network:
* **On Linux**: Open a terminal and run `ip a` or `hostname -I`. Look for an IP like `192.168.1.XX`.
* **On Windows**: Open Command Prompt (`cmd`) and run `ipconfig`. Look for `IPv4 Address`.
* **On macOS**: Open Terminal and run `ipconfig getifaddr en0`.
* Enter that IP address into `const char* MQTT_BROKER = "...";`.

---

## ⚡ 6. Flashing (Uploading) the Firmware

1. Plug the ESP32 into your computer using the micro-USB cable.
2. In Arduino IDE:
   * Go to **Tools $\rightarrow$ Board $\rightarrow$ esp32 $\rightarrow$ ESP32 Dev Module**.
   * Go to **Tools $\rightarrow$ Port** and select your connected port (e.g., `COM3` on Windows, or `/dev/ttyUSB0` on Linux).
3. Click the **Upload** button (the round green button with an arrow pointing right `➜`).
4. Watch the bottom console window:
   * It will compile the code.
   * When you see `Connecting........`, if it does not automatically connect, **press and hold the physical "BOOT" button on the ESP32 board for 2 seconds**, then release it.
5. You will see `Writing at 0x00010000... (100%)` and `Hard resetting via RTS pin...`.
6. Done! The firmware is now running on the chip.

---

## 🧪 7. Verifying Operation

1. Open the **Serial Monitor** in Arduino IDE (**Tools $\rightarrow$ Serial Monitor** or `Ctrl + Shift + M`).
2. Set the baud rate in the bottom-right corner of the monitor to **`115200 baud`**.
3. Press the **EN / RST** button once on the ESP32.
4. You should see:
   ```text
   [Display] Showing: Initializing...
   [WiFi] Connecting to: MyHomeWiFi....
   [WiFi] Connected: 192.168.1.42
   [MQTT] Attempting connection... connected!
   [MQTT] Subscribed to: digiplay/devices/DP001/content
   ```
5. Look at the OLED screen:
   * It will show **"Connecting WiFi..."** $\rightarrow$ **"WiFi Connected!"** $\rightarrow$ **"Welcome!"** (or the last saved message).
6. Go to your server dashboard at `http://localhost:8000/devices`, type a message into Quick Push, and hit submit. **The screen will update in real-time!**

---

## 🛠️ 8. Troubleshooting & Common Errors

| Issue / Error | Cause | Solution |
|---|---|---|
| `fatal error: Adafruit_SSD1306.h: No such file` | The library was not installed in Arduino IDE. | Open Sketch $\rightarrow$ Include Library $\rightarrow$ Manage Libraries, search `Adafruit SSD1306`, and click Install. |
| `[Display] FATAL: SSD1306 not found!` | 1. Loose wires.<br>2. SCL & SDA swapped.<br>3. Wrong I2C address. | 1. Ensure SDA is on GPIO 23, SCL is on GPIO 22.<br>2. Check that OLED GND and 3V3 are firmly inserted.<br>3. Check if your OLED uses address `0x3D` instead of `0x3C` in `display.begin(..., 0x3C)`. |
| `Failed to connect to ESP32: Timed out waiting for packet header` | The computer failed to put the ESP32 into programming mode. | When `Connecting........_____` appears during upload, hold down the physical **BOOT** button on the ESP32 until the percentage counter appears. |
| Linux: `/dev/ttyUSB0: Permission denied` | Your Linux user lacks permission to access serial USB ports. | Run this command in terminal, then log out and log back in: `sudo usermod -a -G dialout $USER`. |
| `[MQTT] Attempting connection... failed, rc=-2` | ESP32 cannot reach your computer on port 1883. | 1. Ensure `npm start` is running on your server.<br>2. Ensure ESP32 and your computer are on the **exact same Wi-Fi network**.<br>3. Check that your computer's firewall is not blocking incoming TCP port 1883. |
| OLED screen remains completely black | OLED is not receiving power or display contrast failed. | Check wire continuity with a multimeter or test with a different micro-USB cable. |

---

## 💡 9. Suggestions for Future Hardware Improvements

1. **WiFiManager (Captive Portal Provisioning)**:
   * Instead of hardcoding Wi-Fi credentials in the C++ file, install the `WiFiManager` library. On first boot, the ESP32 broadcasts a temporary `DigiPlay-Hotspot`. You connect with your smartphone and choose your home Wi-Fi from a web menu.
2. **Deep Sleep Battery Operation**:
   * For battery-powered door tags, switch from OLED to an **E-Paper display** and place the ESP32 into Deep Sleep mode (`esp_deep_sleep_start()`), waking up periodically to achieve months of battery life.
3. **Hardware Watchdog Timer**:
   * Enable the ESP32 hardware watchdog (`esp_task_wdt_init()`) so that if the router drops or the device hangs, it automatically reboots itself without requiring manual intervention.
4. **3D Printed Enclosure**:
   * Design and 3D print a snap-fit desktop or door-mountable enclosure with mounting slots for the OLED display and micro-USB power cord.
