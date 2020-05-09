"use strict";

import { CHR_PFX, toChar, toNum } from "./type.js"
import { join, car, cdr } from "./pair.js"
import { nil, sym, t } from "./sym.js"
import { Stream } from "./stream.js"

const STRING_ESC = "¬";
const COMMA_AT = STRING_ESC + "@";

const strings = [];

function extractStrings(x, i) {
  if (i % 2 === 0) {
    // not part of a string
    return x;
  } else {
    strings.push(x);
    return STRING_ESC + ((i - 1) / 2);
  }
}

function siToChar(s, i) {
  return toChar(s.charCodeAt(i));
}

function stringToCharList(s) {
  const len = s.length;
  let l = nil;

  for (let i = len - 1; i >= 0; i--) {
    l = join(s[i] === STRING_ESC ? siToChar("\"", 0) : siToChar(s, i), l);
  }

  return l;
}

function getString(si) {
  return stringToCharList(strings[si]);
}

export function tokenise(s) {
  strings.length = 0;

  const tokens = s
        .replace(/\\"/g, STRING_ESC)
        .split(/"/g)
        .map(extractStrings)
        .join("")
        .replace(/,@/g, " " + COMMA_AT + " ")
        .replace(/\(/g, " ( ")
        .replace(/\)/g, " ) ")
        .replace(/'/g, " ' ")
        .replace(/`/g, " ` ")
        .replace(/,/g, " , ")
        .split(" ")
        .map(x => x.trim())
        .filter(x => x !== "");

  return new Stream(tokens);
}

var delims = {
  "'": sym("quote"),
  "`": sym("bquote"),
  ",": sym("comma"),
  UNQUOTE_SPLICE: sym("comma-at")
};

function getChar(t) {
  const len = CHR_PFX.length;

  if (t.length === len + 1) {
    return siToChar(t, len);
  }

  switch (t.substring(len)) {
  case "cr":
    return siToChar("\r", 0);
  case "lf":
    return siToChar("\n", 0);
  case "tab":
    return siToChar("\t", 0);
  case "space":
    return siToChar(" ", 0);
  default:
    throw new Error("bad char: " + t);
  }
}

function reverse(l, term) {
  let r = term;

  while (l !== nil) {
    r = join(car(l), r);
    l = cdr(l);
  }

  return r;
}

function parseList(s) {
  let l = nil;

  while (true) {
    let t = s.peek();

    if (t === null) {
      throw new Error("unterminated list");
    }

    if (t === ".") {
      s.pop(); // pop .

      if (t === "(" || t === ")") {
        throw new Error("bad .");
      }

      l = reverse(l, parse(s));

      t = s.pop(); // pop )

      if (t !== ")") {
        throw new Error("bad . - expected ')'");
      }

      return l;
    }

    if (t === ")") {
      s.pop();
      return reverse(l, nil);
    }

    l = join(parse(s), l);
  }
}

function parseSymbol(token) {
  if (token.indexOf("|") > -1) {
    let parts = token.split("|");

    if (parts.length !== 2) {
      throw new Error("bad '|' -- PARSE_SYMBOL");
    }

    return join(t, join(parseSymbol(parts[0]), join(parseSymbol(parts[1]), nil)));
  }

  return sym(token);
}

export function parse(s) {
  const t = s.pop();

  if (delims[t]) {
    return join(delims[t], join(parse(s), nil));
  }

  if (t === "(") {
    return parseList(s);
  }

  if (t == ")") {
    throw new Error("bad ')'");
  }

  if (t.startsWith(CHR_PFX)) {
    return getChar(t);
  }

  if (t.startsWith(STRING_ESC)) {
    return getString(parseInt(t.substring(1), 10));
  }

  let n = parseInt(t, 10);

  if (isNaN(t)) {
    return parseSymbol(t);
  }

  return toNum(n);
}
