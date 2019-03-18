function initEditor() { // TODO: 'init' here is a bad misuse of the word
  editorLayer = LAYER_TILE
  toggleEditor() // start with editor off
  buildBrushSelect()
}

async function toggleEditor() {
  if (editorActive()) {
    editor.style.display = "none"
    await initGame()
  } else {
    editor.style.display = null
  }
}

function editorActive() {
  return editor.style.display !== "none"
}

function buildBrushSelect() {
  resetBrushSelect()
  if (editorLayer === LAYER_TILE) {
    buildTileBrushSelect()
  } else if (editorLayer === LAYER_ACTOR) {
    buildActorBrushSelect()
  }
  brushSelect.selectedIndex = 1
}

function resetBrushSelect() {
  const x = document.createElement('select')
  x.id = brushSelect.id
  brushSelect.replaceWith(x)
}

function addBrushSelectOption(name) {
  const option = document.createElement('option')
  option.value = name
  option.innerHTML = name
  brushSelect.appendChild(option)
}

function buildActorBrushSelect() {
  addBrushSelectOption("erase")
  for (let name of Object.keys(deserActorClass)){
    addBrushSelectOption(name)
  }
}

function buildTileBrushSelect() {
  for (let img of tilesList.children){
    addBrushSelectOption(img.id)
  }
}

function saveLevel() {
  downloadFile("level.dat", exportLevelString())
}

const LAYER_TILE = 1
const LAYER_ACTOR = 2
function switchLayer() {
  if (editorLayer === LAYER_TILE) {
    editorLayer = LAYER_ACTOR
  } else if (editorLayer === LAYER_ACTOR) {
    editorLayer = LAYER_TILE
  }
  buildBrushSelect()
}

function cycleBrush(delta) {
  // delta is how many brushes to change by
  // delta will usually be either -1 or 1
  brushSelect.selectedIndex = saneMod(brushSelect.selectedIndex + delta, brushSelect.options.length)
}

function drawGrid(ctx) {
  const nrr = tiles.length
  const ncc = tiles[0].length
  for (let rr = 0; rr <= nrr; rr++) {
    drawLine(ctx,
      new TilePos({y: rr, x:0}),
      new TilePos({y: rr, x:ncc}),
    )
  }
  for (let cc = 0; cc <= ncc; cc++) {
    drawLine(ctx,
      new TilePos({y:0,   x: cc}),
      new TilePos({y:nrr, x: cc}),
    )
  }
}

function currentBrushImg() {
  if (editorLayer === LAYER_TILE) {
    const name = brushSelect.value
    if (name === "erase") { return null }
    return document.getElementById(name)
  } else if (editorLayer === LAYER_ACTOR) {
    if (suppressBrushPreview) { return null }
    const name = brushSelect.value
    if (name === "erase") { return null }
    return deserActorClass[name].img
  } else { assert(0) }
}

function drawBrush(ctx) {
  const img = currentBrushImg()
  if (img && inbounds(mousepos)) {
    drawImg(ctx, img, mousepos.toTilePos())
  }
}

function drawEditor(ctx) {
  let globalAlpha

  ctxWith(ctx, {fillStyle: "gray"}, cls)

  globalAlpha = (editorLayer === LAYER_TILE) ? 1 : 0.6
  ctxWith(ctx, {globalAlpha}, drawTiles)

  globalAlpha = (editorLayer === LAYER_ACTOR) ? 1 : 0.6
  ctxWith(ctx, {globalAlpha}, drawActors)

  ctxWith(ctx, {globalAlpha: 0.75, strokeStyle: "gray"}, drawGrid)

  ctxWith(ctx, {globalAlpha: 0.80}, drawBrush)
}

function getTile(p) {
  if (inbounds(p)) {
    return tiles[p.tileRR()][p.tileCC()]
  } else {
    return null
  }
}

function setTile(p, name) {
  if (inbounds(p)) {
    tiles[p.tileRR()][p.tileCC()] = name
  }
}

// function findActorAtPosPrecise(p) {
//   return actors.find(a=>pointRectCollision(p, a.boundingBox()))
// }

function doEyedrop() {
  if (editorLayer === LAYER_TILE) {
    let tileName = getTile(mousepos)
    if (tileName === null) {
      brushSelect.selectedIndex = 0
    } else {
      brushSelect.value = tileName
    }
  } else if (editorLayer === LAYER_ACTOR) {
    const a = findActor(null, mousepos)
    if (!a) {
      brushSelect.selectedIndex = 0
    } else {
      brushSelect.value = a.constructor.name
    }
  } else { assert(0) }
}

function doErase() {
  if (editorLayer === LAYER_TILE) {
    setTile(mousepos, "erase")
  } else if (editorLayer === LAYER_ACTOR) {
    const a = findActor(null, mousepos)
    if (!a) { return }
    deadQueue.push(a)
    purgeDead() // TODO: abusing dead queue here
  } else { assert(0) }
}

function doFiddle() {
  // rotate the actor at the mouse pos through dif states
  if (editorLayer === LAYER_TILE) {
    // do nothing
  } else if (editorLayer === LAYER_ACTOR) {
    const a = findActor(null, mousepos)
    if (!a) { return }
    a.fiddle()
  } else { assert(0) }
}

function doMove(a) {
  if (editorLayer === LAYER_TILE) {
    // do nothing
  } else if (editorLayer === LAYER_ACTOR) {
    if (!a) { return }
    a.pos = mousepos.toTilePos()
  } else { assert(0) }
}

function doPaint() {
  if (editorLayer === LAYER_TILE) {
    const name = brushSelect.value
    setTile(mousepos, name)
  } else if (editorLayer === LAYER_ACTOR) {
    doErase() // TODO: hacky
    const name = brushSelect.value
    if (name === "erase") { return null }
    const cst = deserActorClass[name]
    actors.push(new cst(mousepos.toTilePos()))
  } else { assert(0) }
}
