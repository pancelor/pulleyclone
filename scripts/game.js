//
// globals
//

let actors;
let tiles;
let deadQueue;

//
// main game
//

function initGame() {
  pairElevators()
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
  return false;
}

async function update(dir) {
  if (!checkWin()) {
    hero().update(dir);
    purgeDead();
    raf()
    await sleep(100)
    while (doGravity()) {
      raf()
      await sleep(100)
    }
    // purgeDead();
    // raf()
  }
}

function doGravity() {
  const h = hero()
  if (!h) { return false }
  const p = h.pos
  const pUnder = posDir(h.pos, 3)
  const t = getTile(p)
  const tUnder = getTile(pUnder)

  if (tUnder === "dirt") { return false }
  if (tUnder === "platform") { return false }
  if (tUnder === "ladderPlatform") { return false }
  if (t === "ladderPlatform") { return false }
  if (t === "ladder") { return false }

  h.pos = pUnder
  return true
}

function getCameraOffset() {
  const h = hero()
  if (!h) {
    return { x:0, y:0 }
  }

  const W = canvas.width;
  const H = canvas.height;
  let {x, y} = h.pos.toCanvasPos();
  x += gridX / 2;
  y += gridY / 2;
  return { x: W/2 - x, y: H/2 - y }
}

function tilesDim() {
  return {
    width: (tiles && tiles.length > 0) ? tiles[0].length : 0,
    height: tiles.length,
  }
}

function modifyTilesDim(dWidth, dHeight) {
  let {width, height} = tilesDim()
  width = clamp(width+dWidth, 1, 1000),
  height = clamp(height+dHeight, 1, 1000),
  setTilesDim(width, height)
}

function setTilesDim(newWidth, newHeight) {
  assert(editorActive())
  const {width: oldNcc, height: oldNrr} = tilesDim()
  // const before = exportTilesString();
  const nrr = newHeight
  const ncc = newWidth
  // console.log({oldNrr, oldNcc, nrr, ncc});
  oldTiles = tiles
  tiles = []
  for (let rr = 0; rr < nrr; rr++) {
    tiles.push([]);
    for (let cc = 0; cc < ncc; cc++) {
      tiles[rr][cc] = (rr >= oldNrr || cc >= oldNcc) ? "erase" : oldTiles[rr][cc];
    }
  }
  for (let a of actors) {
    if (a.pos.tileRR() >= nrr || a.pos.tileCC() >= ncc) {
      deadQueue.push(a)
    }
  }
  purgeDead() // HACK: we're kinda abusing the dead queue here
  // const after = exportTilesString();
  // console.log(before)
  // console.log(after);
  fitCanvasToTiles()
  raf()
}

function fitCanvasToTiles() {
  const {width, height} = tilesDim()
  canvas.width = width*gridX
  canvas.height = height*gridX
}

let tileCache;
async function initTileCache(cb) {
  const newCanvas = document.createElement("canvas")
  newCanvas.width = canvas.width
  newCanvas.height = canvas.height
  const newCtx = newCanvas.getContext('2d')
  newCtx.imageSmoothingEnabled = false
  drawTiles(newCtx)
  tileCache = await createImageBitmap(newCanvas)
}

// TODO: if we don't redraw the *entire* screen we wouldn't even need to call this every raf
// (well, we'd need to blit the relevant part, obviously)
function drawTilesCached(ctx) {
  assert(tileCache, "missing tile cache")
  ctx.drawImage(tileCache, 0, 0)
}

function drawTiles(ctx) {
  drawBkg(ctx)
  const {width: ncc, height: nrr} = tilesDim()
  for (let rr = 0; rr < nrr; rr++) {
    for (let cc = 0; cc < ncc; cc++) {
      const name = tiles[rr][cc]
      if (name === "erase") { continue; }
      const img = document.getElementById(name)
      const pos = new TilePos({x: cc, y: rr})
      drawImg(ctx, img, pos)
    }
  }
}

function drawActors(ctx) {
  actors.forEach(e=>e.draw(ctx));
}

function drawGame(ctx) {
  // const offset = getCameraOffset()
  // ctx.translate(offset.x, offset.y)
  drawTilesCached(ctx);
  drawActors(ctx);
  // ctx.translate(-offset.x, -offset.y)

  if (checkWin()) {
    drawMessage(ctx, "You win!")
  }
}

function pointRectCollision(p, rect) {
  const {x, y} = p.toCanvasPos()
  const x0 = rect.x
  const y0 = rect.y
  const x1 = rect.x + rect.w
  const y1 = rect.y + rect.h
  return x0 <= x && x < x1 && y0 <= y && y < y1
}

//
// classes
//

class Pos {
  constructor({x, y}) {
    this.x = x
    this.y = y
  }

  tileX() { return this.toTilePos().x }
  tileY() { return this.toTilePos().y }
  tileRR() { return this.toTilePos().y }
  tileCC() { return this.toTilePos().x }
  canvasX() { return this.toCanvasPos().x }
  canvasY() { return this.toCanvasPos().y }

  equals(other) {
    if (this.constructor !== other.constructor) { return false }
    return this.x === other.x && this.y === other.y
  }

  clone() {
    return new this.constructor({x: this.x, y: this.y})
  }
}

class TilePos extends Pos {
  constructor({x, y}) {
    super({x: Math.floor(x), y: Math.floor(y)})
    // this.centered = centered
  }

  toTilePos() {
    return this
  }

  toCanvasPos() {
    if (this.x === null || this.y === null) {
      return new CanvasPos({
        x: this.x,
        y: this.y,
      })
    }
    // const x = this.x + (this.centered ? 0.5 : 0)
    // const y = this.y + (this.centered ? 0.5 : 0)
    return new CanvasPos({
      x: this.x*gridX,
      y: this.y*gridY,
    })
  }
}

class CanvasPos extends Pos {
  constructor({x, y}) {
    super({x, y})
  }

  toTilePos() {
    if (this.x === null || this.y === null) {
      return new CanvasPos({
        x: this.x,
        y: this.y,
      })
    }
    return new TilePos({
      x: this.x / gridX,
      y: this.y / gridY,
    })
  }

  toCanvasPos() {
    return this
  }
}

function posDir(p, dir) {
  const dx = [1,0,-1,0][dir];
  const dy = [0,-1,0,1][dir];
  return p = new (p.constructor)({
    x: p.tileX() + dx,
    y: p.tileY() + dy,
  })
}

//
// actors
//

class Actor {
  constructor(pos, img) {
    this.pos = pos
    this.img = this.constructor.img
  }

  draw(ctx){
    drawImg(ctx, this.img, this.pos)
  }

  tryMove(p) {
    if (!inbounds(p)) { return; }
    if (getTile(p) === "dirt") { return; }
    this.pos = p;
  }

  boundingBox() {
    assert(this.constructor.img !== null, `actor ${this.constructor} has no img`)
    return {
      x: this.pos.canvasX(),
      y: this.pos.canvasY(),
      w: this.constructor.img.width*imgScale,
      h: this.constructor.img.height*imgScale,
    }
  }

  serialize() {
    return `${this.constructor.name} ${this.pos.tileX()} ${this.pos.tileY()}`
  }

  static deserialize(line) {
    const [type, x, y] = line.split(' ')
    assert(type === this.name, `expected ${this.name} got ${type}`)
    return new (this)(new TilePos({x, y}))
  }
}

class Hero extends Actor {
  static img = imgHeroR

  update(dir) {
    const pCurr = this.pos
    const pNext = posDir(pCurr, dir)
    const tCurr = getTile(pCurr)
    const tNext = getTile(pNext)

    if (dir === 0) { this.img = imgHeroR }
    if (dir === 2) { this.img = imgHeroL }

    if (!inbounds(pNext)) { return }
    if (tNext === "dirt") { return }

    // ladders
    if (dir === 3 && tNext === "ladderPlatform") {
      this.pos = pNext
      this.img = imgHeroClimb
    }
    if (tCurr === "ladderPlatform" || tCurr === "ladder") {
      // if (tCurr === "ladder" && dir === 1) { return }
      // the guy will hop up off of bare ladders that have no platform at the top; this is a bit
      this.pos = pNext;
      if (dir === 1 || dir === 3) { this.img = imgHeroClimb }
    }

    // elevators
    const pBelow = posDir(pCurr, 3)
    const eBelow = findActor(Elevator, pBelow)
    console.log({eBelow});
    // if (dir === 1 && tBelow ===)

    // move horizontally
    if (dir === 0 || dir === 2) { this.pos = pNext }
  }
}

class Block extends Actor {
  static img = imgBlock
}

class Gem extends Actor {
  static img =  imgGem
}

class Wheel extends Actor { static img = imgWheel }
class WireH extends Actor { static img = imgWireH }
class WireV extends Actor { static img = imgWireV }

class Elevator extends Actor {
  static img = imgElevator
}

function pairElevators() {
  allActors(Elevator).forEach(pairElevator)
}

function pairElevator(e) {
  // Tries to pair the given elevator. returns whether it was successful
  if (e.pair) { return true }

  let lastTrace;
  let trace = e
  let dir = 1
  while (true) {
    lastTrace = trace
    switch (trace.constructor) {
      case Elevator: {
        if (trace === e) {
          trace = findActor(WireV, posDir(trace.pos, dir))
          if (!trace) { console.warn("bad elevator connection from", lastTrace.serialize()); return false }
        } else {
          e.pair = trace
          trace.pair = e
          return true
        }
      } break
      case WireV: {
        trace = findActor([WireV, Wheel, Elevator], posDir(trace.pos, dir))
        if (!trace) { console.warn("bad elevator connection from", lastTrace.serialize()); return false }
      } break
      case WireH: {
        trace = findActor([WireH, Wheel], posDir(trace.pos, dir))
        if (!trace) { console.warn("bad elevator connection from", lastTrace.serialize()); return false }
      } break
      case Wheel: {
        const dirIsVert = (dir === 1 || dir === 3)
        let dirToTry = dirIsVert ? [0, 2] : [1, 3]
        let target = dirIsVert ? WireH : WireV
        const res = dirToTry.map(d=>findActor(target, posDir(trace.pos, d)))
        assert(res.length === 2)
        if (!xor(res[0], res[1])) { console.warn("bad elevator connection from", lastTrace.serialize()); return false }

        if (res[0]) { trace = res[0]; dir = dirToTry[0] }
        if (res[1]) { trace = res[1]; dir = dirToTry[1] }
      } break
    }
  }
}

const allActorTypes = [Hero, Block, Gem, Wheel, WireH, WireV, Elevator]

//
// helpers
//

function hero() {
  return actors.find(e=>e.constructor===Hero);
}

function allActors(cst) {
  // allActors() -> all actors
  // allActors(Foo) -> all actors with constructor Foo
  // allActors([Foo, Bar]) -> all actors with constructor Foo or constructor Bar
  if (!cst) { return actors }
  if (Array.isArray(cst)) {
    return actors.filter(a=>cst.includes(a.constructor))
  } else {
    return actors.filter(a=>a.constructor===cst)
  }
}

function findActor(cst, p) {
  const as = allActors(cst)
  if (p) {
    return as.find(a=>a.pos.toTilePos().equals(p))
  } else {
    return as[0]
  }
}

function inbounds(p) {
  const {x, y} = p.toTilePos()
  const {width, height} = tilesDim()
  if (x == null || y == null) { return false }
  return 0 <= x && x < width && 0 <= y && y < height
}

function locChecker(p) {
  return (other) => p.equals(other.pos)
}

function tileAtIncludes(p, names){
  const name = tiles[p.tileRR()][p.tileCC()]
  return names.includes(name)
}
