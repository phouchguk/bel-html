"use strict";

const syms = ["nil", "t", "o", "apply", "lit"];

export const nil = 0;
export const t = 1;
export const o = 2;

export const s_apply = 3;
export const s_lit = 4;

export function sym(s) {
  let i = syms.indexOf(s);

  if (i === -1) {
    i = syms.length;
    syms.push(s);
  }

  return i;
}

export function getSym(i) {
  return syms[i];
}
