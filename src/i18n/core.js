import english from "./en.json";
export const getLanguage = () =>
  document.documentElement.lang === "en" ? "en" : "ar";
export function translate(value) {
  if (typeof value !== "string" || getLanguage() !== "en") return value;
  const normalized = value.replace(/\s+/g, " ").trim();
  const result = english[normalized];
  if (result === undefined) return value;
  return (
    (/^\s/.test(value) ? " " : "") + result + (/\s$/.test(value) ? " " : "")
  );
}
export function localize(props) {
  if (!props || props["data-localize"] === false) return props;
  const p = { ...props };
  const children = (v) => (Array.isArray(v) ? v.map(children) : translate(v));
  if ("children" in p) p.children = children(p.children);
  for (const k of ["aria-label", "title", "placeholder", "alt"])
    if (k in p) p[k] = translate(p[k]);
  return p;
}
