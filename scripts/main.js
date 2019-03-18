//
// globals
//

let actors;
let tiles;
let deadQueue;
let isPlayerTurn;
let mousepos;
let deserActorClass;
let deserTileName;
let serTileName;

//
// event handlers
//

function registerListeners() {
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault()
    return false
  })

  window.addEventListener("keydown", async (e) => {
    if (/*e.key === 'r' &&*/ e.ctrlKey) {
      // let user reload the page; preventDefault on all else
      return;
    }
    switch (e.key) {
      case "Enter":
        init()
        break;
      case " ":
      case "Space":
        await toggleEditor();
        break;
      case "Tab":
        if (editorActive()) {
          cycleBrush()
        }
        break;
    }
    e.preventDefault()
    return false
  })
  window.addEventListener("keyup", async (e) => {
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
    await update(dir)
  })

  canvas.addEventListener("mousemove", (e) => {
    mousepos.x = e.offsetX
    mousepos.y = e.offsetY
    raf()
    if (editorActive() && mousedown) {
      click(e)
    }
  })

  let mousedown = false
  canvas.addEventListener("mousedown", (e) => {
    e.preventDefault()
    mousedown = true
    if (editorActive) {
      click(e)
    }
    e.preventDefault()
    return false
  })
  canvas.addEventListener("mouseup", (e) => {
    e.preventDefault()
    mousedown = false
    canvas.focus()
    e.preventDefault()
    return false
  })

  editorButton.onclick = toggleEditor
  saveButton.onclick = ()=>downloadFile("level.dat", exportLevelString())
  addColButton.onclick = ()=>modifyTilesDim(1, 0)
  rmColButton.onclick = ()=>modifyTilesDim(-1, 0)
  addRowButton.onclick = ()=>modifyTilesDim(0, 1)
  rmRowButton.onclick = ()=>modifyTilesDim(0, -1)
}

function click(e) {
  LMB = 1<<0
  RMB = 1<<1
  MMB = 1<<2
  if (e.buttons & MMB) {
    eraseTile()
  } else if (e.buttons & RMB) {
    eyedropTile()
  } else if (e.buttons & LMB) {
    paintTile()
  } else {
    assert(0)
  }
  raf()
}

//
// other
//

function redraw() {
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  if (editorActive()) {
    drawEditor(ctx)
  } else {
    drawGame(ctx)
  }
}

function raf() {
  requestAnimationFrame(redraw)
}

async function init() {
  initSerTables()
  registerListeners()
  mousepos = new CanvasPos({x: null, y: null});

  loadTiles()
  fitCanvasToTiles()
  await initTileCache()

  loadActors()
  deadQueue = [];

  initEditor()
  isPlayerTurn = true;

  raf()
}
window.onload = init
