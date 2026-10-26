import { test, expect } from "@playwright/test";
test("home, preferences and vocabulary survive refresh", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /كل يوم/ })).toBeVisible();
  await page.getByRole("button", { name: "تعديل الهدف" }).click();
  await page.getByLabel("بماذا نناديك؟").fill("نورة");
  await page.getByLabel(/هدفك في STEP/).fill("95");
  await page.getByRole("button", { name: "احفظ إعداداتي" }).click();
  await page.getByRole("button", { name: "مكتبتي", exact: true }).click();
  await page.getByRole("button", { name: "اكشف المعنى" }).click();
  await expect(page.getByText("يحقق / ينجز", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "أتقنتها", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "أتقنتها (1)" })).toBeVisible();
  await page.getByRole("button", { name: "رحلتي", exact: true }).click();
  await expect(page.getByText("95 / 100", { exact: true })).toBeVisible();
});
test("grammar exercise explains answers and persists actual result", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "تدريب STEP", exact: true }).click();
  await page.getByRole("button", { name: /القواعد ابنِ/ }).click();
  for (const [i, answer] of [
    "studies",
    "would learn",
    "had started",
    "that",
  ].entries()) {
    await page.getByRole("button", { name: new RegExp(answer + "$") }).click();
    await page.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    await expect(page.getByText("إجابة صحيحة، أحسنت!")).toBeVisible();
    await page
      .getByRole("button", { name: i === 3 ? "شوف النتيجة" : "السؤال التالي" })
      .click();
  }
  await page.getByRole("button", { name: "احفظ النتيجة وشوف تقدمك" }).click();
  await expect(page.getByText("4 / 4", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "تقدّمي", exact: true }).click();
  await expect(page.getByText("4 / 4", { exact: true })).toBeVisible();
});
test("teacher accurately marks unavailable AI and fixed demo", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /المعلم الذكي AI/ }).click();
  await expect(
    page.getByText("بانتظار تفعيل الخدمة", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "جرّب مثالًا تعليميًا ثابتًا" })
    .click();
  await page
    .getByRole("textbox", { name: "رسالتك للمعلم" })
    .fill("Hello teacher");
  await page.getByRole("button", { name: "إرسال الرسالة" }).click();
  await expect(page.getByText(/هذا مثال تعليمي ثابت، وليس ردًا/)).toBeVisible();
  await page.getByRole("button", { name: "مسح المحادثة" }).click();
  await expect(page.getByText("الغلط أول خطوة للتعلّم.")).toBeVisible();
});
test("mobile navigation works without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "فتح القائمة" }).click();
  await page.getByRole("button", { name: "مكتبتي", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "كلمة جديدة، مساحة أوسع" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
test("new learner account syncs vocabulary and survives logout/login", async ({
  page,
}) => {
  const email = `pilot-${Date.now()}@example.test`;
  const password = "secure-pilot-password";
  try {
    await page.goto("/");
    await page
      .getByRole("button", { name: "دخول / حساب جديد", exact: true })
      .click();
    await page.getByRole("button", { name: "أول مرة؟ أنشئ حسابًا" }).click();
    await page.getByLabel("اسمك", { exact: true }).fill("متعلم الاختبار");
    await page.getByLabel("البريد الإلكتروني", { exact: true }).fill(email);
    await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
    await page.getByRole("button", { name: "أنشئ حسابي" }).click();
    await expect(page.getByRole("dialog", { name: "حساب طلاقة" })).toHaveCount(
      0,
    );
    await page.getByRole("button", { name: "مكتبتي", exact: true }).click();
    await page.getByRole("button", { name: "أتقنتها", exact: true }).click();
    await expect(
      page.getByText("محفوظ في حسابك", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "إعدادات الحساب" }).click();
    await page
      .getByRole("button", { name: "تسجيل الخروج", exact: true })
      .click();
    await page
      .getByRole("button", { name: "دخول / حساب جديد", exact: true })
      .click();
    await page.getByLabel("البريد الإلكتروني", { exact: true }).fill(email);
    await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
    await page
      .getByRole("button", { name: "تسجيل الدخول", exact: true })
      .click();
    await expect(page.getByRole("dialog", { name: "حساب طلاقة" })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("button", { name: "أتقنتها (1)" }),
    ).toBeVisible();
  } finally {
    const { DatabaseSync } = await import("node:sqlite");
    const db = new DatabaseSync("data/talaqa.sqlite");
    const user = db.prepare("SELECT id FROM users WHERE email=?").get(email);
    if (user) {
      db.prepare("DELETE FROM sessions WHERE user_id=?").run(user.id);
      db.prepare("DELETE FROM progress WHERE user_id=?").run(user.id);
      db.prepare("DELETE FROM users WHERE id=?").run(user.id);
    }
    db.close();
  }
});
