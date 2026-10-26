export function readPreference(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}
export function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
const language = readPreference("talaqa-language", "ar");
document.documentElement.lang = language === "en" ? "en" : "ar";
document.documentElement.dir = language === "en" ? "ltr" : "rtl";
const theme = readPreference(
  "talaqa-theme",
  matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
);
document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
