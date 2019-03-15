// multipleFilesExample()

//
// helpers
//

function drawMessage(ctx, msg) {
  const W = canvas.width;
  const H = canvas.height;
  ctxWith(ctx, {globalAlpha: 0.66}, () => {
    ctx.fillStyle = "white";
    fillRectCentered(ctx, W/2, H/2, W*0.9 + 10, H*0.1 + 10)
    ctx.fillStyle = "#8873a3";
    fillRectCentered(ctx, W/2, H/2, W*0.9, H*0.1)
  })
  ctx.font = "30px Comic Sans MS";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(msg, W/2, H/2 + 10);
}

function fillRectCentered(ctx, cx, cy, w, h) {
  const x = cx - w/2;
  const y = cy - h/2;
  ctx.fillRect(x,y,w,h);
}

function heros() {
  return actors.filter(e=>e.constructor===Hero);
}

function slimes() {
  return actors.filter(e=>e.constructor===Slime);
}

function potions() {
  return actors.filter(e=>e.constructor===Potion);
}

function inbounds(p) {
  const {x, y} = p.toTilePos()
  if (x == null || y == null) { return false }
  return 0 <= x && x < 10 && 0 <= y && y < 10
}

function locChecker(p) {
  return (other) => p.equals(other.pos)
}

//
// main game
//

function initTiles() {
  let lines = tileData.trim().split('\n')
  const nrr = lines.length
  const ncc = lines[0].length
  tiles = [];
  for (let rr = 0; rr < nrr; rr++) {
    tiles.push([]);
    for (let cc = 0; cc < ncc; cc++) {
      tiles[rr][cc] = lines[rr][cc];
    }
  }
}

function exportTilesString() {
  const lines = []
  lines.push("const tileData = `")
  const nrr = tiles.length
  const ncc = tiles[0].length
  for (let rr = 0; rr < nrr; rr++) {
    const chars = []
    for (let cc = 0; cc < ncc; cc++) {
      chars.push(tiles[rr][cc]);
    }
    lines.push(chars.join(''))
  }
  lines.push("`")
  lines.push("")
  return lines.join("\n")
}

function initActors() {
  let lines = actorData.trim().split('\n')
  actors = [];
  for (let l of lines) {
    const [type, x, y] = l.split(' ')
    const constructor = lookupActor[type]
    actors.push(new constructor(x, y));
  }
}

function exportActorsString() {
  const lines = []
  lines.push("const actorData = `")
  for (let a of actors) {
    const {x, y} = a.pos.toTilePos()
    lines.push(`${a.img.id} ${x} ${y}`)
  }
  lines.push("`")
  lines.push("")
  return lines.join("\n")
}

function exportLevelString() {
  const lines = []
  lines.push(exportTilesString())
  lines.push(exportActorsString())
  return lines.join("\n")
}

function purgeDead() {
  const t1 = deadQueue
  const t2 =  t1.map(dead=>actors.findIndex(e=>e===dead))
  const t3 =  t2.sort((a, b)=>b-a)
              t3.forEach(i=>actors.splice(i, 1));
  // if(t3.length) {console.log({t1,t2,t3});}
  deadQueue = [];
}

function checkWin() {
  return slimes().length === 0;
}

function checkLose() {
  return heros().length === 0;
}

function update(dir) {
  // if (!checkWin() && !checkLose()) {
  if (!checkLose()) {
    heros().forEach(e=>e.update(dir));
    purgeDead();
    setTimeout(() => {
      slimes().forEach(e=>e.update());
      purgeDead();
      isPlayerTurn = true;
    }, 100);
  }
}

function getCameraOffset() {
  const hero = heros()[0]
  if (!hero) {
    return { x:0, y:0 }
  }

  const H = canvas.height;
  const W = canvas.width;
  let {x, y} = hero.pos.toScreenPos();
  x += gridX / 2;
  y += gridY / 2;
  return { x: W/2 - x, y: H/2 - y }
}

function drawTiles(ctx) {
  for (let rr = 0; rr < tiles.length; rr++) {
    for (let cc = 0; cc < tiles[rr].length; cc++) {
      const code = tiles[rr][cc]
      const type = lookupTile[code]
      const img = document.getElementById(type)
      const pos = new TilePos({x: cc, y: rr})
      drawImg(ctx, img, pos)
      // ctx.drawImage(img, x*img.width, y*img.height)
    }
  }
}

function drawImg(ctx, img, pos, scale=1) {
  const {x, y} = pos.toScreenPos()
  ctx.drawImage(img, x, y, img.width*scale, img.height*scale)
}

function drawLine(ctx, p1, p2) {
  const {x: x1, y: y1} = p1.toScreenPos()
  const {x: x2, y: y2} = p2.toScreenPos()
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function drawCircle(ctx, p, r) {
  const {x, y} = p.toScreenPos()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 2 * Math.PI)
  ctx.fill()
}

function ctxWith(ctx, map, cb) {
  const old = {}
  Object.keys(map).forEach((k) => {
    old[k] = ctx[k]
  })
  Object.assign(ctx, map)
  cb()
  Object.assign(ctx, old)
}

function tileAtIncludes(p, names){
  const {x, y} = p.toTilePos()
  const code = tiles[y][x]
  const type = lookupTile[code]
  return names.includes(type)
}

function drawActors(ctx) {
  actors.forEach(e=>e.draw(ctx));
}

function draw() {
  const ctx = canvas.getContext('2d');
  if (editorActive()) {
    drawEditor(ctx)
  } else {
    drawGame(ctx)
  }
  requestAnimationFrame(draw)
}

function drawGame(ctx) {
  // const img = document.getElementById("grass");
  // ctx.fillStyle = ctx.createPattern(img, 'repeat');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // const offset = getCameraOffset()
  // ctx.translate(offset.x, offset.y)
  drawTiles(ctx);
  drawActors(ctx);
  // ctx.translate(-offset.x, -offset.y)

  if (checkWin()) {
    drawMessage(ctx, "You win! :-)")
  } else if (checkLose()) {
    drawMessage(ctx, "You lose! :-(")
  }
}
