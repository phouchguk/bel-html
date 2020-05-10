"use strict";

import { toNum } from "./type.js";
import { join, pair, car, cdr, cadr, cddr, caddr, get, l2, list, reverse, smark, xdr } from "./pair.js";
import { nil, s_bind, s_loc, s_lock, sym } from "./sym.js";
import { pr } from "./print.js";

// STACKS

// current expression stack (e a)...
let S = nil;

// current return value stack e....
let R = nil;

// thread stack (s r)...
let P = nil;


// REGISTERS

// expression
let E = nil;

// lexical environment
let A = nil;

// global environment
let G = l2(tvar("a", 42), tvar("b", 99));

function tvar(v, val) {
  return join(sym(v), toNum(val))
}

function pushP(s, r) {
  let sr = l2(s, r);
  let t = join(sr, nil)

  if (P === nil) {
    P = t;
    return;
  }

  let p = P;

  while (true) {
    if (cdr(p) === nil) {
      xdr(p, t);
      return;
    }

    p = cdr(p);
  }
}

export function pushS(e, a) {
  let ea = l2(e, a);
  S = join(ea, S);
}

export function thread(e) {
  // expression stack for the new thread with one expression and current lexical environment
  let s = join(list(e, A), nil);

  // queue thread with nil return stack 'r'
  pushP(s, nil);
}

function popP() {
  let sr = car(P);
  P = cdr(P);

  S = car(sr);
  R = cadr(sr);

  popS();
}

export function dropS() {
  S = cdr(S);
}

function popS() {
  let ea = car(S);
  S = cdr(S);

  E = car(ea);
  A = cadr(ea);
}

export function binding(v) {
  let binds = nil;
  let s = S;

  while (s) {
    let ea = car(s);
    let e = car(ea); // don't care about 'a'

    if (pair(e) && car(e) === smark && cadr(e) === s_bind) {
      binds = join(caddr(e), binds);
    }

    s = cdr(s);
  }

  return get(v, reverse(binds, nil));
}

export function inwhere() {
  let e = car(car(S));

  if (car(e) === smark && cadr(e) === s_loc) {
    return cddr(e);
  }

  return false;
}

export function init(e) {
  // read expression to evaluate
  E = e;

  // clear everything except the global env
  A = join(tvar("a", 123), nil);

  S = nil;
  R = nil;
  P = nil;
}

export function regE() {
  return E;
}

export function regA() {
  return A;
}

export function regG() {
  return G;
}

// S and R used in ccc
export function regS() {
  return S;
}

export function regR() {
  return R;
}

export function result() {
  return car(R);
}

export function pushR(e) {
  R = join(e, R);
}

export function popR(e) {
  let r = car(R);
  R = cdr(R);

  return r;
}

export function tick() {
  if (S === nil) {
    // finished work on current thread

    if (P === nil) {
      // no more threads. nothing else to do, signal to stop execution;
      return false;
    }

    // schedule next thread (current is finished so don't need to worry about values)
    popP();
  } else {
    // is the current thread locked?
    if (binding(s_lock)) {
      // ready the next piece of work on the current thread
      popS();
    } else {
      // push the current thread to the back of the thread stack, pop the next thread
      pushP(S, R);
      popP();
    }
  }

  // continue execution
  return true;
}
