//
// globals
//

let isPlayerTurn;
let bufferedInput;
let mousepos;

//
// event handlers
//

function combo(str) {
  // returns a function f
  // later, given a key event e, `f(e)` tells you whether
  // e matches the key combo described by str
  return e => {
    return str.trim().split(' ').every(part => {
      if (part === "ctrl") { return e.ctrlKey }
      else if (part === "alt") { return e.altKey }
      else if (part === "shift") { return e.shiftKey }
      else if (part.length === 1) { return (e.key.toLowerCase() === part.toLowerCase() )
      } else { assert(0, `bad key combo part ${part}`) }
    })
  }
}


function registerKeyListeners() {
  async function movementKey(dir) {
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
  }

  const keyRepeatTimeout = 125

  function makeHandler(codes, cb) {
    let repeatInterval
    if (!Array.isArray(codes)) { codes = [codes] }
    return e => {
      if (!codes.includes(e.code)) { return }
      if (e.type === "keydown") {
        if (e.repeat) { return }
        cb()
        clearInterval(repeatInterval) // don't want multiple intervals running if we lose focus
        repeatInterval = setInterval(cb, keyRepeatTimeout)
      } else if (e.type === "keyup") {
        if (!repeatInterval) {
          console.warn(`released ${e.code} but there was no repeat interval (${repeat})`)
        }
        clearTimeout(repeatInterval)
      } else { assert(0, `${e.type}: ${JSON.stringify(e)}`) }
    }
  }
  const repeatHandlers = [
    makeHandler("KeyZ", () => {
      if (!isPlayerTurn) { return }
      undo()
      raf()
    }),
    makeHandler("KeyY", () => {
      if (!isPlayerTurn) { return }
      redo()
      raf()
    }),
    makeHandler(["KeyD", "ArrowRight"], () => { movementKey(0) }),
    makeHandler(["KeyW", "ArrowUp"], () => { movementKey(1) }),
    makeHandler(["KeyA", "ArrowLeft"], () => { movementKey(2) }),
    makeHandler(["KeyS", "ArrowDown"], () => { movementKey(3) }),
  ]

  window.addEventListener("keydown", e=>repeatHandlers.forEach(f=>f(e)))
  window.addEventListener("keyup", e=>repeatHandlers.forEach(f=>f(e)))

  window.addEventListener("keydown", async (e) => {
    if (combo("ctrl s")(e)) {
      saveLevel()
      e.preventDefault()
      return false
    }
    if (e.ctrlKey) {
      // don't preventDefault on keyboard shortcuts
      return
    }

    if (TextSplash.singleton.maybeClose()) { raf() }

    switch (e.key) {
      case "r":
      case "R": {
        if (editorActive()) { return }
        loadActors()
        await initGame()
      } break
      case "Escape": {
        await toggleEditorGameMode()
        raf()
      } break
      case "Tab": {
        if (editorActive()) {
          switchLayer()
          raf()
        }
      } break
      case "Alt": {
        suppressBrushPreview = true
        raf()
      } break
      case "Shift": {
        suppressBrushPreview = true
        raf()
      } break
    }
    e.preventDefault()
    return false
  })
  window.addEventListener("keyup", async (e) => {
    switch (e.key) {
      case "Alt": {
        suppressBrushPreview = false
        raf()
      } break
      case "Shift": {
        suppressBrushPreview = false
        if (actorInFlight) {
          mouseHeld = false
          actorInFlight = null
        }
        raf()
      } break
    }
  })
}

function registerMouseListeners() {
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault()
    return false
  })
  window.addEventListener("wheel", (e) => {
    if (editorActive()) {
      cycleBrush(-Math.sign(e.wheelDelta))
      raf()
    }
    e.preventDefault()
    return false
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

  editorButton.onclick = async () => { await toggleEditorGameMode(); raf() }
  saveButton.onclick = saveLevel
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
  registerKeyListeners()
  registerMouseListeners()
  mousepos = new CanvasPos({x: null, y: null});
  await reset()
}

async function reset() {
  loadTiles()
  fitCanvasToTiles()

  loadActors()

  initEditor()
  setEditor(false) // start with editor off
  await initGame()

  isPlayerTurn = true;
  bufferedInput = null;

  raf()
}
window.onload = init
