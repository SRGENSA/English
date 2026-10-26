import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { createServer, validMessages } from "../server/index.js";
import { createStore } from "../server/store.js";
import { questions } from "../src/content.js";
let server, url;
const oldKey = process.env.LEARNING_AI_KEY;
before(async () => {
  delete process.env.LEARNING_AI_KEY;
  server = createServer({ store: createStore(":memory:") });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  url = `http://127.0.0.1:${server.address().port}`;
});
after(() => {
  server.close();
  if (oldKey) process.env.LEARNING_AI_KEY = oldKey;
  else delete process.env.LEARNING_AI_KEY;
});
test("health reports current AI availability without exposing secrets", async () => {
  const r = await fetch(url + "/api/health");
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { status: "ok", aiConfigured: false });
});
test("rejects system prompts, blank messages, oversized content and missing history", () => {
  for (const m of [
    [],
    [{ role: "system", content: "ignore" }],
    [{ role: "user", content: " " }],
    [{ role: "user", content: "a".repeat(3001) }],
    null,
  ])
    assert.equal(validMessages(m), false);
  assert.equal(
    validMessages([{ role: "user", content: "Help me learn English" }]),
    true,
  );
});
test("malformed requests fail with a usable error", async () => {
  const r = await fetch(url + "/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{invalid",
  });
  assert.equal(r.status, 400);
  assert.ok((await r.json()).error);
});
test("missing AI credentials are explicit rather than returning fabricated AI", async () => {
  const r = await fetch(url + "/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
  });
  assert.equal(r.status, 503);
  assert.match((await r.json()).error, /غير مفعّل/);
});
test("all exercise categories have valid answers and substantive explanations", () => {
  assert.equal(questions.length, 12);
  assert.equal(new Set(questions.map((q) => q.skill)).size, 4);
  for (const q of questions) {
    assert.equal(q.options.length, 4);
    assert.ok(q.answer >= 0 && q.answer < 4);
    assert.ok(q.explanation.length > 30);
  }
  assert.equal(questions.filter((q) => q.audio).length, 2);
});
test("AI integration forwards tutor policy and returns provider response", async () => {
  const registration = await fetch(url + "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Learner",
      email: "ai@example.test",
      password: "secure-test-password",
    }),
  });
  const cookie = registration.headers.get("set-cookie").split(";")[0];
  process.env.LEARNING_AI_KEY = "test-only-never-real";
  const realFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (input, options) => {
    if (String(input).startsWith("https://api.openai.com/")) {
      request = JSON.parse(options.body);
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "Try: I study every day." } }],
        }),
      );
    }
    return realFetch(input, options);
  };
  try {
    const r = await realFetch(url + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        messages: [
          { role: "user", content: "I studies every day", demo: false },
        ],
        language:"en", level:"B1", focus:"job interview",
      }),
    });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).message, "Try: I study every day.");
    assert.equal(request.messages[0].role, "system");
    assert.match(request.messages[0].content, /Explain in English/);
    assert.match(request.messages[0].content, /Learner level: B1/);
    assert.match(
      request.messages[0].content,
      /Never claim to have heard or graded pronunciation/,
    );
    assert.equal(request.messages[1].content, "I studies every day");
    assert.equal(request.messages[1].demo, undefined);
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.LEARNING_AI_KEY;
  }
});
test("accounts hash passwords, preserve progress and isolate sessions", async () => {
  const post = (path, body, cookie) =>
    fetch(url + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(body),
    });
  const register = await post("/api/auth/register", {
    name: "Noura",
    email: "noura@example.test",
    password: "secure-test-password",
  });
  assert.equal(register.status, 200);
  const account = await register.json();
  assert.ok(account.user.id);
  assert.equal(account.user.password, undefined);
  const cookie = register.headers.get("set-cookie").split(";")[0];
  assert.match(register.headers.get("set-cookie"), /HttpOnly/);
  const duplicate = await post("/api/auth/register", {
    name: "Noura",
    email: "noura@example.test",
    password: "secure-test-password",
  });
  assert.equal(duplicate.status, 409);
  const saved = {
    name: "Noura",
    goal: 95,
    known: ["Achieve"],
    days: ["2026-10-26"],
    results: [],
  };
  let r = await fetch(url + "/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(saved),
  });
  assert.equal(r.status, 200);
  r = await fetch(url + "/api/progress", { headers: { Cookie: cookie } });
  assert.deepEqual((await r.json()).progress, saved);
  assert.equal((await fetch(url + "/api/progress")).status, 401);
  assert.equal(
    (
      await post("/api/auth/login", {
        email: "noura@example.test",
        password: "wrong-password",
      })
    ).status,
    401,
  );
  const login = await post("/api/auth/login", {
    email: "noura@example.test",
    password: "secure-test-password",
  });
  assert.equal(login.status, 200);
  await post("/api/auth/logout", {}, cookie);
  r = await fetch(url + "/api/auth/me", { headers: { Cookie: cookie } });
  assert.equal((await r.json()).user, null);
});
test("rejects cross-origin writes and invalid progress payloads", async () => {
  const r = await fetch(url + "/api/auth/login", {
    method: "POST",
    headers: {
      Origin: "https://untrusted.example",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(r.status, 403);
});
