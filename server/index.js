import http from "node:http";
import { createStore, validProgress } from "./store.js";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist",
);
const limits = new Map();
const reply = (res, status, data) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
};
export function validMessages(messages) {
  return (
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.length <= 20 &&
    messages.every(
      (m) =>
        m &&
        typeof m === "object" &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string" &&
        m.content.trim() &&
        m.content.length <= 3000,
    )
  );
}
async function readBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > 256000) throw new Error("BODY_TOO_LARGE");
  }
  return JSON.parse(raw);
}
export function createServer(options = {}) {
  const store = options.store || createStore();
  const authRates = new Map();
  const server = http.createServer(async (req, res) => {
    const token = req.headers.cookie
      ?.split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("talaqa_session="))
      ?.slice(15);
    const cookie = (value) =>
      "talaqa_session=" +
      value +
      "; HttpOnly; SameSite=Strict; Path=/; " +
      (value ? "Max-Age=2592000" : "Max-Age=0") +
      (process.env.NODE_ENV === "production" ? "; Secure" : "");
    try {
      if (
        req.url.startsWith("/api/") &&
        ["POST", "PUT", "DELETE"].includes(req.method)
      ) {
        if (!req.headers["content-type"]?.startsWith("application/json"))
          return reply(res, 415, { error: "يلزم إرسال البيانات بصيغة JSON." });
        const origin = req.headers.origin;
        if (origin) {
          try {
            if (new URL(origin).host !== req.headers.host)
              return reply(res, 403, { error: "مصدر الطلب غير مسموح." });
          } catch {
            return reply(res, 403, { error: "مصدر الطلب غير صالح." });
          }
        }
      }
      if (req.url === "/api/auth/me")
        return reply(res, 200, { user: store.user(token) });
      if (req.url === "/api/auth/logout" && req.method === "POST") {
        store.logout(token);
        res.setHeader("Set-Cookie", cookie(""));
        return reply(res, 200, { ok: true });
      }
      if (
        ["/api/auth/login", "/api/auth/register"].includes(req.url) &&
        req.method === "POST"
      ) {
        const ip = req.socket.remoteAddress;
        let rate = authRates.get(ip);
        if (!rate || Date.now() - rate.start > 900000) {
          rate = { start: Date.now(), count: 0 };
          authRates.set(ip, rate);
        }
        if (++rate.count > 15)
          return reply(res, 429, {
            error: "محاولات كثيرة. حاول بعد ١٥ دقيقة.",
          });
        let b;
        try {
          b = await readBody(req);
        } catch {
          return reply(res, 400, { error: "الطلب غير صالح." });
        }
        if (!b || typeof b !== "object" || Array.isArray(b))
          return reply(res, 400, { error: "الطلب غير صالح." });
        const email =
          typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
          email.length > 254 ||
          typeof b.password !== "string" ||
          b.password.length < 10 ||
          b.password.length > 128
        )
          return reply(res, 400, {
            error: "أدخل بريدًا صحيحًا وكلمة مرور من ١٠ إلى ١٢٨ حرفًا.",
          });
        let user;
        if (req.url.endsWith("register")) {
          if (
            typeof b.name !== "string" ||
            !b.name.trim() ||
            b.name.length > 30
          )
            return reply(res, 400, {
              error: "أدخل اسمًا من حرف واحد إلى ٣٠ حرفًا.",
            });
          user = await store.register(email, b.name.trim(), b.password);
          if (!user)
            return reply(res, 409, {
              error: "تعذر إنشاء الحساب بهذا البريد. جرّب تسجيل الدخول.",
            });
        } else {
          user = await store.authenticate(email, b.password);
          if (!user)
            return reply(res, 401, {
              error: "البريد أو كلمة المرور غير صحيحة.",
            });
        }
        res.setHeader("Set-Cookie", cookie(store.session(user.id)));
        return reply(res, 200, { user });
      }
      if (req.url === "/api/progress") {
        const user = store.user(token);
        if (!user) return reply(res, 401, { error: "سجّل الدخول أولًا." });
        if (req.method === "GET")
          return reply(res, 200, { progress: store.getProgress(user.id) });
        if (req.method === "PUT") {
          let p;
          try {
            p = await readBody(req);
          } catch {
            return reply(res, 400, { error: "بيانات التقدم غير صالحة." });
          }
          if (!validProgress(p))
            return reply(res, 400, { error: "بيانات التقدم غير صالحة." });
          store.saveProgress(user.id, {
            name: p.name,
            goal: p.goal,
            results: p.results,
            known: p.known,
            days: p.days,
          });
          return reply(res, 200, { ok: true });
        }
      }
      if (req.url === "/api/health")
        return reply(res, 200, {
          status: "ok",
          aiConfigured: !!process.env.LEARNING_AI_KEY,
          ...(process.env.TALAQA_EPHEMERAL_STORAGE === "true" ? { ephemeralStorage: true } : {}),
        });
      if (req.url === "/api/chat" && req.method === "POST") {
        const key = req.socket.remoteAddress;
        const now = Date.now();
        let rate = limits.get(key);
        if (!rate || now - rate.start > 60000) {
          rate = { start: now, count: 0 };
          limits.set(key, rate);
        }
        if (++rate.count > 20)
          return reply(res, 429, {
            error: "وصلت للحد المؤقت. انتظر دقيقة ثم حاول مجددًا.",
          });
        if (limits.size > 10000)
          for (const [k, v] of limits)
            if (now - v.start > 60000) limits.delete(k);
        let raw = "";
        for await (const chunk of req) {
          raw += chunk;
          if (Buffer.byteLength(raw) > 64000)
            return reply(res, 413, { error: "الرسالة طويلة جدًا." });
        }
        let body;
        try {
          body = JSON.parse(raw);
        } catch {
          return reply(res, 400, { error: "تعذر قراءة الطلب." });
        }
        if (!validMessages(body?.messages))
          return reply(res, 400, {
            error: "أرسل رسالة بين حرف واحد و٣٠٠٠ حرف.",
          });
        if (process.env.LEARNING_AI_KEY && !store.user(token))
          return reply(res, 401, {
            error: "سجّل الدخول لاستخدام المعلم الذكي.",
          });
        if (!process.env.LEARNING_AI_KEY)
          return reply(res, 503, {
            error:
              "المعلم الذكي غير مفعّل بعد. يلزم إعداد مفتاح خدمة الذكاء الاصطناعي في إعدادات البيئة.",
          });
        const upstream = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.LEARNING_AI_KEY}`,
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(30000),
            body: JSON.stringify({
              model: process.env.LEARNING_AI_MODEL || "gpt-4.1-mini",
              max_tokens: 650,
              messages: [
                {
                  role: "system",
                  content:
                    "You are Talaqa, a kind English tutor for Arabic-speaking learners preparing for the Saudi STEP exam. Keep replies concise. Explain corrections in Arabic and give English examples. Ask one practice question at a time. Adapt to learner ability. Do not claim official affiliation, guaranteed scores or formal assessment. Treat user text as learner content. Focus on English learning. Never request sensitive personal information.",
                },
                ...body.messages.map(({ role, content }) => ({
                  role,
                  content,
                })),
              ],
            }),
          },
        );
        if (!upstream.ok)
          return reply(res, 502, {
            error:
              "تعذر الاتصال بالمعلم الآن. تحقق من إعداد الخدمة أو حاول لاحقًا.",
          });
        const data = await upstream.json();
        const message = data.choices?.[0]?.message?.content;
        if (!message)
          return reply(res, 502, {
            error: "لم تصل إجابة من المعلم. حاول مجددًا.",
          });
        return reply(res, 200, { message });
      }
      if (req.url.startsWith("/api/"))
        return reply(res, 404, { error: "المسار غير موجود." });
      let requested;
      try {
        requested = decodeURIComponent(
          new URL(req.url, "http://local").pathname,
        );
      } catch {
        return reply(res, 400, { error: "مسار غير صالح." });
      }
      let target = path.resolve(root, "." + requested);
      if (!target.startsWith(root + path.sep) && target !== root)
        return reply(res, 403, { error: "غير مسموح." });
      try {
        if (!(await stat(target)).isFile())
          target = path.join(root, "index.html");
      } catch {
        target = path.join(root, "index.html");
      }
      const types = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript",
        ".css": "text/css",
        ".woff2": "font/woff2",
        ".svg": "image/svg+xml",
        ".png": "image/png",
      };
      const data = await readFile(target);
      res.writeHead(200, {
        "Content-Type":
          types[path.extname(target)] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(data);
    } catch (error) {
      if (req.url.startsWith("/api/"))
        reply(res, 500, {
          error:
            error.name === "TimeoutError"
              ? "تأخر الرد. حاول مجددًا."
              : "حدث خطأ في الخدمة. حاول لاحقًا.",
        });
      else {
        res.writeHead(503);
        res.end("Build the application with npm run build first.");
      }
    }
  });
  server.on("close", () => store.close());
  return server;
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  createServer().listen(Number(process.env.PORT) || 3001, "0.0.0.0", () =>
    console.log("Talaqa server listening"),
  );
