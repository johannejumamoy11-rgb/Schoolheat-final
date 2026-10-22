const { randomUUID } = require("node:crypto");
const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { getMessaging } = require("firebase-admin/messaging");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

initializeApp({
  databaseURL: "https://schoolheat-final-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const PUSH_COOLDOWN_MS = 5 * 60 * 1000;
const PUSH_DEVICE_PATH = "schoolheat/pushDevices";

function requireSignedIn(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "SchoolHeat sign-in is required.");
  }
}

function getCallableOptions() {
  return {
    region: "asia-southeast1",
    enforceAppCheck: true,
    timeoutSeconds: 30
  };
}

exports.registerPushDevice = onCall(getCallableOptions(), async request => {
  requireSignedIn(request);
  const token = typeof request.data?.token === "string" ? request.data.token.trim() : "";
  if (token.length < 20 || token.length > 4096) {
    throw new HttpsError("invalid-argument", "The browser push token is invalid.");
  }

  await getDatabase().ref(PUSH_DEVICE_PATH).child(request.auth.uid).set({
    token,
    updatedAt: Date.now()
  });
  return { registered: true };
});

exports.unregisterPushDevice = onCall(getCallableOptions(), async request => {
  requireSignedIn(request);
  await getDatabase().ref(PUSH_DEVICE_PATH).child(request.auth.uid).remove();
  return { unregistered: true };
});

function calculateHeatIndex(tempC, humidity) {
  if (tempC < 26.67) return tempC;
  const fahrenheit = tempC * 9 / 5 + 32;
  const heatIndexF =
    -42.379 +
    2.04901523 * fahrenheit +
    10.14333127 * humidity -
    0.22475541 * fahrenheit * humidity -
    0.00683783 * fahrenheit ** 2 -
    0.05481717 * humidity ** 2 +
    0.00122874 * fahrenheit ** 2 * humidity +
    0.00085282 * fahrenheit * humidity ** 2 -
    0.00000199 * fahrenheit ** 2 * humidity ** 2;
  return Math.max(tempC, (heatIndexF - 32) * 5 / 9);
}

async function reservePushSlot() {
  const now = Date.now();
  const requestId = randomUUID();
  const ref = getDatabase().ref("schoolheat/pushRateLimit");
  const result = await ref.transaction(current => {
    const lastRequest = Number(current?.timestamp);
    if (Number.isFinite(lastRequest) && now - lastRequest < PUSH_COOLDOWN_MS) return;
    return { timestamp: now, requestId };
  });
  if (!result.committed) {
    throw new HttpsError("resource-exhausted", "Phone push is limited to one alert every five minutes.");
  }
  return { ref, requestId };
}

async function clearPushSlot(ref, requestId) {
  await ref.transaction(current => current?.requestId === requestId ? null : undefined);
}

exports.sendHeatAlert = onCall(getCallableOptions(), async request => {
  requireSignedIn(request);

  const test = request.data?.test === true;
  let title;
  let body;
  let status = "TEST";
  if (test) {
    title = "SchoolHeat test notification";
    body = "Phone push notifications are connected.";
  } else {
    const location = typeof request.data?.location === "string" ? request.data.location.trim() : "";
    const temp = Number(request.data?.temperature);
    const humidity = Number(request.data?.humidity);
    if (!location || location.length > 120 || !Number.isFinite(temp) || temp < 0 || temp > 60 ||
        !Number.isFinite(humidity) || humidity < 0 || humidity > 100) {
      throw new HttpsError("invalid-argument", "The sensor reading is invalid.");
    }

    const heatIndex = calculateHeatIndex(temp, humidity);
    if (heatIndex < 33) {
      throw new HttpsError("failed-precondition", "Phone push alerts are sent only for Danger or Extreme heat.");
    }
    status = heatIndex >= 42 ? "EXTREME" : "DANGER";
    title = `SchoolHeat ${status} heat warning`;
    body = `${location}: ${temp.toFixed(1)}°C, humidity ${humidity.toFixed(1)}%, heat index ${heatIndex.toFixed(1)}°C.`;
  }

  const devicesSnapshot = await getDatabase().ref(PUSH_DEVICE_PATH).get();
  const devices = devicesSnapshot.val() || {};
  const recipients = Object.entries(devices)
    .filter(([, device]) => typeof device?.token === "string" && device.token.length >= 20)
    .map(([uid, device]) => ({ uid, token: device.token }));
  if (!devices[request.auth.uid]) {
    throw new HttpsError("permission-denied", "Enable Phone Push Alerts on the sending device first.");
  }
  if (!recipients.length) {
    return { sent: 0, failed: 0 };
  }

  const slot = await reservePushSlot();
  let sent = 0;
  let failed = 0;
  try {
    for (let offset = 0; offset < recipients.length; offset += 500) {
      const batch = recipients.slice(offset, offset + 500);
      const result = await getMessaging().sendEachForMulticast({
        tokens: batch.map(device => device.token),
        notification: { title, body },
        data: { type: "schoolheat-heat-alert", status },
        webpush: {
          notification: {
            icon: "/assets/app-logo.png",
            tag: "schoolheat-heat-alert",
            renotify: true
          }
        }
      });
      sent += result.successCount;
      failed += result.failureCount;

      const staleTokens = result.responses
        .map((response, index) => ({ response, device: batch[index] }))
        .filter(({ response }) => {
          const code = response.error?.code;
          return code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token";
        });
      await Promise.all(staleTokens.map(async ({ device }) => {
        const ref = getDatabase().ref(PUSH_DEVICE_PATH).child(device.uid);
        const current = await ref.get();
        if (current.val()?.token === device.token) await ref.remove();
      }));
    }
  } catch (error) {
    await clearPushSlot(slot.ref, slot.requestId);
    logger.error("SchoolHeat push request failed", { code: error.code || "unknown" });
    throw new HttpsError("unavailable", "The push service could not accept the notification.");
  }

  logger.info("SchoolHeat push submitted", { status, sent, failed });
  return { sent, failed };
});
