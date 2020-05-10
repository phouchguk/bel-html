"use strict";

const syms = ["nil", "t", "o", "apply", "lit", "scope", "globe", "unbound", "err", "malformed", "quote", "if", "fut", "lock", "where", "loc", "unfindable", "d", "dyn", "bind", "after", "prot", "ccc", "cont", "thread", "evcall", "mac", "clo", "prim", "car", "cdr", "xar", "xdr", "join", "id", "body", "env", "destruct", "env-add", "literal-parm", "char", "mistype", "bad-clo"];

export const nil = 0;
export const t = 1;
export const o = 2;

export const s_apply = 3;
export const s_lit = 4;
export const s_scope = 5;
export const s_globe = 6;
export const s_unbound = 7;
export const s_err = 8;
export const s_malformed = 9;
export const s_quote = 10;
export const s_if = 11;
export const s_fut = 12;
export const s_lock = 13;
export const s_where = 14;
export const s_loc = 15;
export const s_unfindable = 16;
export const s_d = 17;
export const s_dyn = 18;
export const s_bind = 19;
export const s_after = 20;
export const s_prot = 21;
export const s_ccc = 22;
export const s_cont = 23;
export const s_thread = 24;
export const s_evcall = 25;
export const s_mac = 26;
export const s_clo = 27;
export const s_prim = 28;
export const s_car = 29;
export const s_cdr = 30;
export const s_xar = 31;
export const s_xdr = 32;
export const s_join = 33;
export const s_id = 34;
export const s_body = 35;
export const s_env = 36;
export const s_destruct = 37;
export const s_env_add = 38;
export const s_literal_parm = 39;
export const s_char = 40;
export const s_mistype = 41;
export const s_bad_clo = 42;

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
