const ALLOWED_ORIGIN = "https://johannejumamoy11-rgb.github.io";
const FIREBASE_PROJECT_ID = "schoolheat-final";
const FIREBASE_PROJECT_NUMBER = "960776018094";
const FIREBASE_APP_ID = "1:960776018094:web:2d61dc050347340c86f53f";
const RATE_LIMIT_MS = 5 * 60 * 1000;
const MAX_BODY_BYTES = 16 * 1024;
const NUMBER_PATTERN = /^(?:\+?63|0)?9\d{9}$/;

const APP_CHECK_JWKS_URL = "https://firebaseappcheck.googleapis.com/v1/jwks";
const AUTH_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const jwksCache = new Map();

function corsHeaders(origin) {
  const headers = { "Vary": "Origin", "Cache-Control": "no-store" };
  if (origin === ALLOWED_ORIGIN) {
    headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Idempotency-Key, X-Firebase-AppCheck";
    headers["Access-Control-Max-Age"] = "600";
  }
  return headers;
}

function jsonResponse(origin, status, value) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
  return Uint8Array.from(atob(padded), character => character.charCodeAt(0));
}

async function getJwk(url, keyId) {
  let cached = jwksCache.get(url);
  if (!cached || cached.expiresAt <= Date.now() || !cached.keys.some(key => key.kid === keyId)) {
    let response;
    try {
      response = await fetch(url);
    } catch {
      throw new Error("Firebase signing keys are temporarily unavailable.");
    }
    if (!response.ok) throw new Error("Firebase signing keys are temporarily unavailable.");
    const data = await response.json();
    if (!Array.isArray(data.keys)) throw new Error("Firebase signing keys were invalid.");
    cached = { keys: data.keys, expiresAt: Date.now() + 6 * 60 * 60 * 1000 };
    jwksCache.set(url, cached);
  }

  const key = cached.keys.find(candidate => candidate.kid === keyId);
  if (!key) throw new Error("The Firebase token signing key was not found.");
  return key;
}

async function verifyJwt(token, jwksUrl) {
  if (typeof token !== "string" || token.length > 8192) {
    throw new Error("The Firebase token is missing or invalid.");
  }
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("The Firebase token is malformed.");

  const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
  const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
  if (header.alg !== "RS256" || header.typ !== "JWT" || typeof header.kid !== "string") {
    throw new Error("The Firebase token header is invalid.");
  }

  const jwk = await getJwk(jwksUrl, header.kid);
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const signatureIsValid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    decodeBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  );
  if (!signatureIsValid) throw new Error("The Firebase token signature is invalid.");

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(claims.exp) || claims.exp <= nowSeconds ||
      !Number.isFinite(claims.iat) || claims.iat > nowSeconds + 60 ||
      (Number.isFinite(claims.nbf) && claims.nbf > nowSeconds + 60)) {
    throw new Error("The Firebase token has expired or is not yet valid.");
  }
  return claims;
}

async function verifyFirebaseTokens(request) {
  const authorization = request.headers.get("Authorization") || "";
  const idToken = authorization.match(/^Bearer (.+)$/i)?.[1];
  const appCheckToken = request.headers.get("X-Firebase-AppCheck");
  if (!idToken || !appCheckToken) throw new Error("Firebase sign-in and App Check are required.");

  const [authClaims, appCheckClaims] = await Promise.all([
    verifyJwt(idToken, AUTH_JWKS_URL),
    verifyJwt(appCheckToken, APP_CHECK_JWKS_URL)
  ]);
  if (authClaims.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}` ||
      authClaims.aud !== FIREBASE_PROJECT_ID ||
      typeof authClaims.sub !== "string" || !authClaims.sub ||
      !Number.isFinite(authClaims.auth_time) || authClaims.auth_time > Date.now() / 1000 + 60) {
    throw new Error("Firebase sign-in is invalid.");
  }

  const appCheckAudience = Array.isArray(appCheckClaims.aud) ? appCheckClaims.aud : [appCheckClaims.aud];
  if (appCheckClaims.iss !== `https://firebaseappcheck.googleapis.com/${FIREBASE_PROJECT_NUMBER}` ||
      !appCheckAudience.includes(`projects/${FIREBASE_PROJECT_NUMBER}`) ||
      appCheckClaims.sub !== FIREBASE_APP_ID) {
    throw new Error("Firebase App Check is invalid.");
  }
  return authClaims.sub;
}

export function normalizeNumbers(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 5) {
    throw new Error("Enter between one and five SMS recipient numbers.");
  }
  const numbers = [];
  for (const item of value) {
    if (typeof item !== "string") throw new Error("An SMS recipient number is invalid.");
    const compact = item.trim().replace(/[\s()-]/g, "");
    if (!NUMBER_PATTERN.test(compact)) {
      throw new Error("Use valid Philippine mobile numbers, such as 09XXXXXXXXX or +639XXXXXXXXX.");
    }
    const digits = compact.replace(/\D/g, "");
    const normalized = digits.startsWith("63")
      ? digits
      : digits.startsWith("0")
        ? `63${digits.slice(1)}`
        : `63${digits}`;
    if (!numbers.includes(normalized)) numbers.push(normalized);
  }
  return numbers;
}

export function calculateHeatIndexC(temperature, humidity) {
  const fahrenheit = temperature * 9 / 5 + 32;
  let heatIndexF = 0.5 * (fahrenheit + 61 + (fahrenheit - 68) * 1.2 + humidity * 0.094);
  heatIndexF = 0.5 * (heatIndexF + fahrenheit);

  if (heatIndexF >= 80) {
    const fahrenheitSquared = fahrenheit * fahrenheit;
    const humiditySquared = humidity * humidity;
    heatIndexF =
      -42.379 +
      2.04901523 * fahrenheit +
      10.14333127 * humidity -
      0.22475541 * fahrenheit * humidity -
      0.00683783 * fahrenheitSquared -
      0.05481717 * humiditySquared +
      0.00122874 * fahrenheitSquared * humidity +
      0.00085282 * fahrenheit * humiditySquared -
      0.00000199 * fahrenheitSquared * humiditySquared;

    if (humidity < 13 && fahrenheit >= 80 && fahrenheit <= 112) {
      heatIndexF -= ((13 - humidity) / 4) *
        Math.sqrt((17 - Math.abs(fahrenheit - 95)) / 17);
    } else if (humidity > 85 && fahrenheit >= 80 && fahrenheit <= 87) {
      heatIndexF += ((humidity - 85) / 10) * ((87 - fahrenheit) / 5);
    }
  }
  return Math.max(temperature, (heatIndexF - 32) * 5 / 9);
}

export function createMessage(payload) {
  if (payload.test === true) return "SchoolHeat test alert: SMS setup is working.";

  const location = typeof payload.location === "string" ? payload.location.trim() : "";
  const temperature = Number(payload.temperature);
  const humidity = Number(payload.humidity);
  if (!location || location.length > 120 || !Number.isFinite(temperature) ||
      temperature < 0 || temperature > 60 || !Number.isFinite(humidity) ||
      humidity < 0 || humidity > 100) {
    throw new Error("The sensor reading is invalid.");
  }

  const heatIndex = calculateHeatIndexC(temperature, humidity);
  if (heatIndex < 33) throw new Error("SMS alerts are sent only for Hinga or Hinto heat.");
  const level = heatIndex >= 42 ? "Hinto" : "Hinga";
  const parsedTimestamp = Date.parse(payload.timestamp);
  const readingTime = Number.isFinite(parsedTimestamp) ? new Date(parsedTimestamp) : new Date();
  const timeLabel = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(readingTime);
  return `SchoolHeat ${level} warning at ${location.slice(0, 60)}: ${temperature.toFixed(1)}C, RH ${humidity.toFixed(1)}%, heat index ${heatIndex.toFixed(1)}C (reading ${timeLabel}).`;
}

async function sendSms(env, numbers, message) {
  if (!env.SEMAPHORE_API_KEY) throw new Error("Semaphore is not configured on the SMS Worker.");
  const form = new URLSearchParams({
    apikey: env.SEMAPHORE_API_KEY,
    number: numbers.join(","),
    message
  });
  let response;
  try {
    response = await fetch("https://api.semaphore.co/api/v4/messages", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form
    });
  } catch {
    return { status: 503, body: { error: "Could not reach Semaphore; the alert can be retried." } };
  }

  if (response.status === 429 || response.status >= 500) {
    return { status: 503, body: { error: "Semaphore is temporarily unavailable; the alert can be retried." } };
  }
  if (!response.ok) {
    return { status: 422, body: { error: `Semaphore rejected the request (HTTP ${response.status}). Check the API key and account credits.` } };
  }

  let records;
  try {
    const data = await response.json();
    records = Array.isArray(data) ? data : [data];
  } catch {
    return { status: 409, body: { error: "Semaphore returned an unreadable response. Check your message history before retrying." } };
  }
  const accepted = records.filter(record =>
    typeof record?.status === "string" &&
    ["queued", "pending", "sent"].includes(record.status.toLowerCase())
  ).length;
  if (accepted === 0) {
    return { status: 422, body: { error: "Semaphore did not accept the messages. Check your sender name, account credits, and recipient numbers." } };
  }
  return {
    status: 200,
    body: { sent: accepted, failed: Math.max(numbers.length - accepted, 0), queued: false }
  };
}

async function handleSms(request, env) {
  const origin = request.headers.get("Origin");
  if (origin !== ALLOWED_ORIGIN) return jsonResponse(origin, 403, { error: "This origin is not allowed." });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== "POST") return jsonResponse(origin, 405, { error: "Method not allowed." });
  if (Number(request.headers.get("Content-Length")) > MAX_BODY_BYTES) {
    return jsonResponse(origin, 413, { error: "The SMS request is too large." });
  }

  let userId;
  try {
    userId = await verifyFirebaseTokens(request);
  } catch (error) {
    if (error.message.includes("temporarily unavailable")) {
      return jsonResponse(origin, 503, { error: "Firebase token verification is temporarily unavailable." });
    }
    return jsonResponse(origin, 401, { error: "Firebase sign-in or App Check validation failed." });
  }

  let payload;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
      return jsonResponse(origin, 413, { error: "The SMS request is too large." });
    }
    payload = JSON.parse(text);
  } catch {
    return jsonResponse(origin, 400, { error: "The SMS request body must be valid JSON." });
  }

  let numbers;
  let message;
  try {
    numbers = normalizeNumbers(payload.numbers);
    message = createMessage(payload);
  } catch (error) {
    return jsonResponse(origin, 400, { error: error.message });
  }

  if (!env.SEMAPHORE_API_KEY) {
    return jsonResponse(origin, 503, { error: "Semaphore API key is not configured in the Cloudflare Worker." });
  }

  const limiterId = env.SMS_RATE_LIMITER.idFromName(userId);
  const limiter = env.SMS_RATE_LIMITER.get(limiterId);
  const requestId = request.headers.get("Idempotency-Key") || "";
  if (!/^[A-Za-z0-9._-]{8,100}$/.test(requestId)) {
    return jsonResponse(origin, 400, { error: "A valid SMS request ID is required." });
  }
  const limitResponse = await limiter.fetch("https://sms-rate-limit/check", {
    method: "POST",
    body: JSON.stringify({ action: "reserve", requestId })
  });
  if (!limitResponse.ok) {
    return jsonResponse(origin, 503, { error: "SMS rate limiting is temporarily unavailable." });
  }
  const limitResult = await limitResponse.json();
  if (limitResult.cached) {
    return jsonResponse(origin, limitResult.cached.status, limitResult.cached.body);
  }
  if (!limitResult.allowed) {
    return jsonResponse(origin, 429, {
      error: "SMS is limited to one request every five minutes for this account.",
      retryAfterSeconds: limitResult.retryAfterSeconds
    });
  }

  const result = await sendSms(env, numbers, message);
  if (result.status !== 503) {
    await limiter.fetch("https://sms-rate-limit/complete", {
      method: "POST",
      body: JSON.stringify({
        action: "complete",
        requestId,
        response: result
      })
    });
  }
  return jsonResponse(origin, result.status, result.body);
}

export default {
  async fetch(request, env) {
    return handleSms(request, env);
  }
};

export class SmsRateLimiter {
  constructor(state) {
    this.state = state;
    this.pendingCheck = Promise.resolve();
  }

  async fetch(request) {
    const body = await request.json();
    const operation = this.pendingCheck.then(async () => {
      if (body.action === "complete") {
        const lastRequestId = await this.state.storage.get("lastRequestId");
        if (lastRequestId === body.requestId) {
          await this.state.storage.put("lastResponse", body.response);
        }
        return { completed: true };
      }

      const lastRequestId = await this.state.storage.get("lastRequestId");
      const lastResponse = await this.state.storage.get("lastResponse");
      if (lastRequestId === body.requestId && lastResponse) {
        return { cached: lastResponse };
      }

      const now = Date.now();
      const lastSentAt = await this.state.storage.get("lastSentAt");
      if (Number.isFinite(lastSentAt) && now - lastSentAt < RATE_LIMIT_MS) {
        return {
          allowed: false,
          retryAfterSeconds: Math.ceil((RATE_LIMIT_MS - (now - lastSentAt)) / 1000)
        };
      }
      await this.state.storage.put("lastSentAt", now);
      await this.state.storage.put("lastRequestId", body.requestId);
      await this.state.storage.delete("lastResponse");
      return { allowed: true };
    });
    this.pendingCheck = operation.then(() => undefined, () => undefined);
    const result = await operation;
    return Response.json(result);
  }
}
