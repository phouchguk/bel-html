"use strict";

import { char, symbol } from "./type.js";
import { pair, car, cdr, cadr, cddr, caddr, cdddr, get, join, list, reverse, smark, vmark, xdr } from "./pair.js";
import { nil, o, s_after, s_apply, s_bad_clo, s_bind, s_body, s_car, s_cdr, s_ccc, s_char, s_clo, s_d, s_destruct, s_dyn, s_env, s_env_add, s_err, s_evcall, s_fut, s_globe, s_id, s_if, s_join, s_lit, s_literal_parm, s_loc, s_mac, s_mistype, s_malformed, s_prim, s_prot, s_quote, s_scope, s_symbol, s_thread, s_type, s_unbound, s_unfindable, s_vmark, s_where, s_xar, s_xdr, t } from "./sym.js";
import { binding, dropS, init, inwhere, popR, pushEA, pushR, pushS, regA, regE, regG, regS, regR, resetS, result, setR, thread, tick } from "./vm.js";
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

function applyprim(f, args) {
  if (f === s_car) {
    // built-in car is stricter than bel car. doesn't allow nils.
    let p = car(args);

    if (p === nil) {
      pushR(nil);
    } else {
      pushR(car(p));
    }

    return;
  }

  if (f === s_cdr) {
    let p = car(args);

    if (p === nil) {
      pushR(nil);
    } else {
      pushR(cdr(p));
    }

    return;
  }

  if (f === s_xar) {
    let p = car(args);
    let a = cadr(args);

    xar(p, a);
    pushR(a);

    return;
  }

  if (f === s_xdr) {
    let p = car(args);
    let d = cadr(args);

    xdr(p, d);
    pushR(d);

    return;
  }

  if (f === s_join) {
    let a, d;

    if (args === nil) {
      a = nil;
      d = nil;
    } else {
      a = car(args);

      if (cdr(args) === nil) {
        d = nil;
      } else {
        d = cadr(args);
      }
    }

    pushR(join(a, d));

    return;
  }

  if (f === s_id) {
    let a = car(args);
    let b = cadr(args);

    pushR(a === b ? t : nil);

    return;
  }

  if (f === s_type) {
    let a = car(args);
    let typ = a >> 29;

    switch (typ) {
    case 0:
      pushR(s_symbol);
      return;

    case 1:
      pushR(s_char);
      return;

    case 2:
      pushR(s_pair);
      return;
    }

    throw new Error("unknown type -- APPLYPRIM");
  }

  throw new Error("bad prim -- APPLYPRIM");
}

function okenv(a) {
  return proper(a) && all(pair, a);
}

function okparms(p) {
  if (p === nil) {
    return true;
  }

  if (variable(p)) {
    return true;
  }

  if (atom(p)) {
    return false;
  }

  let a = car(p);

  if (a === t) {
    return oktoparm(p);
  }

  let d = cdr(p);

  if (pair(a) && car(a) === o) {
    return oktoparm(a) && okparms(d);
  }

  return okparms(a) && okparms(d);
}

function oktoparm(p) {
  let v, e, extra;
  let tag = car(p);

  if (cdr(p) === nil) {
    v = nil;
    e = nil;
    extra = nil;
  } else {
    v = cadr(p);

    if (cddr(p) === nil) {
      e = nil;
      extra = nil;
    } else {
      e = caddr(p);
      extra = cdddr(p);
    }
  }

  return okparms(v) && ((tag === o) || e !== nil) && extra === nil;
}

function destructure(pat, arg, env) {
  let p = car(pat);
  let ps = cdr(pat);

  if (arg === nil) {
    if (car(p) === o) {
      // optional parm

      // evaluate the rest of the parms, with optional p in the environment (evaluated and put in r)
      pushS(fu(s_destruct, list(ps, nil)), nil);

      // put optional arg in env (takes the evaluated value, different from non-optional below)
      pushS(fu(o, cadr(p)), env);

      // evaluate the optional arg
      pushS(cddr(p) === nil ? nil : caddr(p), env);
    } else {
      sigerr(s_underargs);
    }

    return;
  }

  if (atom(arg)) {
    sigerr(s_atom_arg);
    return;
  }

  // evaluate other args
  pushS(fu(s_destruct, list(ps, cdr(arg))), nil);

  // add the arg to the environment (we're explicitly giving it the value)
  pushS(fu(s_env_add, list(p, car(arg))), env);
}

function typecheck(pat, arg, env) {
  let v = car(pat);
  let f = cadr(pat);

  // evaluate type check result
  pushS(fu(t, list(v, arg)), env);

  // evaluate the type check
  pushS(list(f, list(s_quote, arg)), env);
}

function pass(pat, arg, env) {
  if (pat === nil) {
    if (arg !== nil) {
      sigerr(s_overargs);
      return;
    }

    // done
    pushR(env);
    return;
  }

  if (literal(pat)) {
    sigerr(s_literal_parm);
    return;
  }

  if (variable(pat)) {
    pushR(join(join(pat, arg), env));
    return;
  }

  if (car(pat) === t) {
    typecheck(cdr(pat), arg, env);
    return;
  }

  if (car(pat) === o) {
    pass(cadr(pat), arg, env);
    return;
  }

  destructure(pat, arg, env);
}

function applyclo(parms, args, env, body) {
  pushS(fu(s_body, body), nil);
  pushS(fu(s_env, list(parms, args, env)), nil);
}

function protectd(x) {
  return pair(x) && car(x) === smark && cadr(x) === s_prot || cadr(x) === s_bind;
}

function mem(x, xs) {
  while (xs !== nil) {
    if (x === car(xs)) {
      return true;
    }

    xs = cdr(xs);
  }

  return false;
}

function applycont(s2, r2, args) {
  if (args === nil || cdr(args) !== nil) {
    // should only be one arg
    sigerr(s_wrong_no_args);
    return;
  }

  // do the stuff in s2 but do the prot/bind stuff in S first (if it's not in s2)
  // push s2 onto the stack
  let keep = reverse(s2, nil);

  while (keep !== nil) {
    pushEA(car(keep));
    keep = cdr(keep);
  }

  let s = regS();
  resetS();
  keep = nil;

  // keep prot or bind items from the stack, if they're not in s2
  while (s !== nil) {
    let i = car(s);
    if (protectd(i) && !mem(i, s2)) {
      keep = join(i, keep);
    }
  }

  // search has reversed it so we can just push it on
  while (keep !== nil) {
    pushEA(car(keep));
    keep = cdr(keep);
  }

  setR(join(car(args), r2));
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
    let env, parms, body;

    if (rest === nil) {
      env = nil;
      parms = nil;
      body = nil;
    } else {
      env = car(rest);

      if (cdr(rest) === nil) {
        parms = nil;
        body = nil;
      } else {
        parms = cadr(rest);

        if (cddr(rest) === nil) {
          body = nil;
        } else {
          body = caddr(rest);
        }
      }
    }

    if (okenv(env) && okparms(parms)) {
      applyclo(parms, args, env, body);
      return;
    }

    sigerr(s_bad_clo);
    return;
  }

  if (tag === s_cont) {
    let s2, r2;

    if (rest === nil) {
      s2 = nil;
      r2 = nil;
    } else {
      s2 = car(rest);

      if (cdr(rest) === nil) {
        r2 = nil;
      } else {
        r2 = cadr(rest);
      }
    }

    if (okstack(s2) && proper(r2)) {
      applycont(s2, r2, args);
    }
  }

  throw new Error("bad lit -- APPLYLIT");
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
  pushS(fu(s_mac, nil), regA());
  applyf(caddr(mac), args);
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

  if (tag === s_env) {
    // evaluate clo parms
    args = car(args);
    let parms = car(args);
    let env = caddr(args);
    args = cadr(args);

    pass(parms, args, env);
    return;
  }

  if (tag === s_body) {
    // finished evaluating parms, evaluate clo body
    let body = car(args);
    let env = popR();

    pushS(body, env);
    return;
  }

  if (tag === t) {
    // typecheck result
    args = car(args);
    let v = car(args);
    let arg = cadr(args);

    let r = popR();
    let env = regA();

    if (r === nil) {
      // parm failed typecheck
      sigerr(s_mistype);
      return;
    }

    pass(v, arg, env);
    return;
  }

  if (tag === s_destruct) {
    args = car(args);
    let pat = car(args);
    let arg = cadr(args);
    let env = popR();

    pass(pat, arg, env);
    return;
  }

  if (tag === o) {
    let pat = car(args);
    let arg = popR();
    let env = regA();

    pass(pat, arg, env);
    return;
  }

  if (tag === s_env_add) {
    args = car(args);
    let pat = car(args);
    let arg = cadr(args);
    let env = regA();

    pass(pat, arg, env);
    return;
  }

  if (tag === s_mac) {
    pushS(popR(), regA());
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

export function bel(e) {
  if (regG() === nil) {
    let g = join(join(s_vmark, vmark), nil);
    [s_xdr, s_car].forEach(p => g = join(join(p, list(s_lit, s_prim, p)), g));
    init(e, g);
  } else {
    init(e);
  }

  do {
    evl()
  } while (tick());

  return result();
}
