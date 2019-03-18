//
// globals
//

let isPlayerTurn;
let bufferedInput;
let mousepos;

//
// event handlers
//

function registerListeners() {
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault()
    return false
  })
  window.addEventListener("wheel", (e) => {
    cycleBrush(-Math.sign(e.wheelDelta))
    raf()
    e.preventDefault()
    return false
  })

  window.addEventListener("keydown", async (e) => {
    if (/*e.key === 'r' &&*/ e.ctrlKey) {
      // let user reload the page; preventDefault on all else
      return;
    }
    switch (e.key) {
      case "Enter": {
        reset()
      } break
      case " ":
      case "Space": {

      } break
      case "Escape": {
        await toggleEditor();
      } break
      case "Tab": {
        if (editorActive()) {
          switchLayer()
        }
      } break
      case "Alt": {
        suppressBrushPreview = true
      } break
      case "Shift": {
        suppressBrushPreview = true
      } break
    }
    e.preventDefault()
    return false
  })
  window.addEventListener("keyup", async (e) => {
    let dir;
    switch (e.key) {
      case "d":
      case "ArrowRight": {
        dir = 0;
      } break
      case "w":
      case "ArrowUp": {
        dir = 1;
      } break
      case "a":
      case "ArrowLeft": {
        dir = 2;
      } break
      case "s":
      case "ArrowDown": {
        dir = 3;
      } break
      case "Alt": {
        suppressBrushPreview = false
      } break
      case "Shift": {
        suppressBrushPreview = false
        if (actorInFlight) {
          mouseHeld = false
          actorInFlight = null
        }
      } break
    }
    if (dir === undefined) { return }
    if (editorActive()) { return }

    // This function gets all weird b/c it's running multiple copies
    // of itself at once. One main "thread" plays back any buffered inputs
    // while many other "threads" set the buffered input
    if (!isPlayerTurn) {
      bufferedInput = dir
      return
    }
    isPlayerTurn = false
    await update(dir)
    assert(isPlayerTurn === false)
    while (bufferedInput !== null) {
      const dir = bufferedInput
      bufferedInput = null
      await update(dir)
    }
    isPlayerTurn = true
  })

  canvas.addEventListener("mousemove", (e) => {
    mousepos.x = e.offsetX
    mousepos.y = e.offsetY
    mouseMove(e)
    raf()
  })

  canvas.addEventListener("mousedown", (e) => {
    mouseDown(e)
    mouseMove(e)
    raf()
    e.preventDefault()
    return false
  })
  canvas.addEventListener("mouseup", (e) => {
    mouseUp(e)
    raf()
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

let suppressBrushPreview = false // TODO: really hacky

let mouseHeld = false
let actorInFlight
function mouseDown(e) {
  if (!editorActive()) { return }
  mouseHeld = true
  if (e.button === 0) { // 0, 1, 2 for L, M, R
    if (e.shiftKey) {
      actorInFlight = findActor(null, mousepos)
    }
  }
}
function mouseUp(e) {
  if (!editorActive()) { return }
  mouseHeld = false
  if (e.button === 0) { // 0, 1, 2 for L, M, R
    actorInFlight = null
  }
}

function mouseMove(e) {
  if (!editorActive()) { return }
  if (!mouseHeld) { return }

  MOUSE_LMB = 1<<0
  MOUSE_RMB = 1<<1
  MOUSE_MMB = 1<<2

  if (e.buttons & MOUSE_LMB) {
    if (e.altKey) {
      doFiddle()
    } else if (actorInFlight) {
      doMove(actorInFlight)
    } else {
      doPaint()
    }
  } else if (e.buttons & MOUSE_MMB) {
    doEyedrop()
  } else if (e.buttons & MOUSE_RMB) {
    doErase()
  } else {
    // user must have moused off the window and then released the mouse buttons
  }
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
  await reset()
}

async function reset() {
  loadTiles()
  fitCanvasToTiles()

  loadActors()
  deadQueue = [];

  initEditor()
  await initGame()
  isPlayerTurn = true;
  bufferedInput = null;

  raf()
}
window.onload = init
