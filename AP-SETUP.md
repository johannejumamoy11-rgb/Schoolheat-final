# SchoolHeat ESP32 access-point setup

The ESP32 creates its own password-protected Wi-Fi network. The installed
GitHub Pages app connects directly to it; no laptop bridge is required.

## Hardware

- DHT22 VCC -> ESP32 3V3
- DHT22 DATA -> ESP32 GPIO 4
- DHT22 GND -> ESP32 GND

## Configure and upload

1. Open `schoolheat-esp32/schoolheat-esp32.ino` in Arduino IDE.
2. Set `AP_PASSWORD` to a private Wi-Fi password of at least 8 characters.
   Do not commit the real password to GitHub. No API token is needed.
3. Install Adafruit DHT sensor library, Adafruit Unified Sensor, and
   ArduinoJson. Select the appropriate ESP32 board and upload the sketch.
4. Open Serial Monitor at 115200 baud. The board creates the `SchoolHeat`
   network, normally at `192.168.4.1`.

If LittleFS cannot mount, the sketch automatically formats it, which erases
stored readings. Look for `LittleFS mounted successfully.` in Serial Monitor.

## Sync directly from the app

1. While online, open the published SchoolHeat GitHub Pages app on each phone
   or laptop and install it. This caches the app before the device joins the
   ESP32's no-internet Wi-Fi network.
2. Power the ESP32 and connect each device to `SchoolHeat` using the private
   password configured in `AP_PASSWORD`. A "No internet" warning is expected.
3. Open the installed app, go to **Monitor**, select the sensor location, and
   click **Auto-Read ESP32**. Approve local-network access if prompted. The
   first sync sets the ESP32 clock and requests an immediate DHT22 reading.
4. Leave Auto-Read running while connected. The ESP32 continues sampling every
   five minutes and each device saves its own copy of readings. The devices do
   not share browser storage. When ESP32 flash fills, its log rotates out the
   oldest readings to make room for new ones.

Direct access requires a browser that permits a secure GitHub Pages app to
connect to a local HTTP device; current Chrome or Edge is recommended. Browser
support and local-network permission prompts may vary. Firebase sync and phone
push alerts still require internet.
