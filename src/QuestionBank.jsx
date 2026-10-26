import React, { useState } from "react";
import { bankTopics, BANK_SIZE } from "./questionBank";
import { getLanguage } from "./i18n/core";
export default function QuestionBank({ start }) {
  const en = getLanguage() === "en",
    [level, setLevel] = useState("all"),
    [topic, setTopic] = useState("all");
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{en ? "Grammar practice bank" : "بنك تدريب القواعد"}</h1>
          <p>
            {en
              ? "100,000 compositional drills across eight grammar topics. These are generated variations, not 100,000 independently reviewed exam questions."
              : "١٠٠ ألف تدريب تركيبي في ثمانية موضوعات قواعد. هذه تنويعات مولّدة، وليست ١٠٠ ألف سؤال امتحاني مستقل ومراجع."}
          </p>
        </div>
      </div>
      <section className="course-article">
        <h2>
          {en ? "Build a focused practice session" : "جهّز جلسة تناسب مستواك"}
        </h2>
        <div className="tutor-options">
          <label>
            {en ? "Difficulty" : "الصعوبة"}
            <select
              aria-label={en ? "Difficulty" : "الصعوبة"}
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                setTopic("all");
              }}
            >
              {[
                ["all", "كل المستويات", "All levels"],
                ["easy", "سهل", "Easy"],
                ["medium", "متوسط", "Medium"],
                ["hard", "صعب", "Hard"],
              ].map(([id, ar, enText]) => (
                <option key={id} value={id}>
                  {en ? enText : ar}
                </option>
              ))}
            </select>
          </label>
          <label>
            {en ? "Topic" : "الموضوع"}
            <select
              aria-label={en ? "Topic" : "الموضوع"}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              <option value="all">{en ? "All topics" : "كل الموضوعات"}</option>
              {bankTopics
                .filter((t) => level === "all" || t[3] === level)
                .map((t) => (
                  <option key={t[0]} value={t[0]}>
                    {t[en ? 2 : 1]}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <p className="course-intro">
          {en
            ? "Ten questions per session, with an explanation after each answer. Your result is saved to your practice history."
            : "عشرة أسئلة في الجلسة، مع شرح بعد كل إجابة وحفظ النتيجة في سجل التدريب."}
        </p>
        <button
          className="primary-button"
          onClick={() => start(`bank:${level}:${topic}`)}
        >
          {en ? "Start 10-question session" : "ابدأ جلسة من ١٠ أسئلة"}
        </button>
        <a className="text-button" href="/generated-bank.ndjson.gz" download>
          {en
            ? "Download the generated bank (gzip NDJSON)"
            : "تحميل البنك المولّد (gzip NDJSON)"}
        </a>
        <p className="footnote">
          {en
            ? "Difficulty indicates the grammar pattern, not an official CEFR or STEP calibration. The authored lesson and mixed-skill question sets remain separate."
            : "الصعوبة تصنيف للقاعدة، وليست معايرة رسمية لـCEFR أو STEP. أسئلة الدروس المؤلفة والتدريبات متعددة المهارات منفصلة عن هذا البنك."}
        </p>
      </section>
    </>
  );
}
