"use strict";

import { parse, tokenise } from "./parse.js";
import { display } from "./io.js";
import { print } from "./print.js";
import { Stream } from "./stream.js";

// check ok
const s = tokenise("ok");
const e = parse(s);

const o = new Stream([]);
print(o, e);
display(o);
