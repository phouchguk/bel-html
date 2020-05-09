"use strict";

export function Stream(tx) {
  this.i = 0;
  this.tx = tx;
  this.len = tx.length;
}

Stream.prototype.peek = function() {
  if (this.i === this.len) {
    return null;
  }

  return this.tx[this.i];
}

Stream.prototype.pop = function() {
  if (this.i === this.len) {
    return null;
  }

  return this.tx[this.i++];
}

Stream.prototype.push = function(s) {
  this.tx.push(s);
}
