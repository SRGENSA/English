import {
  jsx as originalJsx,
  jsxs as originalJsxs,
  Fragment,
} from "react/jsx-runtime";
import { localize } from "./core";
export { Fragment };
export const jsx = (type, props, key) =>
  originalJsx(type, localize(props), key);
export const jsxs = (type, props, key) =>
  originalJsxs(type, localize(props), key);
