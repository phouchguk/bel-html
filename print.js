"use strict";

import { CHR_PFX, char, number, symbol, val } from "./type.js";
import { getSym, nil } from "./sym.js";
import { car, cdr, pair } from "./pair.js";

function printChar(c) {
  switch (c) {
  case 13:
    return "cr";
  case 10:
    return "lf";
  case 9:
    return "tab";
  case 32:
    return "space";
  default:
    return String.fromCharCode([c]);
  }
}

export function print(o, x) {
  if (pair(x)) {
    o.push("(");

    while (x !== nil) {
      print(o, car(x));
      x = cdr(x);

      if (x !== nil && !pair(x)) {
        o.push(".");
        print(o, x);
        break;
      }
    }

    o.push(")");

    return;
  }

  const v = val(x);

  if (char(x)) {
    o.push(CHR_PFX + printChar(v));
    return;
  }

  if (number(x)) {
    o.push(v + "");
    return;
  }

  if (symbol(x)) {
    o.push(getSym(v));
    return;
  }

  console.log(x);
  throw new Error("bad type -- PRINT");
}
