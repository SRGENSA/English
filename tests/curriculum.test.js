import { test } from "node:test";
import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { courses, courseQuestions } from "../src/courses.js";
test("every original bilingual lesson has examples, corrected mistakes and two valid questions", () => {
  assert.equal(courses.length, 12);
  assert.equal(courseQuestions.length, 24);
  for (const c of courses) {
    assert.ok(c.explanation.ar.length > 70);
    assert.ok(c.explanation.en.length > 70);
    assert.equal(c.examples.length, 3);
    assert.notEqual(...c.mistake);
    for (const q of courseQuestions.filter((q) => q.lesson === c.id)) {
      assert.equal(q.options.length, 4);
      assert.ok(q.answer >= 0 && q.answer < 4);
    }
  }
});
test("all twelve original video lessons and posters are present", () => {
  const videos = courses.filter((c) => c.video);
  assert.equal(videos.length, 12);
  for (const c of videos) {
    assert.ok(statSync(`public/lessons/${c.id}.mp4`).size > 1000);
    assert.ok(statSync(`public/lessons/${c.id}-poster.png`).size > 1000);
  }
});
