"use strict";

import { nil } from "./sym.js";

function validCell(x) {
  return pair(x) || typeof x === "number";
}

function Pair(a, d) {
  this.a = a;
  this.d = d;
}

export function join(a, d) {
  if (!validCell(a)) {
    console.log(a);
    throw new Error("bad a -- JOIN");
  }

  if (!validCell(d)) {
    console.log(d);
    throw new Error("bad d -- JOIN");
  }

  return new Pair(a, d);
}

export function pair(x) {
  return x instanceof Pair;
}

export function car(p) {
  if (!pair(p)) {
    throw new Error("can't car non-pair -- CAR");
  }

  return p.a;
}

export function cdr(p) {
  if (!pair(p)) {
    throw new Error("can't cdr non-pair -- CDR");
  }

  return p.d;
}

export function xar(p, val) {
  if (!pair(p)) {
    throw new Error("can't set car on non-pair -- XAR");
  }

  if (!validCell(val)) {
    throw new Error("bad val -- XAR");
  }

  p.a = val;
}

export function xdr(p, val) {
  if (!pair(p)) {
    throw new Error("can't set cdr on non-pair -- XDR");
  }

  if (!validCell(val)) {
    throw new Error("bad val -- XDR");
  }

  p.d = val;
}

export function cadr(p) {
  return car(cdr(p));
}

export function cddr(p) {
  return cdr(cdr(p));
}

export function caddr(p) {
  return car(cdr(cdr(p)));
}

export function l2(a, b) {
  return join(a, join(b, nil));
}

export function list() {
  let l = nil;

  for (let i = arguments.length - 1; i >=0; i--) {
    l = join(arguments[i], l);
  }

  return l;
}

export function get(k, l) {
  while(l) {
    let i = car(l);

    if (car(i) === k) {
      return i;
    }

    l = cdr(l);
  }
}

export function reverse(l, term) {
  let r = term;

  while (l !== nil) {
    r = join(car(l), r);
    l = cdr(l);
  }

  return r;
}


export const smark = join(nil, nil);
export const vmark = join(nil, nil);
