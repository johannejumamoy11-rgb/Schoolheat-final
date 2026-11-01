# SchoolHeat ESP32 access-point setup

The ESP32 creates its own password-protected Wi-Fi network and can also expose
saved readings over Bluetooth Low Energy (BLE). Wi-Fi sync from GitHub Pages
requires the localhost bridge because Edge blocks the HTTPS app from directly
fetching the ESP32's HTTP API. Bluetooth sync does not require the bridge or
joining the ESP32 Wi-Fi.

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

## Sync the GitHub Pages app over Bluetooth (no bridge)

1. Upload the updated firmware, which advertises as **SchoolHeat ESP32** and
   keeps sampling every five minutes while powered.
2. Open the HTTPS GitHub Pages app in desktop Edge or Chrome. Go to **Monitor**,
   select the sensor location, and click **Sync via Bluetooth**.
3. Select **SchoolHeat ESP32** in the browser permission prompt and keep the
   laptop within Bluetooth range until sync completes. The app sets the device
   clock/location, requests a sample, then imports saved records into this
   browser's history.
4. When the laptop is off, the ESP32 continues logging to flash if it remains
   powered. Sync later over Bluetooth to import those readings.

Bluetooth requires a secure context and Web Bluetooth support; use the HTTPS
GitHub Pages app for the supported workflow. Browser behavior when opening the
app as a local file can vary. The BLE service is not protected by the Wi-Fi
password, so use it only in a trusted environment. This hardware has no
real-time clock; if it reboots without a connected app, records may not have
reliable timestamps.

## Sync the GitHub Pages app over Wi-Fi (bridge required)

1. While online, open the published SchoolHeat GitHub Pages app on the Windows
   laptop so its files are cached. Download or copy `start-local-bridge.ps1` to
   that laptop.
2. Power the ESP32 and connect the laptop to `SchoolHeat` using the private
   password configured in `AP_PASSWORD`. A "No internet" warning is expected.
3. In PowerShell, from the folder containing the bridge script, run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\start-local-bridge.ps1
   ```

4. Keep that PowerShell window open. In the GitHub Pages app, go to **Monitor**,
   select the sensor location, and click **Auto-Read ESP32**. The first sync
   sets the clock and requests an immediate sample; after that, the ESP32
   samples every five minutes.
5. Readings are saved in that browser's local storage. Each teammate's device
   needs its own copy of the app data; readings are not automatically shared.

The bridge binds to localhost and only accepts this project's GitHub Pages
origin. The ESP32 API stays on its password-protected Wi-Fi network. Firebase
sync and phone push alerts still require internet.
