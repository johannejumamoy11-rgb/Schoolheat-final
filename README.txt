SCHOOLHEAT ESP32 WIFI QUICK START
================================

The ESP32 reads the DHT22 and saves readings to flash. Use either Wi-Fi with
the laptop bridge, or Bluetooth directly from desktop Edge/Chrome without a
bridge.

1. In schoolheat-esp32/schoolheat-esp32.ino, set AP_PASSWORD to a private Wi-Fi
   password of at least 8 characters. Do not commit the real password.
2. Upload the sketch and power the ESP32. It creates the SchoolHeat Wi-Fi at
   192.168.4.1.
3. While online, open the HTTPS GitHub Pages app. For bridge-free sync, click
   "Sync via Bluetooth" and choose "SchoolHeat ESP32" in the browser prompt.
   The laptop does not need to join the ESP32 Wi-Fi.
4. For Wi-Fi sync instead, connect the laptop to SchoolHeat Wi-Fi; a "No
   internet" warning is expected. In the folder containing
   start-local-bridge.ps1, run:

   powershell -ExecutionPolicy Bypass -File .\start-local-bridge.ps1

5. Keep the PowerShell window open. In the GitHub Pages app, go to Monitor,
   choose the sensor location, and click Auto-Read ESP32.

The ESP32 samples every five minutes and stores readings while powered, even
when the laptop is off. Bluetooth sync imports saved readings into that
browser's history later; Wi-Fi sync requires the bridge during sync. Bluetooth
requires a secure context and desktop Web Bluetooth support and should only be
used in a trusted environment. The published HTTPS app is recommended.
