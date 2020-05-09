"use strict";

const syms = ["nil", "t", "o", "apply"];

export const nil = 0;

export function sym(s) {
  let i = syms.indexOf(s);

  if (i === -1) {
    i = syms.length;
    syms.push(s);
  }

  return i;
}
