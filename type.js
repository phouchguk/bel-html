"use strict";

import { pair } from "./pair.js"

const SYM = 0;
const CHR = 1;
const NUM = 2;

const VAL_MASK = Math.pow(2, 29) - 1;
const CHR_MASK = CHR << 29;
const NUM_MASK = NUM << 29;

export const CHR_PFX = "\\";

function type(x) {
  return x >> 29;
}

export function toChar(n) {
  return n + CHR_MASK;
}

export function toNum(n) {
  return n + NUM_MASK;
}

export function char(x) {
  return !pair(x) && type(x) === CHR;
}

export function number(x) {
  return !pair(x) && type(x) === NUM;
}

export function symbol(x) {
  return !pair(x) && type(x) === SYM;
}

export function val(x) {
  return x & VAL_MASK;
}
