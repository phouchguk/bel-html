"use strict";

import { parse, tokenise } from "./parse.js";
import { display } from "./io.js";

const s = tokenise("(hello 1 2 3 \"string\")");
parse(s);
display(s);
