# You're Pulleying My Leg

A clone of http://www.draknek.org/games/puzzlescript/pulleys.php

# How to run

option 1: play online at https://pancelor.github.io/pulleyclone/

option 2: clone project; open main.html; play in browser

# todo

* load/save into local storage? and then import/export to user disk.
  * this makes editing possible on github
* decide frd what tiles are... seems like they're mainly some static sprites and a full-screen collision mask? like in celeste?
  * pre-render tiles for drawing optimization? e.g. separate canvas that's
  written to once (bkg + tiles) and then blitted during `cls`

* do proper physics / post-user updates
* write undo system
* add other objects; clone full game

* write a proper user-facing readme
