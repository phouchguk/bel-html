"use strict";

import { char, symbol } from "./type.js";
import { pair, car, cdr, cadr, cddr, caddr, get, join, list, reverse, smark, vmark, xdr } from "./pair.js";
import { nil, o, s_after, s_apply, s_bind, s_car, s_cdr, s_ccc, s_clo, s_d, s_dyn, s_err, s_evcall, s_fut, s_globe, s_if, s_lit, s_loc, s_mac, s_malformed, s_prim, s_prot, s_quote, s_scope, s_thread, s_unbound, s_unfindable, s_where, t } from "./sym.js";
import { binding, dropS, init, inwhere, popR, pushR, pushS, regA, regE, regG, regS, regR, result, thread, tick } from "./vm.js";
import { pr } from "./print.js";

function atom(e) {
  return !pair(e);
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

function applyprim(f, args) {
  if (f === s_car) {
    pushR(car(car(args)));
    return;
  }

  if (f === s_cdr) {
    pushR(cdr(car(args)));
    return;
  }

  throw new Error("bad prim");
}

function applylit(f, args) {
  // if inwhere and calling car or cdr need to wrap somehow?

  let lit = cdr(f);
  let tag = car(lit);
  let rest = cdr(lit);

  if (tag === s_prim) {
    applyprim(car(rest), args);
    return;
  }

  if (tag == s_clo) {

  }

  if (tag === s_cont) {

  }

  console.log("applylit");
  pr(f);
  pr(args);
}

function applyf(f, args) {
  if (f === s_apply) {
    f = car(args);

    let rev = reverse(cdr(args), nil);
    args = reverse(cdr(rev), car(rev));
  }

  if (!pair(f) && car(f) === s_lit) {
    sigerr(s_cannot_apply);
    return;
  }

  if (!proper(f)) {
    sigerr(s_bad_lit);
    return;
  }

  applylit(f, args);
}

function applym(mac, args) {
}

function sigerr(e) {
  let val = binding(s_err);

  if (val) {
    applyf(cdr(val), join(e, nil));
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
  let val = lookup(v);
  let w = inwhere();

  if (w) {
    dropS(); // drop where smark in stack

    if (val) {
      // variable already exists, return its location
      pushR(list(val, s_d));
      return;
    }

    if (car(w) !== nil) {
      // if 'new' set, create a new variable
      let cell = join(v, nil);
      let g = regG();
      xdr(g, join(cell, cdr(g)));
      pushR(list(cell, s_d));

      return;
    }

    sigerr(s_unbound);
  }

  if (val) {
    pushR(cdr(val));
  } else {
    sigerr(join(s_unbound, join(v, nil)));
  }
}

function special(e) {
  return e === smark || e === s_quote || e === s_if || e === s_where || e === s_dyn || e === s_after || e === s_ccc || e === s_thread;
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

  if (tag === s_dyn) {
    args = car(args);
    let v = car(args);
    let e2 = cadr(args);
    let r = popR();
    let a = regA();

    // bind v to r in stack i.e. dynamic
    pushS(list(smark, s_bind, join(v, r)), nil);

    // evaluate e2 with v dynamically bound to r
    pushS(e2, a);

    return;
  }

  if (tag === s_after) {
    // discard e2 result;
    popR();

    return;
  }

  if (tag === s_evcall) {
    let op = popR();
    let es = car(args);

    if (op !== s_apply && cadr(op) === s_mac) {
      // macros don't evaluate their args
      applym(op, es);
      return;
    }

    let a = regA();

    // queue fn eval fut (needs es to know how much r of args to pop)
    pushS(fu(s_clo, list(op, es)), a);

    // queue args onto expression stack
    while (es) {
      pushS(car(es), a);
      es = cdr(es);
    }

    return;
  }

  if (tag === s_clo) {
    args = car(args);
    let op = car(args);
    let es = cadr(args);

    args = nil;

    // just using es to pop off the right amount of r args
    while (es) {
      args = join(popR(), args);
      es = cdr(es);
    }

    applyf(op, reverse(args, nil));

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

  if (m === s_loc) {
    sigerr(s_unfindable);
    return;
  }

  if (m === s_bind) {
    // binding expires, do nothing
    return;
  }

  if (m === s_prot) {
    let a = regA();
    let e2 = cadr(args);

    // queue future to discard e2's result (so e1's result remains)
    pushS(fu(s_after, nil), a);

    // queue e2
    pushS(e2, a);

    return;
  }

  throw new Error("unknown mark");
}

function form(f, args) {
  if (f === smark) {
    evmark(f, args);
    return;
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

  if (f === s_where) {
    let e = car(args);
    let n = cdr(args) === nil ? nil : cadr(args);
    pushS(list(smark, s_loc, n), nil);
    pushS(e, regA());

    return;
  }

  if (f === s_dyn) {
    let v = car(args);
    let e1 = cadr(args);
    let e2 = caddr(args);

    let a = regA();

    // queue to bind result of e1 eval to v and eval e2
    pushS(fu(s_dyn, list(v, e2)), a)

    // evaluate e1 to get value of v
    pushS(e1, a);

    return;
  }

  if (f === s_after) {
    let a = regA();

    let e1 = car(args);
    let e2 = cadr(args);

    pushS(list(smark, s_prot, e2), a);
    pushS(e1, a);

    return;
  }

  if (f === s_ccc) {
    let a = regA();
    let f = car(args);

    pushS(list(f, list(s_lit, s_cont, regS(), regR())), a);

    return;
  }

  if (f === s_thread) {
    let e = car(args);

    pushR(nil); // result of thread call in current thread is nil
    thread(e); // queue e on a new thread

    return;
  }

  throw new Error("unknown special");
}

function evcall(e) {
  let op = car(e);
  let a = regA();

  // queue future to eval args
  pushS(fu(s_evcall, cdr(e)), a);

  // queue eval op
  pushS(op, a);
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

  evcall(e);
  return;
}
