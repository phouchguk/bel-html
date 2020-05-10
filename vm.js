"use strict";

import { join, pair, car, cdr, cadr, xdr } from "./pair.js";
import { nil } from "./sym.js";

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
let G = nil;

function pushP() {
  let sr = join(S, join(R, nil));
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

function popP() {
  let sr = car(P);
  P = cdr(P);

  S = car(sr);
  R = cadr(sr);

  popS();
}

function popS() {
  let ea = car(S);
  S = cdr(S);

  E = car(ea);
  A = cadr(ea);
}

export function binding(v) {
  return false;
}

export function init(e) {
  // read expression to evaluate
  E = e;

  // clear everything except the global env
  A = nil;

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

export function result() {
  return car(R);
}

export function pushR(e) {
  R = join(e, R);
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
      pushP();
      popP();
    }
  }

  // continue execution
  return true;
}
