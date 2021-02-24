# You're Pulleying My Leg

A clone of http://www.draknek.org/games/puzzlescript/pulleys.php , made as a learning exercise.

Also has an original custom level editor

## How to run

option 1: play online at https://pancelor.github.io/pulleyclone/
(note: you can't save levels currently in this version)

option 2: clone project; open index.html; play in browser

Controls:
* move with wasd or arrow keys.
* undo with `z`, redo with `y`

## How to use the level editor

* escape: toggles between the game and the editor
* in-editor controls:
  * tab: toggles between the tile layer and the actor layer
  * left click: place actor/tile
  * mouse wheel: scrolls through the available tiles/actors
  * middle click: eyedropper
  * right click: erase
  * ctrl-s: save current level to disk

## How to make this into a different game

* new tiles:
  * add into `tilesList` in index.html
* new actors:
  * add to game.js as new classes
  * add the constructors to the end of `allActorTypes`
  * serializing/deserializing should Just Work if the only props are an x,y position. if you need anything else, copy paste and edit the default
  `serialize` and `deserialize` functions from the base Actor class

## todo

* load/save into local storage? and then import/export to user disk.
  * this makes editing possible on github
* rethink collision stuff; currently very adhoc. tiles and actors both.

* better z-order - WireV is too high atm
* sounds
* less hacky actor placing - currently it's essentially just another tile layer :/
  * layer of blocks in bottom room is one too short because of this
* make game run on a frame clock
  * do pull-style keyboard instead of event interrupts... bah

* write a proper user-facing readme

* make a game with full + robust time-scrubbing that involves lots of actor creation / destruction - the history system in this game is hacky
