import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Play,
  Check,
  ArrowLeft,
  Volume2,
  Mic,
  Square,
  RotateCcw,
} from "lucide-react";
import { courses } from "./courses";
import { getLanguage } from "./i18n/core";
const say = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.8;
  window.speechSynthesis.speak(u);
};
export function Learning({ startQuiz, goTeacher }) {
  const [selected, setSelected] = useState(courses[0].id),
    [filter, setFilter] = useState(""),
    [completed, setCompleted] = useState(() => {
      try {
        return JSON.parse(
          localStorage.getItem("talaqa-completed-lessons") || "[]",
        );
      } catch {
        return [];
      }
    });
  const lang = getLanguage(),
    lesson = courses.find((c) => c.id === selected);
  const mark = () => {
    const next = [...new Set([...completed, selected])];
    setCompleted(next);
    try {
      localStorage.setItem("talaqa-completed-lessons", JSON.stringify(next));
    } catch {}
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            {lang === "ar"
              ? "تعلّمها، جرّبها، واستخدمها"
              : "Learn it. Practice it. Use it."}
          </h1>
          <p>
            {lang === "ar"
              ? "١٢ درسًا أصليًا، أمثلة وتصحيح أخطاء وتدريب بعد كل درس. علامات الإكمال محفوظة في هذا المتصفح."
              : "12 original lessons, examples, common mistakes and practice after each lesson. Completion marks are stored in this browser."}
          </p>
        </div>
      </div>
      <div className="curriculum-layout">
        <aside className="course-index">
          <label>
            {lang === "ar" ? "ابحث عن درس" : "Find a lesson"}
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={
                lang === "ar"
                  ? "الأزمنة، القواعد، الكلام…"
                  : "Tenses, grammar, speaking…"
              }
            />
          </label>
          {courses
            .filter((c) =>
              (c.title.ar + c.title.en)
                .toLowerCase()
                .includes(filter.toLowerCase()),
            )
            .map((c, i) => (
              <button
                key={c.id}
                className={selected === c.id ? "selected" : ""}
                onClick={() => setSelected(c.id)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{c.title[lang]}</strong>
                  <small>{c.subtitle[lang]}</small>
                </div>
                {completed.includes(c.id) && <Check size={17} />}
              </button>
            ))}
        </aside>
        <article className="course-article" key={lesson.id}>
          <div className="course-heading">
            <BookOpen />
            <h2>{lesson.title[lang]}</h2>
          </div>
          <p className="course-intro">{lesson.explanation[lang]}</p>
          <div className="grammar-formula" dir="ltr">
            {lesson.rule}
          </div>
          <h3>
            {lang === "ar" ? "القاعدة في جملة" : "See the rule in a sentence"}
          </h3>
          <div className="example-list">
            {lesson.examples.map((ex, i) => (
              <div key={ex}>
                <span>{i + 1}</span>
                <p dir="ltr">{ex}</p>
                <button
                  className="icon-button"
                  aria-label={
                    lang === "ar" ? "استمع للمثال" : "Listen to example"
                  }
                  onClick={() => say(ex)}
                >
                  <Volume2 size={19} />
                </button>
              </div>
            ))}
          </div>
          <div className="mistake-note">
            <h3>
              {lang === "ar"
                ? "خطأ شائع، وتصحيحه"
                : "A common mistake, corrected"}
            </h3>
            <p dir="ltr">
              <del>{lesson.mistake[0]}</del>
            </p>
            <p dir="ltr">
              <Check size={17} />
              {lesson.mistake[1]}
            </p>
          </div>
          {lesson.video && (
            <section className="lesson-video">
              <h3>
                {lang === "ar"
                  ? "شرح مرئي من إعداد طلاقة"
                  : "An original Talaqa visual lesson"}
              </h3>
              <video
                key={lesson.id}
                controls
                preload="metadata"
                playsInline
                aria-label={lesson.title[lang]}
                poster={`/lessons/${lesson.id}-poster.png`}
              >
                <source src={`/lessons/${lesson.id}.mp4`} type="video/mp4" />
              </video>
              <p>
                {lang === "ar"
                  ? "فيديو نصي توضيحي بدون صوت. يمكنك قراءة الشرح أعلاه والاستماع للأمثلة."
                  : "A silent explanatory text video. Read the lesson above and listen to its examples."}
              </p>
            </section>
          )}
          <div className="lesson-actions">
            <button
              className="primary-button"
              onClick={() => startQuiz("lesson:" + lesson.id)}
            >
              {lang === "ar" ? "اختبر فهمك" : "Check your understanding"}
              <ArrowLeft size={17} />
            </button>
            <button className="outline-button" onClick={mark}>
              <Check size={17} />
              {completed.includes(selected)
                ? lang === "ar"
                  ? "أكملت هذا الدرس"
                  : "Lesson completed"
                : lang === "ar"
                  ? "علّم كمكتمل"
                  : "Mark complete"}
            </button>
            <button className="text-button" onClick={() => goTeacher(lesson)}>
              {lang === "ar"
                ? "ناقش الدرس مع المعلم"
                : "Discuss with your tutor"}
            </button>
          </div>
        </article>
      </div>
    </>
  );
}
export function Speaking() {
  const lang = getLanguage(),
    [scenario, setScenario] = useState(0),
    [recording, setRecording] = useState(false),
    [audio, setAudio] = useState(""),
    [error, setError] = useState("");
  const rec = useRef(null),
    stream = useRef(null),
    url = useRef(""),
    mounted = useRef(true);
  const prompts = [
    [
      "عرّف بنفسك",
      "Introduce yourself",
      "My name is Sara. I am learning English because I want to communicate with more people.",
    ],
    [
      "مقابلة عمل",
      "A job interview",
      "I enjoy working with a team. In my last project, I helped solve a difficult problem.",
    ],
    [
      "خططك القادمة",
      "Your next plans",
      "Next weekend, I am going to visit my family. We will have lunch together.",
    ],
  ];
  useEffect(
    () => () => {
      mounted.current = false;
      if(rec.current && rec.current.state!=="inactive") rec.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      URL.revokeObjectURL(url.current);
      window.speechSynthesis?.cancel();
    },
    [],
  );
  const record = async () => {
    setError("");
    if (recording) {
      if(rec.current && rec.current.state!=="inactive") rec.current.stop();
      return;
    }
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
        throw new Error(
          lang === "ar"
            ? "التسجيل يحتاج متصفحًا داعمًا واتصال HTTPS."
            : "Recording needs a supported browser and HTTPS.",
        );
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (!mounted.current) {
        stream.current.getTracks().forEach((t) => t.stop());
        return;
      }
      const chunks = [];
      const r = new MediaRecorder(stream.current);
      rec.current = r;
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onstop = () => {
        stream.current?.getTracks().forEach((t) => t.stop());
        if (!mounted.current) return;
        URL.revokeObjectURL(url.current);
        url.current = URL.createObjectURL(
          new Blob(chunks, { type: r.mimeType }),
        );
        setAudio(url.current);
        setRecording(false);
      };
      r.start();
      setRecording(true);
    } catch (e) {
      setError(
        e.name === "NotAllowedError"
          ? lang === "ar"
            ? "اسمح باستخدام الميكروفون ثم حاول مجددًا."
            : "Allow microphone access and try again."
          : e.message,
      );
    }
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            {lang === "ar"
              ? "صوتك يتطور بالممارسة"
              : "Your voice grows with practice"}
          </h1>
          <p>
            {lang === "ar"
              ? "اسمع النموذج، كرره، وسجّل محاولتك. تسجيلك يبقى على جهازك ولا يرسل إلى الخادم."
              : "Listen, shadow the example, and record yourself. Your recording stays on your device and is not uploaded."}
          </p>
        </div>
      </div>
      <div className="speaking-workshop">
        <div className="scenario-tabs">
          {prompts.map((p, i) => (
            <button
              key={i}
              disabled={recording}
              aria-pressed={scenario === i}
              className={scenario === i ? "selected" : ""}
              onClick={() => {
                setScenario(i);
                setAudio("");
              }}
            >
              {p[lang === "ar" ? 0 : 1]}
            </button>
          ))}
        </div>
        <h2>{prompts[scenario][lang === "ar" ? 0 : 1]}</h2>
        <p className="speaking-model" dir="ltr">
          {prompts[scenario][2]}
        </p>
        <button
          className="outline-button"
          onClick={() => say(prompts[scenario][2])}
        >
          <Volume2 size={19} />
          {lang === "ar" ? "اسمع النموذج ببطء" : "Listen slowly"}
        </button>
        <div className="record-station">
          <button
            className={recording ? "mic-button recording" : "mic-button"}
            onClick={record}
            aria-label={recording ? "Stop recording" : "Record your voice"}
          >
            {recording ? <Square /> : <Mic />}
          </button>
          <p>
            {recording
              ? lang === "ar"
                ? "جارٍ التسجيل — اضغط للإيقاف"
                : "Recording — tap to stop"
              : lang === "ar"
                ? "سجّل نفس الفكرة بصوتك"
                : "Record the idea in your own voice"}
          </p>
          {audio && (
            <>
              <audio src={audio} controls />
              <button
                className="text-button"
                onClick={() => {
                  URL.revokeObjectURL(url.current);
                  url.current = "";
                  setAudio("");
                }}
              >
                <RotateCcw size={16} />
                {lang === "ar" ? "احذف التسجيل" : "Delete recording"}
              </button>
            </>
          )}
          {error && (
            <p role="alert" className="inline-error">
              {error}
            </p>
          )}
        </div>
        <h3>
          {lang === "ar"
            ? "اسمع لنفسك بهذه الأسئلة"
            : "Listen back with these questions"}
        </h3>
        <ul className="speaking-checklist">
          {(lang === "ar"
            ? [
                "هل وصلت الفكرة بوضوح؟",
                "هل نطقت نهاية الكلمات؟ جرّب worked وworks.",
                "هل توقفت بين الأفكار بدل كل كلمة؟",
                "كرر المحاولة بجملة إضافية من عندك.",
              ]
            : [
                "Was the idea clear?",
                "Did you say word endings? Try worked and works.",
                "Did you pause between ideas rather than every word?",
                "Try again and add one sentence of your own.",
              ]
          ).map((t) => (
            <li key={t}>
              <Check size={17} />
              {t}
            </li>
          ))}
        </ul>
        <p className="footnote">
          {lang === "ar"
            ? "هذا تمرين مقارنة ذاتية، ولا يمنح تقييمًا آليًا للنطق. صوت النموذج من المتصفح."
            : "This is self-review, not automated pronunciation scoring. The model uses browser speech."}
        </p>
      </div>
    </>
  );
}
