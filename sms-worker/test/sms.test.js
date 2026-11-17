import assert from "node:assert/strict";
import test from "node:test";
import worker, { createMessage, normalizeNumbers, SmsRateLimiter } from "../src/index.js";

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
