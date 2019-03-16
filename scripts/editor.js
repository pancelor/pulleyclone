function initEditor() {
  // toggleEditor() // start with editor off
  buildBrushSelect()
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
  for (let x of Object.keys(serTileName)){
    const option = document.createElement('option')
    option.value = x
    option.innerHTML = x
    brushSelect.appendChild(option)
  }
}

function cycleBrush() {
  const L = brushSelect.options.length
  brushSelect.selectedIndex = (brushSelect.selectedIndex + 1) % L
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

function clickBrush(e) {
  const name = brushSelect.value
  setTile(mousepos, name)
  raf()
}

function setTile(p, name) {
  if (inbounds(p)) {
    tiles[p.tileRR()][p.tileCC()] = name
  }
}
