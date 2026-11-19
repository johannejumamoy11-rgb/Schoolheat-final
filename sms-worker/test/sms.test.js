import assert from "node:assert/strict";
import test from "node:test";
import worker, { createMessage, normalizeNumbers, sendSms, SmsRateLimiter } from "../src/index.js";

test("normalizes Philippine mobile numbers and removes duplicates", () => {
  assert.deepEqual(
    normalizeNumbers(["09 123-456-789", "+639876543210", "639123456789"]),
    ["639123456789", "639876543210"]
  );
});

test("rejects invalid recipient lists", () => {
  assert.throws(() => normalizeNumbers([]), /one and five/);
  assert.throws(() => normalizeNumbers(["12345"]), /Philippine mobile/);
});

const cloudSmsCredentials = {
  CLOUDSMS_API_KEY: "csk_test-key",
  CLOUDSMS_API_SECRET: "css_test-secret"
};
const cloudSmsAcceptedResponse = number => new Response(JSON.stringify({
  success: true,
  data: {
    message_id: "msg_test",
    status: "CREATED",
    destinations: [{ destination: number, status: "CREATED" }]
  }
}), { status: 201 });

test("reports retryable CLOUDSMS status and enforces the five-minute retry limit", async () => {
  const result = await sendSms(
    cloudSmsCredentials,
    ["639123456789"],
    "test message",
    "request-one",
    async () => new Response("temporarily unavailable", {
      status: 429,
      headers: { "Retry-After": "42" }
    })
  );
  assert.equal(result.status, 503);
  assert.deepEqual(result.body, {
    error: "CLOUDSMS is temporarily unavailable; the alert can be retried.",
    providerStatus: 429,
    retryAfterSeconds: 300
  });
  assert.equal(JSON.stringify(result).includes("test-secret"), false);
});

test("sends each SMS through CLOUDSMS with Basic auth and stable idempotency keys", async () => {
  const captured = [];
  const result = await sendSms(
    cloudSmsCredentials,
    ["639123456789", "639987654321"],
    "test message",
    "request-one",
    async (url, options) => {
      captured.push({ url, options });
      const body = JSON.parse(options.body);
      return cloudSmsAcceptedResponse(body.destination);
    }
  );
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { sent: 2, failed: 0, queued: true });
  assert.equal(captured.length, 2);
  for (const [index, request] of captured.entries()) {
    assert.equal(request.url, "https://api.cloudsms.io/v1/sms/send");
    assert.equal(request.options.method, "POST");
    assert.equal(request.options.headers["Content-Type"], "application/json");
    assert.equal(
      request.options.headers.Authorization,
      `Basic ${btoa("csk_test-key:css_test-secret")}`
    );
    assert.equal(request.options.headers["X-Idempotency-Key"], `request-one-${index}`);
  }
  assert.deepEqual(
    captured.map(request => JSON.parse(request.options.body)),
    [
      { destination: "639123456789", message: "test message" },
      { destination: "639987654321", message: "test message" }
    ]
  );
  assert.equal(JSON.stringify(result).includes("csk_test-key"), false);
  assert.equal(JSON.stringify(result).includes("css_test-secret"), false);
});

test("trims CLOUDSMS credentials before sending", async () => {
  let captured;
  await sendSms(
    {
      CLOUDSMS_API_KEY: "  csk_test-key  ",
      CLOUDSMS_API_SECRET: " css_test-secret "
    },
    ["639123456789"],
    "test message",
    "request-one",
    async (url, options) => {
      captured = { url, options };
      return cloudSmsAcceptedResponse(JSON.parse(options.body).destination);
    }
  );
  assert.equal(
    captured.options.headers.Authorization,
    `Basic ${btoa("csk_test-key:css_test-secret")}`
  );
});

test("requires both CLOUDSMS API credentials", async () => {
  await assert.rejects(
    sendSms(
      { CLOUDSMS_API_KEY: "csk_test-key", CLOUDSMS_API_SECRET: "   " },
      ["639123456789"],
      "test message",
      "request-one"
    ),
    /CLOUDSMS is not configured/
  );
});

test("reports partial CLOUDSMS acceptance without retrying accepted recipients", async () => {
  let requestIndex = 0;
  const result = await sendSms(
    cloudSmsCredentials,
    ["639123456789", "639987654321"],
    "test message",
    "request-one",
    async () => {
      requestIndex += 1;
      return requestIndex === 1
        ? cloudSmsAcceptedResponse("639123456789")
        : new Response("rejected", { status: 422 });
    }
  );
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { sent: 1, failed: 1, queued: true });
});

test("does not automatically retry when CLOUDSMS acceptance is uncertain", async () => {
  const result = await sendSms(
    cloudSmsCredentials,
    ["639123456789"],
    "test message",
    "request-one",
    async () => new Response("unreadable response", { status: 200 })
  );
  assert.equal(result.status, 409);
  assert.match(result.body.error, /Check CLOUDSMS message activity before retrying/);
});

test("does not report acceptance for an unmatched destination response", async () => {
  const result = await sendSms(
    cloudSmsCredentials,
    ["639123456789"],
    "test message",
    "request-one",
    async () => new Response(JSON.stringify({
      success: true,
      data: {
        message_id: "msg_test",
        status: "CREATED",
        destinations: [{ destination: "639987654321", status: "CREATED" }]
      }
    }), { status: 201 })
  );
  assert.equal(result.status, 409);
});


test("rejects SMS requests without Firebase Auth and App Check", async () => {
  const response = await worker.fetch(new Request("https://sms.example/bridge/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://johannejumamoy11-rgb.github.io"
    },
    body: JSON.stringify({ test: true, numbers: ["09123456789"] })
  }), {});
  assert.equal(response.status, 401);
});

test("creates a heat alert with the original reading time", () => {
  const message = createMessage({
    location: "Guard House",
    temperature: 40,
    humidity: 70,
    timestamp: "2026-05-01T10:00:00Z"
  });
  assert.match(message, /^SchoolHeat Hinto warning at Guard House:/);
  assert.match(message, /reading/);
});

test("does not create SMS for readings below the heat-alert threshold", () => {
  assert.throws(() => createMessage({
    location: "Guard House",
    temperature: 20,
    humidity: 40,
    timestamp: "2026-05-01T10:00:00Z"
  }), /only for Hinga or Hinto/);
});

test("rate-limits repeated SMS requests for one account", async () => {
  const stored = {};
  const state = {
    storage: {
      get: async key => stored[key],
      put: async (key, value) => { stored[key] = value; },
      delete: async key => { delete stored[key]; }
    }
  };
  const limiter = new SmsRateLimiter(state);

  const createRequest = requestId => new Request("https://sms-rate-limit/check", {
    method: "POST",
    body: JSON.stringify({ action: "reserve", requestId })
  });
  const first = await (await limiter.fetch(createRequest("request-one"))).json();
  const second = await (await limiter.fetch(createRequest("request-two"))).json();
  assert.equal(first.allowed, true);
  assert.equal(second.allowed, false);
  assert.ok(second.retryAfterSeconds > 0);
});

test("returns a cached result when a sent SMS request is retried", async () => {
  let stored = {};
  const state = {
    storage: {
      get: async key => stored[key],
      put: async (key, value) => {
        if (typeof key === "object") Object.assign(stored, key);
        else stored[key] = value;
      },
      delete: async key => { delete stored[key]; }
    }
  };
  const limiter = new SmsRateLimiter(state);
  const request = body => new Request("https://sms-rate-limit/check", {
    method: "POST",
    body: JSON.stringify(body)
  });
  await limiter.fetch(request({ action: "reserve", requestId: "request-one" }));
  const result = { status: 200, body: { sent: 1, failed: 0 } };
  await limiter.fetch(request({
    action: "complete",
    requestId: "request-one",
    response: result
  }));
  const retry = await (await limiter.fetch(
    request({ action: "reserve", requestId: "request-one" })
  )).json();
  assert.deepEqual(retry.cached, result);
});
