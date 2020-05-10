"use strict";

import { char, symbol } from "./type.js";
import { pair, car, cdr, cadr, cddr, join, list, smark } from "./pair.js";
import { nil, o, s_apply, s_globe, s_err, s_fut, s_if, s_lit, s_malformed, s_quote, s_scope, s_unbound, t } from "./sym.js";
import { binding, init, inwhere, popR, pushR, pushS, regA, regE, regG, result, tick } from "./vm.js";
import { pr } from "./print.js";

// MARKS
const vmark = join(nil, nil);

function atom(e) {
  return !pair(e);
}

function get(k, l) {
  while(l) {
    let i = car(l);

    if (car(i) === k) {
      return i;
    }

    l = cdr(l);
  }
}

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

function variable(e) {
  return atom(e) ? !literal(e) : car(e) === vmark;
}

export function bel(e) {
  init(e);

  do {
    evl()
  } while (tick());

  return result();
}

function applyf(f, args, a) {
}

function sigerr(e) {
  let val = binding(s_err);

  if (val) {
    applyf(cdr(val), join(e, nil), nil);
    return;
  }

  throw new Error("no err");
}

function lookup(v) {
  let val = binding(v);

  if (val) {
    return val;
  }

  let a = regA();
  val = get(v, a);

  if (val) {
    return val;
  }

  let g = regG();
  val = get(v, g);

  if (val) {
    return val;
  }

  if (v === s_scope) {
    return join(v, a);
  }

  if (v === s_globe) {
    return join(v, g);
  }

  return false;
}

function vref(v) {
  if (inwhere()) {
    // blah
    return nil;
  }

  let val = lookup(v);

  if (val) {
    pushR(cdr(val));
  } else {
    sigerr(join(s_unbound, join(v, nil)));
  }
}

function special(e) {
  return e === smark || e === s_quote || e === s_if;
}

function fu(tag, args) {
  return list(smark, s_fut, tag, args);
}

function evfut(tag, args) {
  if (tag === s_if) {
    let es = car(args);
    let r = popR();
    let a = regA();

    if (r !== nil) {
      // consequent
      pushS(car(es), a);
    } else {
      pushS(join(s_if, cdr(es)), a);
    }

    return;
  }

  throw new Error("unknown fut");
}

function evmark(f, args) {
  const m = car(args);

  if (m === s_fut) {
    evfut(cadr(args), cddr(args));
    return;
  }

  throw new Error("unknown mark");
}

function form(f, args) {
  if (f === smark) {
    evmark(f, args);
  }

  if (f === s_quote) {
    pushR(car(args));
    return;
  }

  if (f === s_if) {
    if (args === nil) {
      pushR(nil);
      return;
    }

    let a = regA();

    if (cdr(args)) {
      // push to eval conseq/alt
      pushS(fu(s_if, cdr(args)), a);
    }

    // push to eval predicate
    pushS(car(args), a);

    return;
  }
}

function evl() {
  let e = regE();

  if (literal(e)) {
    pushR(e);
    return;
  }

  if (variable(e)) {
    vref(e);
    return;
  }

  if (!proper(e)) {
    sigerr(s_malformed);
    return;
  }

  if (special(car(e))) {
    form(car(e), cdr(e));
    return;
  }

  throw new Error("bad exp -- EVL");
}
