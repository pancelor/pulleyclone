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
  // TODO: auto-make these
  // TODO: rm empty.png
  lookupActor = {
    "heroClimb": Hero,
    "block": Block,
    "gem": Gem,
  }

  lookupTile = {
    0: "empty",
    1: "dirt",
    2: "ladder",
    3: "platform",
    4: "ladderPlatform",
  }

  reverseLookupTile = {
    "empty": 0,
    "dirt": 1,
    "ladder": 2,
    "platform": 3,
    "ladderPlatform": 4,
  }
}

//
// event handlers
//

function registerListeners() {
  window.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "Enter":
        init()
        break;
      case " ":
      case "Space":
        toggleEditor();
        break;
      case "Tab":
        if (editorActive()) {
          cycleBrush()
        }
        e.preventDefault()
        break;
    }
  })
  window.addEventListener("keyup", (e) => {
    let dir;
    switch (e.key) {
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
    if (editorActive()) { return }
    if (!isPlayerTurn) { return }
    if (dir === undefined) { return }
    isPlayerTurn = false
    update(dir)
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
// other
//

function redraw() {
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  cls(ctx)
  if (editorActive()) {
    drawEditor(ctx)
  } else {
    drawGame(ctx)
  }
  requestAnimationFrame(redraw)
}

function init() {
  initLevelLookups()
  registerListeners()
  mousepos = new CanvasPos({x: null, y: null});
  initEditor()
  loadTiles()
  loadActors()
  fitCanvasToTiles()
  isPlayerTurn = true;
  deadQueue = [];
  redraw()
}
window.onload = init
