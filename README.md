# SchoolHeat — ESP32 local logging and phone push setup

## Install SchoolHeat and use it offline

SchoolHeat is a Progressive Web App (PWA). Publish it on an HTTPS host such as
GitHub Pages, open it online once on each device, then use the browser's
**Install app** or **Add to Home Screen** option. The app shell is cached for
offline startup. Readings and settings are saved in that browser's local
storage, so each device has its own local copy; offline changes do not
automatically sync between devices.

Offline mode does not provide internet services: Firebase sync and phone push
alerts need internet. For sensor readings, install the published GitHub Pages
app and open it online once on each device so its shell is cached. Then connect
that device to the ESP32's `SchoolHeat` Wi-Fi and use **Auto-Read ESP32**. The
app connects directly to the ESP32; no laptop bridge or USB data connection is
needed. Use a current Chrome or Edge browser that supports secure-page access
to local-network devices, and allow the local-network permission if prompted.
Each device saves its own readings in its own browser storage; readings are
not automatically shared between devices.

## ESP32 + DHT22 local Wi-Fi logging

The ESP32 samples every five minutes and keeps readings in onboard flash.
Auto-Read triggers an immediate sample when started, then imports new readings
over the ESP32's own Wi-Fi. This local setup does not require Firebase or
internet access for sensor readings. It does not send alerts to off-site
phones while the ESP32 is offline.

### Hardware and firmware

1. Connect the three-pin DHT22 module according to its printed labels:
   **VCC → ESP32 3V3**, **DATA → GPIO 4**, and **GND → GND**. Do not connect
   the sensor data pin to 5 V.
2. In `schoolheat-esp32.ino`, set `AP_PASSWORD` to a private Wi-Fi password of
   at least 8 characters. Do not commit the real password to GitHub. The app
   uses the password-protected ESP32 access point; no API token or bridge
   configuration is needed.
3. In Arduino IDE, select an ESP32 WROOM development board and install
   **DHT sensor library** by Adafruit, **Adafruit Unified Sensor**, and
   **ArduinoJson**. Upload `schoolheat-esp32.ino` at 115200 baud. Open Serial
   Monitor at 115200 baud. The ESP32 creates the `SchoolHeat` Wi-Fi network;
   its API is normally at `192.168.4.1`.
4. Keep the ESP32 powered from a separate USB power adapter when devices are
   disconnected. The DHT22 is sampled every five minutes. The 192 KiB flash
   log rotates out its oldest records when full so new readings continue to
   be saved.

If LittleFS cannot mount, the sketch formats its flash filesystem
automatically. Formatting erases any readings previously stored on the ESP32.
After uploading, check Serial Monitor at 115200 baud for
`LittleFS mounted successfully.` If the AP password is still a placeholder,
the ESP32 reports an error and does not start the access point.

If VS Code shows `file not found` underlines on the sketch's `#include` lines,
install or enable Microsoft's C/C++ extension and reopen the workspace. The
`.vscode/c_cpp_properties.json` file configures IntelliSense for the ESP32
Dev Module and Arduino packages installed on this laptop. These editor
underlines are separate from Arduino IDE compile errors; use **Verify** in
Arduino IDE to check whether the sketch itself compiles.

### Auto-Read directly from the ESP32

1. While online, open the published SchoolHeat GitHub Pages app on each phone
   or laptop and install it. This caches the app before the device joins the
   ESP32's no-internet Wi-Fi network.
2. Power the ESP32 and connect each device to `SchoolHeat` using the private
   password configured in `AP_PASSWORD`. A "No internet" warning is expected.
3. Open the installed app, go to **Monitor**, choose the sensor's school
   location, and tap **Auto-Read ESP32**. Approve local-network access when
   asked. The first sync sets the ESP32 clock and takes an immediate sample;
   the ESP32 then continues sampling every five minutes.
4. Leave Auto-Read running while the device is connected. Each browser stores
   its own synced readings and keeps its own sync position. The ESP32 retains
   readings for other team devices; when its 192 KiB log fills, it rotates out
   the oldest readings to keep collecting.

There is no RTC module in this setup. Keep the ESP32 powered while the laptop is
off. If the ESP32 itself loses power, it cannot take readings during that
outage; after it restarts, the laptop must reconnect to set its clock. Any
backlog from a reboot that was never time-synchronized is retained on the
ESP32 and is not imported with invented timestamps. Wi-Fi push alerts still
require the separate Firebase setup below and do not work while the laptop is
off.

Direct browser-to-ESP32 access requires a browser that permits a secure GitHub
Pages app to request the ESP32's local HTTP address. Browser support and
permission prompts vary; if the request is blocked, try the latest Chrome or
Edge. The ESP32 API is intended only for clients connected to its password-
protected access point. Do not connect the ESP32 API to a public network.

SchoolHeat can send Danger/Extreme notifications to subscribed browsers over the
internet. This is **not SMS**: a phone number or SIM is not needed, but the
receiving phone must have Wi-Fi or mobile data. Firebase Cloud Messaging does
not charge per notification. Deploying the sending Cloud Function requires a
Firebase billing-enabled (Blaze) project, so Google Cloud usage may be billed;
review Firebase pricing and configure budget alerts before deployment.

## Requirements

- A Firebase project configured in `cloud_config.js`.
- A public HTTPS hosting domain for SchoolHeat.
- Node.js 22 and the Firebase CLI.
- A Firebase App Check reCAPTCHA Enterprise site key and an FCM Web Push
  certificate key.
- Firebase Anonymous Authentication enabled.
- A billing-enabled Firebase plan to deploy the Cloud Function.

## Configure and deploy

1. In Firebase Console, enable **Authentication → Sign-in method → Anonymous**.
2. In **App Check**, register the web app with reCAPTCHA Enterprise and add the
   HTTPS hosting domain. Put the public site key in `appCheckSiteKey` in
   `cloud_config.js`.
3. In **Project settings → Cloud Messaging → Web configuration**, generate or
   copy the Web Push certificate key pair. Put the public key in `vapidKey` in
   `cloud_config.js`. Do not put a private key in the web app.
4. Check Firebase pricing and enable billing if you accept the possible backend
   charges. From the project root, run:

   ```powershell
   firebase login
   firebase use schoolheat-final
   npm --prefix functions install
   firebase deploy --only functions
   ```

5. Deploy the web app to the configured HTTPS domain. On the laptop running
   SchoolHeat and on every phone that should receive alerts, open the app on a
   supported browser, go to **Settings**, enable **Phone Push Alerts**, and
   allow browser notifications. Use **Send Test Phone Push** to check delivery.

The laptop running SchoolHeat must be online and have Phone Push Alerts
enabled to send sensor warnings. The receiving phone must be online to receive
them. If it is offline, delivery is delayed or may expire; immediate offline
delivery is not possible. Push is rate-limited to one notification every five
minutes across the project. Notifications are sent to devices that enabled
SchoolHeat push, not to typed phone numbers.
