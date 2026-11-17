# SchoolHeat — ESP32 local logging and phone push setup

## Install SchoolHeat and use it offline

SchoolHeat is a Progressive Web App (PWA). Publish it on an HTTPS host such as
GitHub Pages, open it online once on each device, then use the browser's
**Install app** or **Add to Home Screen** option. The app shell is cached for
offline startup. Readings and settings are saved in that browser's local
storage, so each device has its own local copy; offline changes do not
automatically sync between devices.

In **History**, choose a `.csv` or `.xlsx` file to import readings. Include
timestamp (or date), temperature, and humidity columns; location is optional
and defaults to the selected monitor location. The SchoolHeat CSV export
format is also supported. Imported records are saved in this browser's local
history and are available to the 30-minute forecast. The forecast needs enough
same-location readings spanning about two hours; files with more than 5,000
data rows are truncated, and invalid rows are skipped. Use the trash button
beside any History entry to delete that reading from this browser; the
forecast updates to use the remaining readings.

Forecast validation compares up to 30 non-overlapping, time-ordered holdouts
and does not select a best model until at least 10 are available. It compares
Multiple Linear Regression, Random Forest, custom XGBoost-style and
LightGBM-style tree models, linear Support Vector Regression, and a persistence
baseline. All forecast models are custom JavaScript implementations. The
XGBoost/LightGBM labels describe the custom tree-building styles, not the
official libraries; SVR uses a linear kernel.
Validation reports MAE, RMSE, MAPE, R², and how often an actual Hinga-or-Hinto
heat index (33°C or higher) is predicted below that threshold. MAPE omits
holdouts with an actual value of zero, for which percentage error is undefined.
App-generated demo readings are excluded from both forecast training and
validation. Imported files are not independently verified, so use readings
from the ESP32 or another trusted measurement source before drawing conclusions
about accuracy. SchoolHeat CSV exports preserve the demo marker when
re-imported. Older saved demo readings without the demo marker cannot be
identified automatically; clear pre-existing demo history before using its
validation metrics.

The dashboard uses the DepEd 4H labels: Hayo (<27°C), Hinay (27–32°C), Hinga
(33–41°C), and Hinto (42°C or higher). The 29 existing campus sites remain
mapped; Einstein, Newton, and Locke classrooms are additional Monitor location
choices and are not shown as map pins because verified coordinates were not
provided.

The dashboard marks the latest saved reading **RECENT** for up to 15 minutes,
then **STALE**; it also flags missing or invalid timestamps. Freshness is based
on the reading timestamp, not a sensor connection, and a recent label does not
confirm sensor calibration. The response guide provides general prompts for
each 4H level; follow school policy and local advisories.

Offline mode does not provide internet services: Firebase sync and phone push
alerts need internet. For sensor readings, install the published GitHub Pages
app and open it online once so its shell is cached. Wi-Fi sync uses the
ESP32's configured `DEVICE_NAME` network, the local bridge
script, and **Auto-Read ESP32**.
Alternatively, **Sync via Bluetooth** connects from a Web Bluetooth-capable
desktop browser directly to the ESP32; it does not require joining the ESP32
Wi-Fi or running the bridge. Both methods import readings into that browser's
local history. Readings are not automatically shared between devices.
Set `DEVICE_NAME` to a different name (1–32 characters) before uploading to
each ESP32; that name is used for both Wi-Fi and Bluetooth. The app keeps each
board's readings separate by its chip ID.

## ESP32 + DHT22 local Wi-Fi logging

The ESP32 takes a sample as soon as it starts, even before a location or clock
has been set, then takes another sample every five minutes measured from
startup (for example, power-on at 8:01 means samples at about 8:01, 8:06, and
8:11). Syncing the clock does not reset this interval. Readings are kept in
onboard flash; a later sync assigns the selected location and reconstructs
timestamps for readings from the current powered session.
Auto-Read triggers an immediate sample when started, then imports new readings
over the ESP32's own Wi-Fi. This local setup does not require Firebase or
internet access for sensor readings. It does not send alerts to off-site
phones while the ESP32 is offline.

### Hardware and firmware

1. Connect the three-pin DHT22 module according to its printed labels:
   **VCC → ESP32 3V3**, **DATA → GPIO 4**, and **GND → GND**. Do not connect
   the sensor data pin to 5 V.
2. In `schoolheat-esp32.ino`, set `AP_PASSWORD` to a private Wi-Fi password of
   at least 8 characters. Do not commit the real password to GitHub. The bridge
   uses the password-protected ESP32 access point; no API token is needed.
3. In Arduino IDE, select an ESP32 WROOM development board and install
   **DHT sensor library** by Adafruit, **Adafruit Unified Sensor**, and
   **ArduinoJson**. Upload `schoolheat-esp32.ino` at 115200 baud. Open Serial
   Monitor at 115200 baud. The ESP32 prints the configured `DEVICE_NAME` for
   Wi-Fi and Bluetooth; its API is normally at `192.168.4.1`.
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

### Auto-Read through the laptop bridge

1. On the Windows laptop, while online, open the published app once to cache
   its files. Download or copy `start-local-bridge.ps1` to that laptop.
2. Power the assigned ESP32, connect the laptop to its
   configured `DEVICE_NAME` network using the private `AP_PASSWORD`, and run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\start-local-bridge.ps1
   ```

   At the hidden prompt, enter the Semaphore API key to enable SMS, or leave
   it blank if you only need sensor sync. The key stays in memory and is not
   saved.
3. Keep the PowerShell window open. In the GitHub Pages app, go to **Monitor**,
   select the sensor location, and click **Auto-Read ESP32**. The first sync
   sets the ESP32 clock and requests an immediate sample; after that, the ESP32
   continues sampling every five minutes.
4. The bridge runs only on localhost and only accepts this project's GitHub
   Pages origin. Each browser stores its own sync position and readings. The
   ESP32 keeps a rolling log and rotates out its oldest records when full.

### Sync via Bluetooth without the bridge

1. Upload the same updated firmware to each assigned ESP32. Each advertises
   using its configured **DEVICE_NAME** while continuing to sample every five minutes
   and save readings to its own flash.
2. Open the HTTPS GitHub Pages app in desktop Edge or Chrome. Go to **Monitor**,
   choose the sensor location, and click **Sync via Bluetooth**.
3. Select the matching **DEVICE_NAME** in the browser's Bluetooth
   prompt. Keep the
   laptop within Bluetooth range while the app imports readings. This sync
   only transfers saved data; it does not trigger a sample. You do not need to
   connect the laptop to the ESP32 Wi-Fi. The sync status reports whether the
   latest DHT22 read worked and whether its sample was saved.
4. The app saves imported readings in the current browser's local history and
   deduplicates them by ESP32 ID. The ESP32 continues logging when the laptop is
   off, provided the ESP32 stays powered; those readings are imported the next
   time Bluetooth sync completes.

   Bluetooth sync rescans the ESP32's stored log and deduplicates readings already
   in this browser, so records previously skipped before timestamp repair can be
   imported on a later sync.

Bluetooth sync requires Web Bluetooth support and a secure app context; use
the published HTTPS site for the supported workflow. Browser behavior for
opening `index.html` directly as a file can vary. Bluetooth access is granted
by the browser and is not protected by the Wi-Fi password; only use it in a
trusted environment. A device reboot without the app connected can leave
readings without reliable timestamps because this setup has no real-time
clock.

There is no RTC module in this setup. Keep the ESP32 powered while the laptop is
off. If the ESP32 itself loses power, it cannot take readings during that
outage; after it restarts, the laptop must reconnect to set its clock. Any
backlog from a reboot that was never time-synchronized is retained on the
ESP32 and is not imported with invented timestamps. Phone push and SMS need
internet and do not work while the laptop is off. SMS uses the hosted
Cloudflare Worker and Semaphore; it does not use the local ESP32 bridge or
Firebase Functions.

The browser cannot directly fetch the ESP32's HTTP API from GitHub Pages HTTPS
in browsers that block mixed content. Use the local bridge for Wi-Fi sync or
Bluetooth sync to avoid that HTTP request. Keep the ESP32 API on its
password-protected access point; do not connect it to a public network.

SchoolHeat supports browser push and optional Semaphore SMS for Hinga/Hinto
heat alerts. SMS is disabled by default. In **Settings**, enter up to five
Philippine mobile numbers and enable **SMS Alerts (Semaphore)** to send text
alerts. Numbers are saved in that browser's local settings and sent through
the Cloudflare Worker only when an SMS alert is requested; only enter numbers
with their owners' consent. Alerts are generated when a new reading enters
Hinga/Hinto or changes between those levels. The Worker verifies Firebase
Anonymous Auth and App Check tokens, keeps the Semaphore API key in a Cloudflare
secret, and allows one SMS request every five minutes per account, including
test messages. No local bridge is needed for SMS (the bridge remains optional
for ESP32 Wi-Fi sync).

The app's cached offline shell does not make Semaphore available offline:
Semaphore needs internet to deliver messages. If internet is unavailable, up
to 20 pending SMS are saved in this browser and retried when the app is online
again. The browser must remain open for automatic retries; if it closes, the
queue is retried the next time the app opens online. Queued phone numbers and
message details remain in this browser's local storage until sent; clearing
the browser's site data deletes them. The Worker caches successful results for
an SMS request ID so a lost response does not cause a second send. A failure
while Semaphore is processing the request can still leave delivery uncertain;
check Semaphore's message history before manually resending. For a no-modem
setup, keep the laptop on its normal internet connection and sync readings
over Bluetooth. If using ESP32 Wi-Fi sync, the laptop needs a separate internet
connection at the same time (for example, wired Ethernet). The ESP32 access
point itself does not provide internet.

Semaphore currently lists outbound SMS at PHP 0.56 per text before VAT (about
PHP 0.63 including 12% VAT), billed per recipient and per message segment.
For example, one one-segment alert per day is approximately PHP 19/month for
one recipient or PHP 94/month for five recipients. Longer messages may use
multiple segments. Check [Semaphore's current pricing](https://semaphore.co)
before purchasing credits. Test SMS messages also use credits.

Push does not use Semaphore credits; receiving phones need Wi-Fi or mobile
data. Firebase Cloud Functions are used for phone push only. Deploying them
requires a Firebase billing-enabled (Blaze) project, and Google Cloud usage
may be billed. SMS needs Firebase Anonymous Auth and App Check, but does not
require enabling Blaze or deploying a Firebase Cloud Function. Cloudflare
Worker and Durable Object usage is subject to Cloudflare's plan and limits;
check current pricing and quotas.

## Requirements

- A public HTTPS hosting domain for SchoolHeat.
- A Semaphore account with credits and an API key if using SMS alerts.
- For SMS: a Cloudflare account, Node.js/npm, a Firebase project configured in
  `cloud_config.js`, Firebase Anonymous Auth, and Firebase App Check.
- For phone push only: the Firebase CLI, an FCM Web Push certificate key, and
  a billing-enabled Firebase plan for deploying Cloud Functions.

## Configure and deploy

Firebase Anonymous Auth and App Check are used by both SMS and phone push.
The Firebase Cloud Functions steps below are only required for phone push;
SMS uses the hosted Cloudflare Worker and does not require Firebase Functions
or Firebase Blaze billing.

1. In Firebase Console, enable **Authentication → Sign-in method → Anonymous**.
2. In **App Check**, register the web app with reCAPTCHA Enterprise and add the
   HTTPS hosting domain. Put the public site key in `appCheckSiteKey` in
   `cloud_config.js`.
3. In **Project settings → Cloud Messaging → Web configuration**, generate or
   copy the Web Push certificate key pair. Put the public key in `vapidKey` in
   `cloud_config.js` if using phone push. Do not put a private key in the web
   app.
4. For phone push only, check Firebase pricing and enable billing if you
   accept the possible charges. From the project root, run:

   ```powershell
   firebase login
   firebase use schoolheat-final
   npm --prefix functions install
   ```

5. Deploy only the push functions if using phone push:

   ```powershell
   firebase deploy --only functions:registerPushDevice,functions:unregisterPushDevice,functions:sendHeatAlert
   ```

6. Deploy the SMS Worker. From the project root, run:

   ```powershell
   cd .\sms-worker
   npm install
   npm test
   npx wrangler login
   npm run deploy
   npx wrangler secret put SEMAPHORE_API_KEY
   ```

   Enter the Semaphore API key only at Wrangler's secret prompt. After deploy,
   copy the Worker URL printed by Wrangler into `smsWorkerUrl` in
   `cloud_config.js`, then publish the updated website. Do not put the API key
   in `cloud_config.js` or browser code. Check Cloudflare's current limits and
   pricing for Workers and Durable Objects before deployment.

7. Deploy the web app to the configured HTTPS domain. In **Settings**, enter
   recipient numbers and enable **SMS Alerts (Semaphore)**. Use **Send Test
   SMS** only when ready to spend credits. To use push, enable **Phone Push
   Alerts** on the laptop running SchoolHeat and on each receiving phone, allow
   browser notifications, and use **Send Test Phone Push**.

The device running SchoolHeat must be on to process new sensor readings and
send alerts. SMS needs internet and Semaphore credits; up to 20 alerts are
queued in the browser while offline and retried after connectivity returns.
SMS is rate-limited to one request every five minutes per Firebase account.
Push recipients need internet to receive notifications, and phone push is limited
to one request every five minutes across the project. Push is sent to devices
that enabled SchoolHeat push; SMS is sent to the numbers entered in that
browser's Settings.
