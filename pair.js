"use strict";

function validCell(x) {
  return pair(x) || typeof x === "number";
}

function Pair(a, d) {
  this.a = a;
  this.d = d;
}

export function join(a, d) {
  if (!validCell(a)) {
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