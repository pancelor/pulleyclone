"use strict";

let canvas;

window.onload = function() {
  canvas = document.getElementById("main_canvas");
  requestAnimationFrame(tick);
}

function tick() {
  console.log({a:2});
}
