"use strict";

import { CHR_PFX } from "./type.js"
import { nil } from "./sym.js"
import { parse, tokenise } from "./parse.js"
import { print } from "./print.js"
import { Stream } from "./stream.js"
import { bel } from "./evl.js"

const input = document.getElementById("input");
const output = document.getElementById("output");

//const stdin = document.getElementById("stdin");
//const stdout = document.getElementById("stdout");

function categorise(t) {
  if (t === "(" || t === ")") {
    return "paren";
  }

  if (t.startsWith(CHR_PFX)) {
    return "char";
  }

  let n = parseInt(t, 10);

  if (isNaN(n)) {
    return "sym";
  }

  return "num";
}

function span(cls, t) {
  return '<span class="' + cls + '">' + t + "</span>";
}

function htmlify(t) {
  return span(categorise(t), t);
}

export function display(s) {
  output.innerHTML = s.tx.map(htmlify).join("");
}

function processInput() {
  let inS = input.value.trim();

  if (inS === "") {
    return;
  }

  output.innerHTML = "";
  let tokens = tokenise(inS);
  let e = nil;
  let run = true;

  while (run && !tokens.eof()) {
    try {
      e = parse(tokens);
    } catch (err) {
      run = false;
      output.innerHTML = span("bad-parse", err.message);

      return;
    }

    try {
      e = bel(e);
    } catch (e) {
      run = false;
      output.innerHTML = span("bad", e.message);
      return;
    }
  }

  let o = new Stream([]);
  print(o, e);
  display(o);
}

function keyUp(e) {
  if (e.keyCode === 13) {
    processInput();
    input.value = "";
  }
}

var request = new XMLHttpRequest();
request.open("GET", "/prelude.bel", true);

request.onload = function() {
  if (this.status >= 200 && this.status < 400) {
    input.value = this.response;
    processInput();
    input.value = "";

    input.addEventListener("keyup", keyUp, true);
    input.focus();
  }
};

request.send();
