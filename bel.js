"use strict";

import { parse, tokenise } from "./parse.js";
import { display } from "./io.js";
import { print } from "./print.js";
import { Stream } from "./stream.js";

const s = tokenise("(hello 1 2 3 \"string\")");
const e = parse(s);

const o = new Stream([]);
print(o, e);
display(o);
