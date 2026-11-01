SCHOOLHEAT ESP32 WIFI QUICK START
================================

The ESP32 reads the DHT22. The installed GitHub Pages app reads the ESP32
directly over its SchoolHeat Wi-Fi network. No laptop bridge or USB data
connection is needed.

1. In schoolheat-esp32/schoolheat-esp32.ino, set AP_PASSWORD to a private Wi-Fi
   password of at least 8 characters. Do not commit the real password to GitHub.
2. Upload the sketch and power the ESP32. It creates the SchoolHeat network at
   192.168.4.1.
3. While online, open the published app on each phone or laptop and install it
   so its files are cached for offline use.
4. Connect each device to the SchoolHeat Wi-Fi network. A "No internet" warning
   is expected.
5. Open the installed app, go to Monitor, choose the sensor location, and click
   Auto-Read ESP32. Allow local-network access if the browser asks.

Auto-Read takes a sample immediately, then imports new readings as the ESP32
samples every five minutes. Readings are saved separately on each device. The
ESP32 keeps a rolling log and drops its oldest readings when flash fills.

Use a current Chrome or Edge browser. Direct access requires browser support
for secure GitHub Pages apps to connect to local Wi-Fi devices. Firebase sync
and phone push alerts still require internet.
