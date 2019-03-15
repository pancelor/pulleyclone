//
// globals
//

let actors;
let tiles;
let deadQueue;
let isPlayerTurn;
let mousepos;
let lookupActor;
let lookupTile;
let reverseLookupTile;

function initLevelLookups() {
  lookupActor = {
    "potion": Potion,
    "slime": Slime,
    "hero": Hero,
  }

  lookupTile = {
    0: "grass",
    1: "dirt",
    2: "tree",
    3: "brick",
    4: "mountain",
  }

  reverseLookupTile = {
    "grass": 0,
    "dirt": 1,
    "tree": 2,
    "brick": 3,
    "mountain": 4,
  }
}

//
// event handlers
//

function registerListeners() {
  window.addEventListener("keyup", (e) => {
    let dir;
    switch (e.key) {
      case "Enter":
        init()
        break;
      case " ":
      case "Space":
        toggleEditor();
        break;
      case "d":
      case "ArrowRight":
        dir = 0;
        break;
      case "w":
      case "ArrowUp":
        dir = 1;
        break;
      case "a":
      case "ArrowLeft":
        dir = 2;
        break;
      case "s":
      case "ArrowDown":
        dir = 3;
        break;
    }
    if (editorActive()) {return;}
    if (dir === undefined) {return;}
    if (!isPlayerTurn) {return;}
    isPlayerTurn = false;
    update(dir);
  })

  canvas.addEventListener("mousemove", (e) => {
    mousepos.x = e.offsetX
    mousepos.y = e.offsetY
  })

  let mousedown = false
  canvas.addEventListener("mousedown", (e) => {
    mousedown = true
    if (editorActive) {
      clickBrush(e)
    }
    e.preventDefault()
  })
  canvas.addEventListener("mouseup", (e) => {
    mousedown = false
    canvas.focus()
    e.preventDefault()
  })

  canvas.addEventListener("mousemove", (e) => {
    if (editorActive && mousedown) {
      clickBrush(e)
    }
  })

  editorButton.onclick = toggleEditor
  saveButton.onclick = ()=>downloadFile("level.dat", exportLevelString())
  addColButton.onclick = ()=>modifyTilesDim(1, 0)
  rmColButton.onclick = ()=>modifyTilesDim(-1, 0)
  addRowButton.onclick = ()=>modifyTilesDim(0, 1)
  rmRowButton.onclick = ()=>modifyTilesDim(0, -1)
}

//
// init
//

function init() {
  initLevelLookups()
  registerListeners()
  mousepos = new CanvasPos({x: null, y: null});
  initEditor()
  initTiles()
  initActors()
  isPlayerTurn = true;
  deadQueue = [];
  redraw()
}
window.onload = init
