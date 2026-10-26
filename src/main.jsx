import "./preferences";
import QuestionBank from "./QuestionBank";
import { bankSession } from "./questionBank";
import RealtimeVoice from "./RealtimeVoice";
import { savePreference } from "./preferences";
import { getLanguage } from "./i18n/core";
import { Learning, Speaking } from "./Learning";
import { courses, courseQuestions } from "./courses";
import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpLeft,
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  MessageCircle,
  Mic,
  BookOpen,
  ChartNoAxesCombined,
  ClipboardList,
  Check,
  Flame,
  Headphones,
  Volume2,
  Play,
  Send,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  Target,
  Clock,
  Leaf,
  Sparkles,
  Crown,
  RotateCcw,
  Bookmark,
  CheckCircle2,
  ShieldCheck,
  LoaderCircle,
  Square,
  Settings,
  LogOut,
  Moon,
  Sun,
  Languages,
} from "lucide-react";
import "@fontsource-variable/noto-sans-arabic";
import "@fontsource-variable/dm-sans";
import "./styles.css";
import { questions, words } from "./content";
const nav = [
  ["home", "رحلتي", LayoutDashboard],
  ["lessons", "الدروس والشروحات", BookOpen],
  ["speaking", "تدريب الكلام", Mic],
  ["teacher", "المعلم الذكي", MessageCircle],
  ["step", "تدريب STEP", ClipboardList],
  ["bank", "بنك الأسئلة", ClipboardList],
  ["words", "مكتبتي", BookOpen],
  ["progress", "تقدّمي", ChartNoAxesCombined],
];
const fresh = {
  name: "متعلّم",
  goal: 90,
  results: [],
  known: [],
  days: [],
  messages: [],
};
function load() {
  try {
    const p = JSON.parse(localStorage.getItem("talaqa-v1"));
    return p &&
      Array.isArray(p.results) &&
      Array.isArray(p.known) &&
      Array.isArray(p.days)
      ? { ...fresh, ...p }
      : fresh;
  } catch {
    return fresh;
  }
}
function dateKey() {
  return new Date().toLocaleDateString("en-CA");
}
function speak(text, onEnd) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.85;
  u.onend = onEnd;
  u.onerror = onEnd;
  window.speechSynthesis.speak(u);
  return true;
}
function route() {
  const hash = location.hash.slice(1);
  return [
    "home",
    "teacher",
    "step",
    "words",
    "progress",
    "plans",
    "lessons",
    "speaking",
    "bank",
  ].includes(hash)
    ? hash
    : "home";
}
function App() {
  const [language, setLanguage] = useState(document.documentElement.lang);
  const [theme, setTheme] = useState(document.documentElement.dataset.theme);
  const switchLanguage = () => {
    const next = language === "ar" ? "en" : "ar";
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    savePreference("talaqa-language", next);
    setLanguage(next);
  };
  const switchTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    savePreference("talaqa-theme", next);
    setTheme(next);
  };
  const [mobile, setMobile] = useState(
    () => matchMedia("(max-width:760px)").matches,
  );
  const [user, setUser] = useState(null),
    [sync, setSync] = useState(""),
    [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState(route),
    [data, setData] = useState(load),
    [menu, setMenu] = useState(false),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [storageError, setStorageError] = useState(false);
  const [ai, setAi] = useState(null);
  const [ephemeralStorage, setEphemeralStorage] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem("talaqa-v1", JSON.stringify(data));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [data]);
  useEffect(() => {
    const mq = matchMedia("(max-width:760px)");
    const resize = () => setMobile(mq.matches);
    mq.addEventListener("change", resize);
    const escape = (e) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", escape);
    return () => {
      mq.removeEventListener("change", resize);
      window.removeEventListener("keydown", escape);
    };
  }, []);
  useEffect(() => {
    if (menu && mobile) document.querySelector(".sidebar .brand")?.focus();
  }, [menu, mobile]);
  useEffect(() => {
    const listener = () => setPage(route());
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  const enterAccount = async (account) => {
    const response = await fetch("/api/progress");
    if (!response.ok) throw new Error("تعذر تحميل تقدم حسابك. حاول مجددًا.");
    const { progress } = await response.json();
    setData(
      progress
        ? { ...fresh, ...progress, messages: [] }
        : { ...data, name: account.name, messages: [] },
    );
    setUser(account);
    setSync("محفوظ في حسابك");
  };
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/auth/me");
        const { user: account } = await r.json();
        if (account && mounted) await enterAccount(account);
      } catch {
        if (mounted) setSync("تعذر الاتصال بخدمة الحسابات");
      } finally {
        if (mounted) setAuthLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (!user) return;
    setSync("جارٍ حفظ التقدم…");
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const r = await fetch("/api/progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          signal: abort.signal,
          body: JSON.stringify({
            name: data.name,
            goal: data.goal,
            results: data.results,
            known: data.known,
            days: data.days,
          }),
        });
        if (!r.ok) throw new Error();
        setSync("محفوظ في حسابك");
      } catch (e) {
        if (e.name !== "AbortError")
          setSync("لم تتم المزامنة؛ تقدمك محفوظ في هذا المتصفح");
      }
    }, 600);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [data, user]);
  const logout = async () => {
    try {
      const r = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!r.ok) throw new Error();
      setUser(null);
      setData({ ...fresh });
      setSync("");
      setModal(null);
      setToast("تم تسجيل الخروج. تقدمك محفوظ في حسابك.");
    } catch {
      setToast("تعذر تسجيل الخروج. حاول مجددًا.");
    }
  };
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        setAi(d.aiConfigured);
        setEphemeralStorage(!!d.ephemeralStorage);
      })
      .catch(() => setAi(false));
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  const go = (p) => {
    location.hash = p;
    setPage(p);
    setMenu(false);
    window.scrollTo(0, 0);
  };
  const update = (fn) =>
    setData((d) => (typeof fn === "function" ? fn(d) : { ...d, ...fn }));
  const markDay = (d) => [...new Set([...d.days, dateKey()])];
  const finish = (result) => {
    update((d) => ({
      ...d,
      results: [...d.results, { ...result, date: new Date().toISOString() }],
      days: markDay(d),
    }));
    setModal(null);
    go("progress");
    setToast("تم حفظ نتيجتك. كل محاولة تقرّبك من هدفك!");
  };
  return (
    <div className="app">
      <aside
        className={`sidebar ${menu ? "open" : ""}`}
        inert={mobile && !menu}
        aria-hidden={mobile && !menu ? true : undefined}
        aria-label="قائمة طلاقة"
        onKeyDown={(e) => {
          if (!mobile || !menu || e.key !== "Tab") return;
          const els = [
            ...e.currentTarget.querySelectorAll("a,button:not(:disabled)"),
          ];
          if (!e.shiftKey && document.activeElement === els.at(-1)) {
            e.preventDefault();
            els[0].focus();
          } else if (e.shiftKey && document.activeElement === els[0]) {
            e.preventDefault();
            els.at(-1).focus();
          }
        }}
      >
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
        >
          <span className="brand-mark">
            <Leaf size={25} />
          </span>
          <span>
            طلاقة<span className="brand-en">TALAQA</span>
          </span>
        </a>
        <div className="workspace-label">مساحتك للتعلّم</div>
        <nav aria-label="التنقل الرئيسي">
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id ? "nav-item active" : "nav-item"}
              onClick={() => go(id)}
            >
              <Icon size={20} />
              <span>{label}</span>
              {id === "teacher" && <span className="new-tag">AI</span>}
              {page === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-box">
            <span className="upgrade-icon">
              <Sparkles size={22} />
            </span>
            <h3>مساحة أكبر لطموحك</h3>
            <p>تعرّف على باقات طلاقة وخيارات التعلّم.</p>
            <button onClick={() => go("plans")}>
              اكتشف طلاقة بلس <ArrowUpLeft size={16} />
            </button>
          </div>
          <button
            className="profile"
            onClick={() => setModal({ type: "settings" })}
          >
            <span className="avatar">{data.name[0]}</span>
            <span>
              <strong data-localize={false}>{data.name}</strong>
              <small>{user ? "حسابك متصل" : "رحلتك تبدأ بخطوة"}</small>
            </span>
            <Settings size={18} />
          </button>
        </div>
      </aside>
      {menu && (
        <button
          className="menu-scrim"
          aria-label="إغلاق القائمة"
          onClick={() => setMenu(false)}
        />
      )}
      <main>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="فتح القائمة"
              onClick={() => setMenu(!menu)}
            >
              <Menu />
            </button>
            <span>مساحتك الشخصية</span>
            <ChevronLeft size={14} />
            <strong>
              {nav.find((n) => n[0] === page)?.[1] || "باقات طلاقة"}
            </strong>
          </div>
          <div className="top-actions">
            <button
              className="preference-button"
              onClick={switchLanguage}
              aria-label={
                language === "ar" ? "Switch to English" : "التبديل إلى العربية"
              }
            >
              <Languages size={17} />
              <span>{language === "ar" ? "English" : "العربية"}</span>
            </button>
            <button
              className="icon-button theme-toggle"
              onClick={switchTheme}
              aria-label={
                language === "ar"
                  ? theme === "dark"
                    ? "الوضع النهاري"
                    : "الوضع الليلي"
                  : theme === "dark"
                    ? "Light mode"
                    : "Dark mode"
              }
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            {!user && !authLoading && (
              <button
                className="account-button"
                onClick={() => setModal({ type: "auth" })}
              >
                دخول / حساب جديد
              </button>
            )}
            <span className="date-label">
              {new Date().toLocaleDateString(
                language === "ar" ? "ar-SA" : "en-US",
                {
                  day: "numeric",
                  month: "long",
                  calendar: "gregory",
                },
              )}
            </span>
            <button className="streak" onClick={() => go("progress")}>
              <Flame size={17} />
              <span>{data.days.length} أيام تعلّم</span>
            </button>
            <button
              className="avatar small"
              aria-label="إعدادات الحساب"
              onClick={() => setModal({ type: "settings" })}
            >
              {data.name[0]}
            </button>
          </div>
        </header>
        <div className="page-content">
          {ephemeralStorage && (
            <div className="notice" role="status">
              <ShieldCheck size={20} />
              <p>
                هذه نسخة تجريبية على استضافة مجانية. بيانات الحسابات على الخادم
                مؤقتة وقد تُحذف عند إعادة التشغيل؛ احتفظ بتقدمك في هذا المتصفح.
              </p>
            </div>
          )}
          {storageError && (
            <div className="notice error" role="alert">
              تعذّر حفظ تقدمك في هذا المتصفح. تأكد من السماح بالتخزين المحلي.
            </div>
          )}
          {page === "bank" && (
            <QuestionBank start={(mode) => setModal({ type: "quiz", mode })} />
          )}
          {page === "lessons" && (
            <Learning
              startQuiz={(mode) => setModal({ type: "quiz", mode })}
              goTeacher={(lesson) => {
                update((d) => ({ ...d, messages: [] }));
                savePreference("talaqa-tutor-topic", lesson.title.en);
                go("teacher");
              }}
            />
          )}
          {page === "speaking" && <Speaking />}
          {page === "home" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>
                    كل يوم، أقرب لطلاقتك <span className="greeting-dot" />
                  </h1>
                  <p>خطوة صغيرة اليوم، وثقة أكبر بكرة. خلّنا نبدأ.</p>
                </div>
                <button
                  className="outline-button"
                  onClick={() => setModal({ type: "quiz", mode: "level" })}
                >
                  <Target size={17} /> حدّد مستواك <ArrowUpLeft size={16} />
                </button>
              </div>
              <section className="hero">
                <div className="hero-content">
                  <span className="live-label">
                    <span /> معلمك، على طريقتك
                  </span>
                  <h2>
                    إنجليزيتك تتحسّن.
                    <br />
                    وثقتك{" "}
                    <em>{getLanguage() === "en" ? " speaks." : "تتكلم."}</em>
                  </h2>
                  <p>
                    تكلّم، جرّب، واغلط براحتك. معلمك الذكي يساعدك
                    <br className="desktop-break" /> تتعلم من كل محادثة، وتستعد
                    لخطوتك الجاية.
                  </p>
                  <button
                    className="light-button"
                    onClick={() => go("teacher")}
                  >
                    ابدأ محادثتك الأولى <ArrowUpLeft size={19} />
                  </button>
                  <div className="hero-note">
                    <ShieldCheck size={14} /> مساحة للتدريب، بدون أحكام
                  </div>
                  {ai === false && (
                    <p className="hero-availability">
                      المعلم الذكي بانتظار التفعيل. المثال التعليمي متاح الآن.
                    </p>
                  )}
                </div>
                <div className="hero-demo" dir="ltr">
                  <div className="demo-top">
                    <span className="demo-symbol">
                      <Sparkles size={18} />
                    </span>
                    <span>Your everyday English partner</span>
                    <span className="demo-status" />
                  </div>
                  <div className="demo-line">
                    A little practice.
                    <br />
                    <span>A lot more confidence.</span>
                  </div>
                  <div className="sound-wave" aria-hidden="true">
                    {Array.from({ length: 35 }, (_, i) => (
                      <i
                        key={i}
                        style={{
                          height: `${12 + Math.abs(Math.sin(i * 0.67)) * 36}px`,
                          animationDelay: `${i * 0.045}s`,
                        }}
                      />
                    ))}
                  </div>
                  <button
                    className="demo-play"
                    onClick={() => {
                      if (!speak("A little practice. A lot more confidence."))
                        setToast("قراءة الصوت غير متاحة في متصفحك.");
                    }}
                    aria-label="اسمع مثالًا للنطق"
                  >
                    <Volume2 size={17} />
                    <span>Listen. Learn. Speak.</span>
                    <span className="play-circle">
                      <Play size={12} fill="currentColor" />
                    </span>
                  </button>
                  <span className="demo-caption">مثال للنطق • صوت المتصفح</span>
                </div>
              </section>
              <section className="summary-strip" aria-label="ملخص تقدمك">
                <div>
                  <span className="stat-icon sage">
                    <Target />
                  </span>
                  <div>
                    <span>هدفك في STEP</span>
                    <strong>
                      {data.goal}
                      <small> / 100</small>
                    </strong>
                  </div>
                  <button
                    aria-label="تعديل الهدف"
                    onClick={() => setModal({ type: "settings" })}
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
                <div>
                  <span className="stat-icon peach">
                    <Clock />
                  </span>
                  <div>
                    <span>تدريبك اليوم</span>
                    <strong>
                      {data.days.includes(dateKey()) ? "مكتمل" : "١٥ دقيقة"}
                      <small>
                        {" "}
                        {data.days.includes(dateKey())
                          ? "أحسنت!"
                          : "تصنع الفرق"}
                      </small>
                    </strong>
                  </div>
                </div>
                <div>
                  <span className="stat-icon lilac">
                    <BookOpen />
                  </span>
                  <div>
                    <span>حصيلتك اللغوية</span>
                    <strong>
                      {data.known.length}
                      <small> كلمات أتقنتها</small>
                    </strong>
                  </div>
                </div>
                <div>
                  <span className="stat-icon sand">
                    <ChartNoAxesCombined />
                  </span>
                  <div>
                    <span>محاولات التدريب</span>
                    <strong>
                      {data.results.length}
                      <small> اختبارات مكتملة</small>
                    </strong>
                  </div>
                </div>
              </section>
              <div className="dashboard-grid">
                <div className="learning-column">
                  <section>
                    <div className="section-heading">
                      <h2>خطتك لليوم</h2>
                      <span className="muted">على مهلك، بس استمر</span>
                    </div>
                    <div className="daily-list">
                      {[
                        {
                          icon: MessageCircle,
                          title: "خلّنا نتكلم عن يومك",
                          desc: "محادثة قصيرة تصنع ثقة أكبر",
                          tag: "المعلم الذكي",
                          time: "٥ دقائق",
                          color: "sage",
                          action: () => go("teacher"),
                        },
                        {
                          icon: Headphones,
                          title: "اسمعها… وافهمها",
                          desc: "تدرّب على التقاط الفكرة الأساسية",
                          tag: "تدريب STEP",
                          time: "٥ دقائق",
                          color: "peach",
                          action: () =>
                            setModal({ type: "quiz", mode: "listening" }),
                        },
                        {
                          icon: BookOpen,
                          title: "كلمات اليوم، فرص بكرة",
                          desc: "٦ كلمات تقدر تستخدمها من اليوم",
                          tag: "المفردات",
                          time: "٥ دقائق",
                          color: "lilac",
                          action: () => go("words"),
                        },
                      ].map((l, i) => (
                        <button
                          className="lesson-row"
                          onClick={l.action}
                          key={i}
                        >
                          <span className={`lesson-icon ${l.color}`}>
                            <l.icon size={22} />
                          </span>
                          <span className="lesson-copy">
                            <strong>{l.title}</strong>
                            <span>{l.desc}</span>
                            <small>
                              {l.tag}
                              <b>·</b>
                              {l.time}
                            </small>
                          </span>
                          <span className="lesson-arrow">
                            <ArrowLeft size={19} />
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                  <section className="step-banner">
                    <div className="step-monogram" dir="ltr">
                      STEP<span>BY STEP.</span>
                    </div>
                    <div>
                      <h3>درجتك الجاية تبدأ من هنا.</h3>
                      <p>تدريب قصير، شرح واضح، وتقدّم تقدر تشوفه.</p>
                      <button
                        className="text-button"
                        onClick={() => go("step")}
                      >
                        تدرّب على STEP <ArrowLeft size={17} />
                      </button>
                    </div>
                    <span className="step-stamp">
                      <Check size={25} />
                    </span>
                  </section>
                </div>
                <div className="aside-column">
                  <section className="word-card">
                    <div className="section-heading">
                      <h2>كلمة تفتح لك باب</h2>
                      <button
                        className="icon-button"
                        aria-label="استمع لكلمة اليوم"
                        onClick={() => speak(words[0].word)}
                      >
                        <Volume2 size={18} />
                      </button>
                    </div>
                    <div className="word-display" dir="ltr">
                      <span>verb / əˈtʃiːv /</span>
                      <h3>
                        Achieve<span>.</span>
                      </h3>
                    </div>
                    <p className="word-meaning">يحقق، ينجز</p>
                    <p className="word-example" dir="ltr">
                      “Small daily steps help you
                      <br />
                      achieve your goals.”
                    </p>
                    <button
                      className="word-save"
                      onClick={() => {
                        if (!data.known.includes("Achieve"))
                          update((d) => ({
                            ...d,
                            known: [...d.known, "Achieve"],
                            days: markDay(d),
                          }));
                        else go("words");
                      }}
                    >
                      {data.known.includes("Achieve") ? (
                        <Check size={17} />
                      ) : (
                        <Plus size={17} />
                      )}{" "}
                      {data.known.includes("Achieve")
                        ? "في حصيلتك اللغوية"
                        : "أضف إلى حصيلتك"}
                    </button>
                  </section>
                  <div className="gentle-note">
                    <span>
                      <Leaf size={20} />
                    </span>
                    <p>
                      مو لازم تكون ممتاز عشان تبدأ.
                      <br />
                      <strong>ابدأ، وعشانها بتصير أفضل.</strong>
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
          {page === "teacher" && (
            <Teacher ai={ai} data={data} update={update} setToast={setToast} />
          )}
          {page === "step" && (
            <>
              <PageHeading
                title="خطوتك الجاية في STEP"
                description="تدرّب، افهم سبب الإجابة، وارجع أقوى. هذه أسئلة تدريبية مستقلة وليست اختبارًا رسميًا."
              />
              <div className="exam-feature">
                <div>
                  <span className="icon-tile">
                    <ClipboardList size={30} />
                  </span>
                  <h2>اختبار تدريبي شامل</h2>
                  <p>
                    ١٢ سؤالًا في القواعد والمفردات والقراءة والاستماع، مع شرح
                    لكل إجابة.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => setModal({ type: "quiz", mode: "full" })}
                  >
                    ابدأ التدريب <ArrowLeft size={18} />
                  </button>
                </div>
                <div className="exam-details">
                  <p>
                    <Clock size={19} /> بدون ضغط الوقت
                  </p>
                  <p>
                    <BookOpen size={19} /> شرح عربي لكل سؤال
                  </p>
                  <p>
                    <ChartNoAxesCombined size={19} /> نتيجة محفوظة في جهازك
                  </p>
                </div>
              </div>
              <div className="section-heading">
                <h2>ركّز على مهارة واحدة</h2>
              </div>
              <div className="skill-grid">
                {[
                  ["grammar", "القواعد", "ابنِ جملتك بثقة", ClipboardList],
                  [
                    "reading",
                    "القراءة",
                    "افهم الفكرة وما بين السطور",
                    BookOpen,
                  ],
                  [
                    "listening",
                    "الاستماع",
                    "درّب أذنك على التفاصيل",
                    Headphones,
                  ],
                  [
                    "vocabulary",
                    "المفردات",
                    "اختَر الكلمة في سياقها",
                    Bookmark,
                  ],
                ].map(([id, t, d, Icon]) => (
                  <button
                    key={id}
                    className="skill-item"
                    onClick={() => setModal({ type: "quiz", mode: id })}
                  >
                    <Icon />
                    <h3>{t}</h3>
                    <p>{d}</p>
                    <ArrowLeft size={18} />
                  </button>
                ))}
              </div>
              <p className="footnote">
                نتائج التدريب مؤشر على أدائك في هذه الأسئلة فقط؛ لا تتنبأ بدرجتك
                الرسمية. يستخدم الاستماع صوت المتصفح.
              </p>
            </>
          )}
          {page === "words" && (
            <WordLibrary data={data} update={update} setToast={setToast} />
          )}
          {page === "progress" && (
            <>
              <PageHeading
                title="شوف كيف تتقدّم"
                description="كل كلمة تتعلمها، وكل محاولة تكملها، لها أثر. بياناتك محفوظة محليًا، وتتم مزامنتها عند تسجيل الدخول."
              />
              <div className="progress-overview">
                <div>
                  <span>محاولات مكتملة</span>
                  <strong>{data.results.length}</strong>
                </div>
                <div>
                  <span>كلمات أتقنتها</span>
                  <strong>{data.known.length}</strong>
                </div>
                <div>
                  <span>أيام تعلّم</span>
                  <strong>{data.days.length}</strong>
                </div>
                <div>
                  <span>متوسط التدريب</span>
                  <strong>
                    {data.results.length
                      ? Math.round(
                          data.results.reduce(
                            (s, r) => s + (r.score / r.total) * 100,
                            0,
                          ) / data.results.length,
                        ) + "%"
                      : "—"}
                  </strong>
                </div>
              </div>
              <div className="section-heading">
                <h2>سجل محاولاتك</h2>
                <button className="text-button" onClick={() => go("step")}>
                  تدريب جديد <Plus size={17} />
                </button>
              </div>
              {!data.results.length ? (
                <div className="empty-state">
                  <ChartNoAxesCombined size={45} />
                  <h2>هنا بتشوف أثر خطواتك</h2>
                  <p>أكمل أول تدريب لتتعرف على نقاط قوتك وما تحتاج تراجعه.</p>
                  <button className="primary-button" onClick={() => go("step")}>
                    ابدأ أول تدريب <ArrowLeft size={17} />
                  </button>
                </div>
              ) : (
                <div className="results-list">
                  {data.results
                    .slice()
                    .reverse()
                    .map((r, i) => (
                      <div className="result-row" key={i}>
                        <span className="stat-icon sage">
                          <CheckCircle2 />
                        </span>
                        <div>
                          <strong>{r.label}</strong>
                          <small>
                            {new Date(r.date).toLocaleDateString("ar-SA", {
                              calendar: "gregory",
                              day: "numeric",
                              month: "long",
                            })}
                          </small>
                        </div>
                        <div className="result-track">
                          <div
                            style={{ width: `${(r.score / r.total) * 100}%` }}
                          />
                        </div>
                        <strong>
                          {r.score} / {r.total}
                        </strong>
                        <span>{Math.round((r.score / r.total) * 100)}%</span>
                      </div>
                    ))}
                </div>
              )}
              <div className="notice">
                <ShieldCheck size={20} />
                <p>
                  هذا سجل تدريبي محلي، وليس تقييمًا رسميًا لمستواك أو درجتك في
                  STEP.
                </p>
              </div>
            </>
          )}
          {page === "plans" && <Plans setToast={setToast} />}
          <footer>
            {user && (
              <span className="sync-status" role="status">
                {sync}
              </span>
            )}
            <span className="footer-brand">
              طلاقة<span> . </span>خطوة أقرب لنفسك الواثقة.
            </span>
            <span>
              صُنع لطموحك <Leaf size={13} />
            </span>
          </footer>
        </div>
      </main>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {toast}
        </div>
      )}
      {modal?.type === "quiz" && (
        <Quiz mode={modal.mode} finish={finish} close={() => setModal(null)} />
      )}
      {modal?.type === "settings" && (
        <SettingsDialog
          data={data}
          update={update}
          user={user}
          logout={logout}
          openAccount={() => setModal({ type: "auth" })}
          close={() => setModal(null)}
        />
      )}
      {modal?.type === "auth" && (
        <AuthDialog
          onSuccess={async (account) => {
            await enterAccount(account);
            setModal(null);
            setToast("أهلًا بك! تقدمك مرتبط بحسابك الآن.");
          }}
          close={() => setModal(null)}
        />
      )}
    </div>
  );
}
function PageHeading({ title, description }) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
function Teacher({ ai, data, update, setToast }) {
  const [tutorLevel, setTutorLevel] = useState("A2");
  const [tutorFocus, setTutorFocus] = useState(() => {
    try {
      return localStorage.getItem("talaqa-tutor-topic") || "conversation";
    } catch {
      return "conversation";
    }
  });
  const [mode, setMode] = useState("text"),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [listening, setListening] = useState(false),
    [speaking, setSpeaking] = useState(false),
    [demo, setDemo] = useState(false);
  const recognition = useRef(null),
    bottom = useRef(null),
    active = useRef(true);
  const messages = data.messages || [];
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      recognition.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);
  const send = async (text = input) => {
    if (!text.trim() || busy) return;
    setError("");
    if (ai !== true && !demo) {
      setError("الخدمة غير مفعّلة حاليًا. يمكنك تشغيل المثال التعليمي أدناه.");
      return;
    }
    const next = [...messages, { role: "user", content: text.trim() }];
    update((d) => ({ ...d, messages: next.slice(-20) }));
    setInput("");
    setBusy(true);
    try {
      let answer;
      if (demo) {
        await new Promise((r) => setTimeout(r, 600));
        answer =
          "هذا مثال تعليمي ثابت، وليس ردًا من الذكاء الاصطناعي.\n\n“I go to work every day.”\nنستخدم المضارع البسيط للتحدث عن العادات. مع I نستخدم الفعل go بدون s.\n\nجرّب كتابة جملة تبدأ بـ: Every day, I…";
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: next.slice(-20),
            language: getLanguage(),
            level: tutorLevel,
            focus: tutorFocus,
          }),
        });
        const body = await res.json();
        if (!res.ok)
          throw new Error(body.error || "تعذر إرسال الرسالة. حاول مجددًا.");
        answer = body.message;
      }
      if (!active.current) return;
      update((d) => ({
        ...d,
        messages: [
          ...d.messages,
          { role: "assistant", content: answer, demo },
        ].slice(-20),
        days: [...new Set([...d.days, dateKey()])],
      }));
      if (mode === "voice") {
        setSpeaking(true);
        if (!speak(answer, () => setSpeaking(false))) {
          setSpeaking(false);
          setToast("الصوت غير متاح في هذا المتصفح.");
        }
      }
    } catch (e) {
      if (active.current) {
        setError(e.message);
        setInput(text);
        update((d) => ({ ...d, messages: d.messages.slice(0, -1) }));
      }
    } finally {
      if (active.current) setBusy(false);
    }
  };
  const startVoice = () => {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) {
      setError(
        "الإملاء الصوتي غير مدعوم هنا. استخدم Chrome أو Edge عبر اتصال آمن، أو اكتب رسالتك.",
      );
      return;
    }
    const r = new Speech();
    recognition.current = r;
    r.lang = "en-US";
    r.interimResults = false;
    r.onresult = (e) => {
      setInput(e.results[0][0].transcript);
      setListening(false);
    };
    r.onerror = (e) => {
      setListening(false);
      setError(
        e.error === "not-allowed"
          ? "اسمح بالميكروفون من إعدادات المتصفح، ثم حاول مجددًا."
          : "تعذر التقاط الصوت. حاول مجددًا أو اكتب رسالتك.",
      );
    };
    r.onend = () => setListening(false);
    try {
      r.start();
      setListening(true);
      setError("");
    } catch {
      setError("تعذر تشغيل الميكروفون. حاول مجددًا.");
    }
  };
  return (
    <>
      <PageHeading
        title="مساحتك للكلام، والتعلّم"
        description="جرّب جملة جديدة، اسأل عن قاعدة، أو تدرّب على محادثة بالإنجليزية."
      />
      <div className="teacher-layout">
        <section className="chat-panel">
          <div className="chat-header">
            <div className="teacher-identity">
              <span className="teacher-avatar">
                <Sparkles size={24} />
              </span>
              <div>
                <h2>معلم طلاقة</h2>
                <span>
                  {demo
                    ? "مثال تعليمي ثابت"
                    : ai === true
                      ? "معلم بالذكاء الاصطناعي"
                      : "بانتظار تفعيل الخدمة"}
                </span>
              </div>
            </div>
            <div className="segmented">
              <button
                aria-pressed={mode === "text"}
                className={mode === "text" ? "selected" : ""}
                onClick={() => {
                  setMode("text");
                  recognition.current?.stop();
                  window.speechSynthesis?.cancel();
                  setSpeaking(false);
                }}
              >
                <MessageCircle size={16} /> رسائل
              </button>
              <button
                aria-pressed={mode === "voice"}
                className={mode === "voice" ? "selected" : ""}
                onClick={() => setMode("voice")}
              >
                <Mic size={16} /> صوت مباشر
              </button>
            </div>
          </div>
          {ai === false && (
            <div className="chat-service-note">
              المحادثة الذكية تحتاج تفعيل خدمة AI.{" "}
              <button
                onClick={() => {
                  setDemo(!demo);
                  update({ messages: [] });
                }}
              >
                {demo ? "أوقف المثال" : "جرّب مثالًا تعليميًا ثابتًا"}
              </button>
            </div>
          )}
          <div className="tutor-options">
            <label>
              {getLanguage() === "ar" ? "مستواك" : "Your level"}
              <select
                value={tutorLevel}
                onChange={(e) => setTutorLevel(e.target.value)}
              >
                {["A1", "A2", "B1", "B2", "C1"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              {getLanguage() === "ar" ? "هدف الجلسة" : "Session focus"}
              <select
                value={tutorFocus}
                onChange={(e) => setTutorFocus(e.target.value)}
              >
                {[
                  "conversation",
                  "grammar",
                  "STEP",
                  "job interview",
                  ...courses.map((c) => c.title.en),
                ].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {mode === "voice" ? (
            <RealtimeVoice
              level={tutorLevel}
              focus={tutorFocus}
              configured={ai === true}
            />
          ) : (
            <>
              <div className="chat-messages" aria-live="polite">
                {!messages.length ? (
                  <div className="chat-welcome">
                    <span className="welcome-icon">
                      <MessageCircle size={32} />
                    </span>
                    <h3>الغلط أول خطوة للتعلّم.</h3>
                    <p>
                      خذ راحتك، وابدأ باللي تعرفه.
                      <br />
                      نقدر نتمرّن على يومك، سفرك، أو اختبارك الجاي.
                    </p>
                    <div className="suggestions">
                      {[
                        "Let’s practice a job interview.",
                        "اشرح لي الفرق بين since و for",
                        "Help me introduce myself.",
                      ].map((t) => (
                        <button key={t} onClick={() => setInput(t)}>
                          {t}
                          <ArrowUpLeft size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`message ${m.role}`}>
                      <span className="message-label">
                        {m.role === "user"
                          ? "أنت"
                          : m.demo
                            ? "مثال تعليمي"
                            : "معلم طلاقة"}
                      </span>
                      <p dir="auto" data-localize={false}>
                        {m.content}
                      </p>
                      {m.role === "assistant" && (
                        <button
                          className="text-button"
                          onClick={() => speak(m.content)}
                        >
                          <Volume2 size={14} /> استمع
                        </button>
                      )}
                    </div>
                  ))
                )}
                {busy && (
                  <div className="typing">
                    <LoaderCircle size={17} /> المعلم يجهّز ردّه…
                  </div>
                )}
                <div ref={bottom} />
              </div>
              {error && (
                <div className="inline-error" role="alert">
                  {error}
                </div>
              )}
              <form
                className="chat-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <input
                  aria-label="رسالتك للمعلم"
                  dir="auto"
                  placeholder="اكتب رسالتك… وبداية بسيطة تكفي"
                  value={input}
                  maxLength={3000}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button
                  disabled={!input.trim() || busy}
                  aria-label="إرسال الرسالة"
                >
                  <Send size={20} />
                </button>
              </form>
              <div className="chat-footnote">
                قد يخطئ الذكاء الاصطناعي. لا تشارك معلوماتك الحساسة.{" "}
                <button
                  onClick={() => update({ messages: [] })}
                  disabled={busy || !messages.length}
                >
                  مسح المحادثة
                </button>
              </div>
            </>
          )}
        </section>
        <aside className="teacher-guide">
          <h3>خلّها محادثة مفيدة</h3>
          <div>
            <span>١</span>
            <p>
              <strong>ابدأ من مستواك</strong>حتى جملة قصيرة تفتح موضوعًا.
            </p>
          </div>
          <div>
            <span>٢</span>
            <p>
              <strong>اطلب تصحيحًا</strong>«صحّح جملتي واشرح السبب».
            </p>
          </div>
          <div>
            <span>٣</span>
            <p>
              <strong>كرّر بصوتك</strong>اسمع الجملة، ثم قلها بطريقتك.
            </p>
          </div>
          <div className="voice-explainer">
            <Headphones size={24} />
            <h4>صوتك، بثقة أكبر</h4>
            <p>
              وضع الصوت يتيح اتصالًا صوتيًا مباشرًا مع المعلم عبر Realtime. يلزم
              الميكروفون واتصال آمن وتفعيل الخدمة لدى المزود.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
function Quiz({ mode, finish, close }) {
  const [bankItems] = useState(() =>
    mode.startsWith("bank:") ? bankSession(...mode.split(":").slice(1)) : null,
  );
  const allQuestions = [...questions, ...courseQuestions];
  const course = mode.startsWith("lesson:")
    ? courses.find((c) => c.id === mode.slice(7))
    : null;
  const label =
    (bankItems
      ? getLanguage() === "en"
        ? "Generated grammar practice"
        : "تدريب قواعد مولّد"
      : null) ||
    course?.title[getLanguage()] ||
    {
      full: "تدريب شامل",
      level: "اختبار تحديد المستوى المبدئي",
      grammar: "تدريب القواعد",
      reading: "تدريب القراءة",
      listening: "تدريب الاستماع",
      vocabulary: "تدريب المفردات",
    }[mode];
  const target = {
    grammar: "القواعد",
    reading: "القراءة",
    listening: "الاستماع",
    vocabulary: "المفردات",
  }[mode];
  const items =
    bankItems ||
    (course
      ? courseQuestions.filter((q) => q.lesson === course.id)
      : target
        ? allQuestions.filter((q) => q.skill === target)
        : mode === "level"
          ? questions.slice(0, 6)
          : allQuestions);
  const [index, setIndex] = useState(0),
    [selected, setSelected] = useState(null),
    [revealed, setRevealed] = useState(false),
    [answers, setAnswers] = useState([]),
    [done, setDone] = useState(false),
    [audioError, setAudioError] = useState(""),
    [confirmExit, setConfirmExit] = useState(false);
  const q = items[index],
    dialog = useRef(null);
  useEffect(() => {
    dialog.current?.focus();
    return () => window.speechSynthesis?.cancel();
  }, []);
  const score = answers.filter(Boolean).length;
  const next = () => {
    const a = [...answers, selected === q.answer];
    setAnswers(a);
    if (index === items.length - 1) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setSelected(null);
      setRevealed(false);
      setAudioError("");
      window.speechSynthesis?.cancel();
    }
  };
  return (
    <div className="modal-backdrop">
      <section
        className="quiz-dialog"
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === "Escape") setConfirmExit(true);
          if (e.key === "Tab") {
            const els = [
              ...e.currentTarget.querySelectorAll(
                "button:not(:disabled),input",
              ),
            ];
            const first = els[0],
              last = els.at(-1);
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <div className="dialog-header">
          <strong>{label}</strong>
          <button
            className="icon-button"
            aria-label="إغلاق التدريب"
            onClick={() => setConfirmExit(true)}
          >
            <X />
          </button>
        </div>
        {confirmExit ? (
          <div className="quiz-complete">
            <h2>تبي توقف التدريب؟</h2>
            <p>لن تُحفظ المحاولة قبل إكمالها.</p>
            <button
              className="primary-button"
              onClick={() => setConfirmExit(false)}
            >
              أكمل التدريب
            </button>
            <button className="text-button" onClick={close}>
              اخرج بدون حفظ
            </button>
          </div>
        ) : done ? (
          <div className="quiz-complete">
            <span className="completion-icon">
              <CheckCircle2 size={45} />
            </span>
            <h2>خطوة حلوة لقدّام!</h2>
            <strong className="quiz-score">
              {score}
              <span> / {items.length}</span>
            </strong>
            <p>
              {score / items.length >= 0.7
                ? "أداء جميل! راجع الشرح وثبّت اللي تعلّمته."
                : "المحاولة بداية التعلّم. ارجع للشرح وجرّب مرة ثانية."}
            </p>
            {mode === "level" && (
              <p className="footnote">
                هذه عينة قصيرة لتوجيه التدريب، ولا تحدد مستوى CEFR أو درجة STEP
                رسمية.
              </p>
            )}
            <button
              className="primary-button"
              onClick={() => finish({ score, total: items.length, label })}
            >
              احفظ النتيجة وشوف تقدمك <ArrowLeft size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="quiz-meta">
              <span>{q.skill}</span>
              <span>
                السؤال {index + 1} من {items.length}
              </span>
            </div>
            <div className="quiz-progress">
              <span
                style={{ width: `${((index + 1) / items.length) * 100}%` }}
              />
            </div>
            {q.passage && (
              <p className="reading-passage" dir="ltr">
                {q.passage}
              </p>
            )}
            {q.audio && (
              <div className="audio-question">
                <button
                  className="outline-button"
                  onClick={() => {
                    if (!speak(q.audio))
                      setAudioError(
                        "صوت المتصفح غير متاح. افتح نص المقطع للمتابعة.",
                      );
                  }}
                >
                  <Volume2 size={20} /> استمع للمقطع
                </button>
                {audioError && <p role="alert">{audioError}</p>}
                <details>
                  <summary>عرض النص (لإتاحة الوصول)</summary>
                  <p dir="ltr">{q.audio}</p>
                </details>
              </div>
            )}
            <h2 className="question" dir="ltr">
              {q.prompt}
            </h2>
            <div className="answer-options" dir="ltr">
              {q.options.map((o, i) => (
                <button
                  key={o}
                  disabled={revealed}
                  aria-pressed={selected === i}
                  className={`${selected === i ? "chosen " : ""}${revealed && i === q.answer ? "correct " : ""}${revealed && selected === i && i !== q.answer ? "incorrect" : ""}`}
                  onClick={() => setSelected(i)}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {o}
                  {revealed && i === q.answer && <Check size={18} />}
                </button>
              ))}
            </div>
            {revealed && (
              <div className="explanation" role="status">
                <strong>
                  {selected === q.answer
                    ? "إجابة صحيحة، أحسنت!"
                    : "نتعلم منها. الإجابة الصحيحة موضحة بالأخضر."}
                </strong>
                <p>
                  {getLanguage() === "en" && q.explanationEn
                    ? q.explanationEn
                    : q.explanation}
                </p>
              </div>
            )}
            <div className="quiz-actions">
              <span>
                {revealed
                  ? "الفهم أهم من سرعة الإجابة."
                  : "اختر الإجابة الأقرب."}
              </span>
              <button
                className="primary-button"
                disabled={selected === null}
                onClick={() => (revealed ? next() : setRevealed(true))}
              >
                {revealed
                  ? index === items.length - 1
                    ? "شوف النتيجة"
                    : "السؤال التالي"
                  : "تحقّق من إجابتي"}
                <ArrowLeft size={17} />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
function WordLibrary({ data, update, setToast }) {
  const [index, setIndex] = useState(0),
    [flipped, setFlipped] = useState(false),
    [filter, setFilter] = useState("all");
  const list =
    filter === "saved"
      ? words.filter((w) => data.known.includes(w.word))
      : words;
  const w = list[Math.min(index, Math.max(list.length - 1, 0))];
  const shift = (delta) => {
    setIndex((index + delta + list.length) % list.length);
    setFlipped(false);
  };
  return (
    <>
      <PageHeading
        title="كلمة جديدة، مساحة أوسع"
        description="اسمعها، افهمها في سياقها، ثم جرّب تستخدمها. الكلمات محفوظة محليًا، وتتم مزامنتها عند تسجيل الدخول."
      />
      <div className="library-toolbar">
        <div className="segmented">
          <button
            className={filter === "all" ? "selected" : ""}
            onClick={() => {
              setFilter("all");
              setIndex(0);
              setFlipped(false);
            }}
          >
            كل الكلمات
          </button>
          <button
            className={filter === "saved" ? "selected" : ""}
            onClick={() => {
              setFilter("saved");
              setIndex(0);
              setFlipped(false);
            }}
          >
            أتقنتها ({data.known.length})
          </button>
        </div>
        <span>{list.length} كلمات</span>
      </div>
      {!w ? (
        <div className="empty-state">
          <Bookmark size={40} />
          <h2>حصيلتك تبدأ بكلمة</h2>
          <p>تصفّح الكلمات واضغط «أتقنتها» بعد مراجعتها.</p>
          <button className="primary-button" onClick={() => setFilter("all")}>
            استكشف الكلمات
          </button>
        </div>
      ) : (
        <>
          <div className="flashcard">
            <span className="flashcard-counter">
              {Math.min(index, list.length - 1) + 1} / {list.length}
            </span>
            <button
              className="icon-button"
              aria-label="استمع للكلمة"
              onClick={() => {
                if (!speak(w.word)) setToast("الصوت غير متاح في متصفحك.");
              }}
            >
              <Volume2 />
            </button>
            <div dir="ltr">
              <small>{w.type}</small>
              <h2>
                {w.word}
                <span>.</span>
              </h2>
              <p>{w.example}</p>
            </div>
            {flipped ? (
              <p className="flashcard-meaning">{w.meaning}</p>
            ) : (
              <button
                className="outline-button"
                onClick={() => setFlipped(true)}
              >
                <RotateCcw size={17} /> اكشف المعنى
              </button>
            )}
          </div>
          <div className="flashcard-controls">
            <button className="outline-button" onClick={() => shift(-1)}>
              <ArrowRight size={18} /> السابقة
            </button>
            <button
              className="primary-button"
              onClick={() => {
                if (!data.known.includes(w.word)) {
                  update((d) => ({
                    ...d,
                    known: [...d.known, w.word],
                    days: [...new Set([...d.days, dateKey()])],
                  }));
                  setToast("كلمة جديدة في حصيلتك!");
                } else {
                  update((d) => ({
                    ...d,
                    known: d.known.filter((k) => k !== w.word),
                  }));
                  setToast("أعدنا الكلمة للمراجعة.");
                }
              }}
            >
              {data.known.includes(w.word) ? (
                <RotateCcw size={17} />
              ) : (
                <Check size={17} />
              )}{" "}
              {data.known.includes(w.word) ? "أحتاج أراجعها" : "أتقنتها"}
            </button>
            <button className="outline-button" onClick={() => shift(1)}>
              التالية <ArrowLeft size={18} />
            </button>
          </div>
        </>
      )}
    </>
  );
}
function SettingsDialog({ data, update, user, logout, openAccount, close }) {
  const [name, setName] = useState(data.name),
    [goal, setGoal] = useState(data.goal);
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className="modal-backdrop">
      <form
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="إعدادات رحلتك"
        onSubmit={(e) => {
          e.preventDefault();
          update({ name: name.trim() || "متعلّم", goal: Number(goal) });
          close();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
          if (e.key === "Tab") {
            const els = [...e.currentTarget.querySelectorAll("button,input")];
            if (!e.shiftKey && document.activeElement === els.at(-1)) {
              e.preventDefault();
              els[0].focus();
            } else if (e.shiftKey && document.activeElement === els[0]) {
              e.preventDefault();
              els.at(-1).focus();
            }
          }
        }}
      >
        <div className="dialog-header">
          <h2>خلّها رحلتك</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="إغلاق"
            onClick={close}
          >
            <X />
          </button>
        </div>
        <label>
          بماذا نناديك؟
          <input
            ref={ref}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            required
          />
        </label>
        <label>
          هدفك في STEP (من ١ إلى ١٠٠)
          <input
            type="number"
            min="1"
            max="100"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            required
          />
        </label>
        <p className="footnote">
          {user
            ? `${getLanguage() === "ar" ? "مسجّل بالبريد" : "Signed in as"} ${user.email}`
            : "تقدمك محفوظ على هذا المتصفح. أنشئ حسابًا لمتابعته من جهاز آخر."}
        </p>
        {user ? (
          <button
            type="button"
            className="text-button account-dialog-action"
            onClick={logout}
          >
            <LogOut size={16} /> تسجيل الخروج
          </button>
        ) : (
          <button
            type="button"
            className="text-button account-dialog-action"
            onClick={openAccount}
          >
            دخول / إنشاء حساب <ArrowLeft size={16} />
          </button>
        )}
        <button className="primary-button" type="submit">
          احفظ إعداداتي <Check size={17} />
        </button>
      </form>
    </div>
  );
}
function Plans({ setToast }) {
  return (
    <>
      <PageHeading
        title="تعلّم يناسب طموحك"
        description="تصور أولي للباقات. الأسعار المقترحة قابلة للتغيير، والاشتراك والدفع غير متاحين بعد."
      />
      <div className="plans">
        <section>
          <BookOpen size={28} />
          <h2>البداية</h2>
          <p>مساحة تبني فيها عادتك</p>
          <strong>مجانية</strong>
          <ul>
            <li>
              <Check /> تدريبات STEP الحالية
            </li>
            <li>
              <Check /> بطاقات المفردات
            </li>
            <li>
              <Check /> حفظ التقدم ومزامنته للحساب
            </li>
          </ul>
          <span className="plan-current">متاحة الآن</span>
        </section>
        <section className="featured-plan">
          <Crown size={28} />
          <h2>طلاقة بلس</h2>
          <p>معلم يرافق رحلتك</p>
          <strong>
            ٤٩ <small>ر.س / شهر • مقترح</small>
          </strong>
          <ul>
            <li>
              <Check /> محادثة كتابية بالذكاء الاصطناعي
            </li>
            <li>
              <Check /> إملاء وقراءة صوتية
            </li>
            <li>
              <Check /> خطة تعلم مخصصة — مخطط لها
            </li>
          </ul>
          <button
            className="primary-button"
            onClick={() =>
              setToast("الاشتراكات لم تُفتح بعد. لا تُحصّل أي مبالغ حاليًا.")
            }
          >
            قريبًا — الاشتراكات لم تُفتح
          </button>
        </section>
      </div>
      <div className="notice">
        <ShieldCheck size={22} />
        <p>
          تفعيل الاشتراكات يحتاج بوابة دفع وحدود استخدام تجارية. الوصول الحالي
          للمعلم يعتمد على إعداد خدمة AI.
        </p>
      </div>
    </>
  );
}
function AuthDialog({ onSuccess, close }) {
  const [register, setRegister] = useState(false),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        "/api/auth/" + (register ? "register" : "login"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      await onSuccess(body.user);
    } catch (e) {
      setError(e.message || "تعذر الاتصال. حاول مجددًا.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="modal-backdrop">
      <form
        className="settings-dialog auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="حساب طلاقة"
        onSubmit={submit}
        onKeyDown={(e) => {
          if (e.key === "Escape" && !busy) close();
          if (e.key === "Tab") {
            const els = [
              ...e.currentTarget.querySelectorAll(
                "button:not(:disabled),input",
              ),
            ];
            if (!e.shiftKey && document.activeElement === els.at(-1)) {
              e.preventDefault();
              els[0].focus();
            } else if (e.shiftKey && document.activeElement === els[0]) {
              e.preventDefault();
              els.at(-1).focus();
            }
          }
        }}
      >
        <div className="dialog-header">
          <h2>{register ? "ابدأ رحلتك مع طلاقة" : "أهلًا بعودتك"}</h2>
          <button
            disabled={busy}
            type="button"
            className="icon-button"
            aria-label="إغلاق الحساب"
            onClick={close}
          >
            <X />
          </button>
        </div>
        <p className="auth-description">
          احفظ تقدمك وتابع تعلّمك من أي جهاز متصل بنفس الخادم.
        </p>
        {register && (
          <label>
            اسمك
            <input
              autoComplete="given-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              required
            />
          </label>
        )}
        <label>
          البريد الإلكتروني
          <input
            ref={ref}
            type="email"
            dir="ltr"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            required
          />
        </label>
        <label>
          كلمة المرور
          <input
            type="password"
            dir="ltr"
            minLength={10}
            maxLength={128}
            autoComplete={register ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <p className="footnote">
          ١٠ أحرف على الأقل. استعادة كلمة المرور والتحقق من البريد غير متاحين في
          هذه النسخة.
        </p>
        {error && (
          <div className="inline-error" role="alert">
            {error}
          </div>
        )}
        <button disabled={busy} type="submit" className="primary-button">
          {busy ? (
            <>
              <LoaderCircle size={17} /> لحظة…
            </>
          ) : register ? (
            "أنشئ حسابي"
          ) : (
            "تسجيل الدخول"
          )}
        </button>
        <button
          type="button"
          disabled={busy}
          className="text-button auth-switch"
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register ? "عندك حساب؟ سجّل دخولك" : "أول مرة؟ أنشئ حسابًا"}
        </button>
        <p className="footnote">
          يُحفظ البريد والاسم والتقدم في قاعدة بيانات الخادم. تُخزّن كلمة المرور
          كتجزئة آمنة؛ المحادثات تبقى في المتصفح.
        </p>
      </form>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
