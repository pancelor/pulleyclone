function initEditor() {
  // toggleEditor() // start with editor off
  buildBrushSelect()
}

function toggleEditor() {
  if (editorActive()) {
    editor.style.display = "none"
  } else {
    editor.style.display = null
  }
}

function editorActive() {
  return editor.style.display !== "none"
}

function buildBrushSelect() {
  for (let x of Object.keys(reverseLookupTile)){
    const option = document.createElement('option')
    option.value = x
    option.innerHTML = x
    brushSelect.appendChild(option)
  }
}

function cycleBrush() {
  const L = brushSelect.options.length
  brushSelect.selectedIndex = (brushSelect.selectedIndex + 1) % L
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
  // ctxWith(ctx, {fillStyle: "lightgray"}, () => {
  //   ctx.fillRect(0, 0, canvas.width, canvas.height);
  // })

  ctxWith(ctx, {globalAlpha: 0.33, strokeStyle: "gray"}, drawGrid)

  drawBrush(ctx)
}

function clickBrush(e) {
  const type = brushSelect.value
  const code = reverseLookupTile[type]
  setTile(mousepos, code)
}

function setTile(p, code) {
  if (inbounds(p)) {
    tiles[p.tileRR()][p.tileCC()] = code
  }
}
