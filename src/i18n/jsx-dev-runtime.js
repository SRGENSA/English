import { jsxDEV as original, Fragment } from "react/jsx-dev-runtime";
import { localize } from "./core";
export { Fragment };
export const jsxDEV = (type, props, ...rest) =>
  original(type, localize(props), ...rest);
