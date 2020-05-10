"use strict";

import { char, symbol } from "./type.js";
import { pair, car, cdr } from "./pair.js";
import { nil, o, s_apply, s_lit, t } from "./sym.js";
import { init, pushR, regE, result, tick } from "./vm.js";

function all(f, x) {
  while (true) {
    if (x === nil) {
      return true;
    }

    if (!f(car(x))) {
      return false;
    }

    x = cdr(x);
  }
}

function proper(x) {
  while (true) {
    if (x === nil) {
      return true;
    }

    if (!pair(x)) {
      return false;
    }

    x = cdr(x);
  }
}

function string(e) {
  if (!proper(e)) {
    return false;
  }

  return all(char, e);
}

function literal(e) {
  if (symbol(e) && (e === nil || e === t || e === o || e === s_apply)) {
    return true;
  }

  if (char(e)) {
    return true;
  }

  if (pair(e) && car(e) === s_lit) {
    return true;
  }

  if (string(e)) {
    return true;
  }

  return false;
}

export function bel(e) {
  init(e);

  do {
    evl()
  } while (tick());

  return result();
}

function evl() {
  let e = regE();

  if (literal(e)) {
    pushR(e);
    return;
  }

  throw new Error("bad exp -- EVL");
}
