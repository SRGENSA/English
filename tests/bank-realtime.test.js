import { test } from "node:test";
import assert from "node:assert/strict";
import { BANK_SIZE, bankQuestion, bankSession } from "../src/questionBank.js";
import { connectRealtime } from "../server/realtime.js";
test("100000 generated drill stems are distinct, four options and valid keys", () => {
  const seen = new Set(),
    levels = new Set();
  for (let i = 0; i < BANK_SIZE; i++) {
    const q = bankQuestion(i);
    assert.ok(!seen.has(q.prompt));
    seen.add(q.prompt);
    assert.equal(new Set(q.options).size, 4);
    assert.ok(q.answer >= 0 && q.answer < 4);
    levels.add(q.difficulty);
  }
  assert.equal(seen.size, 100000);
  assert.equal(levels.size, 3);
});
test("bank session respects difficulty and topic filters without repeats", () => {
  const q = bankSession("hard", "past-perfect", 10);
  assert.equal(q.length, 10);
  assert.equal(new Set(q.map((q) => q.id)).size, 10);
  assert.ok(
    q.every((q) => q.topic === "past-perfect" && q.difficulty === "hard"),
  );
});
test("Realtime uses multipart audio negotiation and returns SDP, not text synthesis", async () => {
  assert.equal((await connectRealtime({ sdp: "invalid" }, "test")).status, 400);
  const original = globalThis.fetch;
  let form;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/realtime/calls");
    form = options.body;
    return new Response("v=0\r\nanswer");
  };
  try {
    const r = await connectRealtime(
      { sdp: "v=0\r\noffer", language: "en", level: "B1" },
      "fake-test-key",
    );
    assert.equal(r.status, 200);
    assert.equal(form.get("sdp"), "v=0\r\noffer");
    const session = JSON.parse(form.get("session"));
    assert.equal(session.type, "realtime");
    assert.equal(session.audio.output.voice, "marin");
    assert.equal(session.audio.input.turn_detection.type, "server_vad");
  } finally {
    globalThis.fetch = original;
  }
});
