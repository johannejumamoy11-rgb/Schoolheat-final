# SchoolHeat — phone push alert setup

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
- A Firebase App Check reCAPTCHA v3 site key and an FCM Web Push certificate key.
- Firebase Anonymous Authentication enabled.
- A billing-enabled Firebase plan to deploy the Cloud Function.

## Configure and deploy

1. In Firebase Console, enable **Authentication → Sign-in method → Anonymous**.
2. In **App Check**, register the web app using reCAPTCHA v3 and add the HTTPS
   hosting domain. Put the public site key in `appCheckSiteKey` in
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

5. Deploy the web app to the configured HTTPS domain. On the Arduino-connected
   laptop and on every phone that should receive alerts, open SchoolHeat on a
   supported browser, go to **Settings**, enable **Phone Push Alerts**, and
   allow browser notifications. Use **Send Test Phone Push** to check delivery.

The laptop that reads the Arduino must be online and have Phone Push Alerts
enabled to send sensor warnings. The receiving phone must be online to receive
them. If it is offline, delivery is delayed or may expire; immediate offline
delivery is not possible. Push is rate-limited to one notification every five
minutes across the project. Notifications are sent to devices that enabled
SchoolHeat push, not to typed phone numbers.
