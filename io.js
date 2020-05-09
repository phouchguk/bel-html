"use strict";

const input = document.getElementById("input");
const output = document.getElementById("output");

const stdin = document.getElementById("stdin");
const stdout = document.getElementById("stdout");

function categorise(t) {
  if (t === "(" || t === ")") {
    return "paren";
  }

  if (t.startsWith("#\\")) {
    return "char";
  }

  let n = parseInt(t, 10);

  if (isNaN(t)) {
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
