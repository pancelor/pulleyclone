function initEditor() {
  // toggleEditor() // start with editor off
  buildBrushSelect()
  editorLayer = LAYER_TILE
}

async function toggleEditor() {
  if (editorActive()) {
    editor.style.display = "none"
    await initTileCache()
  } else {
    editor.style.display = null
  }
  raf()
}

function editorActive() {
  return editor.style.display !== "none"
}

function buildBrushSelect() {
  for (let img of tilesList.children){
    const option = document.createElement('option')
    option.value = img.id
    option.innerHTML = img.id
    brushSelect.appendChild(option)
  }
}

const LAYER_TILE = 1
const LAYER_ACTOR = 2
function switchLayer() {
  if (editorLayer === LAYER_TILE) {
    editorLayer = LAYER_ACTOR
  } else if (editorLayer === LAYER_ACTOR) {
    editorLayer = LAYER_TILE
  }
}

function saneMod(x, y) {
  // mod(x, y) returns a number in [0, y), like % should do (but doesn't)
  x = x % y
  if (x < 0) { x += y}
  return x
}
assert(saneMod(3, 10) === 3)
assert(saneMod(0, 10) === 0)
assert(saneMod(10, 10) === 0)
assert(saneMod(-6, 10) === 4)

function cycleBrush(delta) {
  // delta is how many brushes to change by
  // delta will usually be either -1 or 1
  brushSelect.selectedIndex = saneMod(brushSelect.selectedIndex + delta, brushSelect.options.length)
  raf()
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

function drawBrush(ctx) {
  // drawCircle(ctx, mousepos, 2)

  const img = document.getElementById(brushSelect.value)
  ctxWith(ctx, {globalAlpha: 0.50}, () => {
    if (inbounds(mousepos)) {
      drawImg(ctx, img, mousepos.toTilePos())
    }
  })
}

function drawEditor(ctx) {
  drawTiles(ctx)
  ctxWith(ctx, {globalAlpha: 0.850}, () => {
    drawActors(ctx)
  })

  ctxWith(ctx, {globalAlpha: 0.75, strokeStyle: "gray"}, drawGrid)

  drawBrush(ctx)
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

function eyedropTile() {
  let tileName = getTile(mousepos)
  if (tileName === null) {
    brushSelect.selectedIndex = 0
  } else {
    brushSelect.value = tileName
  }
}

function eraseTile() {
  setTile(mousepos, "erase")
}

function paintTile() {
  const name = brushSelect.value
  setTile(mousepos, name)
}
