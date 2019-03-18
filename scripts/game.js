//
// globals
//

let actors;
let tiles;
let deadQueue;

//
// main game
//

async function initGame() {
  await initTileCache()
  pairElevators()
  await doGravity()
}

function uniq(arr) {
  return [...new Set(arr)]
}

function purgeDead() {
  const t1 = uniq(deadQueue)
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
    light().shine()
    purgeDead();
    raf()
    await doGravity()
  }
}

async function doGravity() {
  let moreGravity = true
  while (moreGravity) {
    await sleep(waitTime)
    moreGravity = await doGravityOnce()
    light().shine()
    raf()
  }
}

async function doGravityOnce() {
  // returns whether more gravity should happen
  if (editorActive()) { return false }
  return actors.some(a=>a.doGravity())
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
  light().draw(ctx)
  allActorsExcept(Light).forEach(e=>e.draw(ctx));
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

  str() {
    return `${this.constructor.name}(${this.x}, ${this.y})`
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

function posDir(p, dir, len=1) {
  const dx = [1,0,-1,0][dir];
  const dy = [0,-1,0,1][dir];
  return p = new (p.constructor)({
    x: p.tileX() + len*dx,
    y: p.tileY() + len*dy,
  })
}

//
// actors
//

class Actor {
  constructor(pos) {
    this.pos = pos
    this.img = this.constructor.img
  }

  draw(ctx){
    drawImg(ctx, this.img, this.pos)
  }

  fiddle() {
    // rotate through various possible states in the level editor
    return
  }

  update(dir) {
    // returns whether it moved in the given dir
    return false
  }

  doGravity() {
    // returns whether it fell a single tile (otherwise it did nothing)
    return false
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
    const p = new TilePos({x: int(x), y: int(y)})
    return new (this)(p)
  }
}

class Hero extends Actor {
  static img = imgHeroR

  update(dir) {
    const dx = dir === 0 || dir === 2
    const dy = dir === 1 || dir === 3

    const pCurr = this.pos
    const pNext = posDir(pCurr, dir)
    const tCurr = getTile(pCurr)
    const tNext = getTile(pNext)

    if (dir === 0) { this.img = imgHeroR }
    if (dir === 2) { this.img = imgHeroL }

    if (!inbounds(pNext)) { return false }
    if (tNext === "dirt") { return false }

    const collidables = [Block, Mirror, Gem, Wheel]
    const coll = findActor(collidables, pNext)
    if (coll) {
      if (dy) { return false }
      assert(dx)
      if (!coll.update(dir)) { return false }
      this.pos = pNext
      return true
    }

    // ladders
    if (dir === 3 && tNext === "ladderPlatform") {
      this.pos = pNext
      this.img = imgHeroClimb
      return true
    }
    if (dy && tCurr === "ladderPlatform") {
      this.pos = pNext
      this.img = imgHeroClimb
      return true
    }
    if (dy && tCurr === "ladder") {
      this.pos = pNext;
      this.img = imgHeroClimb
      return true
    }

    // elevators
    if (dy) {
      const pBelow = posDir(pCurr, 3)
      const eBelow = findActor(Elevator, pBelow)
      if (eBelow && eBelow.update(dir)) {
        // don't need to update this.pos b/c eBelow will do it for us
        // this.pos = pNext
        return true
      }
    }

    // move horizontally
    if (dx) {
      this.pos = pNext
      return true
    }
  }

  fiddle() {
    switch (this.img) {
      case imgHeroR: {
        this.img = imgHeroClimb
      } break
      case imgHeroClimb: {
        this.img = imgHeroL
      } break
      default: {
        this.img = imgHeroR
      } break
    }
  }

  doGravity() {
    return fallableDoGravity(this, [Elevator, Block, Mirror, Gem])
  }
}

class Block extends Actor {
  static img = imgBlock
}

class Gem extends Actor {
  static img =  imgGem

  update(dir) {
    assert(dir === 0 || dir === 2)
    return pushableUpdate(this, dir, [Block, Mirror, Gem, Wheel, Hero])
  }

  doGravity() {
    return fallableDoGravity(this, [Elevator, Block, Mirror, Gem])
  }
}

class Wheel extends Actor { static img = imgWheel }
class WireH extends Actor { static img = imgWireH }
class WireV extends Actor { static img = imgWireV }

class Elevator extends Actor {
  static img = imgElevator

  tryPair() {
    // Tries to pair this elevator
    // returns whether it was successful
    if (this.pair) { return true }

    let lastTrace;
    let trace = this
    let dir = 1
    while (true) {
      lastTrace = trace
      switch (trace.constructor) {
        case Elevator: {
          if (trace === this) {
            trace = findActor(WireV, posDir(trace.pos, dir))
            if (!trace) { console.warn("bad elevator connection from", lastTrace.serialize()); return false }
          } else {
            this.pair = trace
            trace.pair = this
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
          let target = dirIsVert ? [Wheel, WireH] : [Wheel, WireV]
          const res = dirToTry.map(d=>findActor(target, posDir(trace.pos, d)))
          assert(res.length === 2)
          if (!xor(res[0], res[1])) { console.warn("bad elevator connection from", lastTrace.serialize()); return false }

          if (res[0]) { trace = res[0]; dir = dirToTry[0] }
          if (res[1]) { trace = res[1]; dir = dirToTry[1] }
        } break
      }
    }
  }

  update(dir) {
    if (!this.pair) { return false }
    if (dir === 0 || dir === 2) { return false }
    const pairDir = saneMod(dir + 2, 4)

    const possibleCargo = [Hero, Wheel, Mirror, Gem]
    const cargo = findActor(possibleCargo, posDir(this.pos, 1))
    const cargo2 = findActor(possibleCargo, posDir(this.pos, 1, 2))
    const pairCargo = findActor(possibleCargo, posDir(this.pair.pos, 1))
    const pairCargo2 = findActor(possibleCargo, posDir(this.pair.pos, 1, 2))

    if (cargo && cargo2 && dir === 1) { return false }
    if (pairCargo && pairCargo2 && pairDir === 1) { return false }

    const posNext = posDir(this.pos, dir)
    const pairPosNext = posDir(this.pair.pos, pairDir)

    // check *current* (not next) positions b/c elevators can actually go one tile into dirt
    if (getTile(this.pos) === "dirt" && dir === 3) { return false }
    if (getTile(this.pair.pos) === "dirt" && pairDir === 3) { return false }

    // move
    const wire = findActor(WireV, (dir === 1) ? posNext : pairPosNext)
    wire.pos = (dir === 1) ? this.pair.pos : this.pos
    this.pos = posNext
    this.pair.pos = pairPosNext
    if (cargo) {
      cargo.pos = posDir(this.pos, 1)
    }
    if (pairCargo) {
      pairCargo.pos = posDir(this.pair.pos, 1)
    }
    return true
  }
}

class Mirror extends Actor {
  static img = imgMirrorUR

  constructor(p, rot=0) {
    super(p)
    this.rot = rot
    this.setImgFromRot()
  }

  update(dir) {
    assert(dir === 0 || dir === 2)
    return pushableUpdate(this, dir, [Block, Mirror, Gem, Wheel, Hero])
  }

  fiddle() {
    this.rot = saneMod(this.rot + 1, 4)
    this.setImgFromRot()
  }

  setImgFromRot() {
    switch (this.rot) {
      case 0: { this.img = imgMirrorUR } break
      case 1: { this.img = imgMirrorUL } break
      case 2: { this.img = imgMirrorDL } break
      case 3: { this.img = imgMirrorDR } break
      default: { assert(0, "bad mirror rot") } break
    }
  }

  bounceDir(dir) {
    const opp = d=>saneMod(d+2, 4)
    const inA = opp(this.rot)
    const inB = opp(this.rot+1)
    if (dir === inA) {
      return opp(inB)
    } else if (dir === inB) {
      return opp(inA)
    } else {
      return null
    }
  }

  doGravity() {
    return fallableDoGravity(this, [Elevator, Block, Mirror, Gem])
  }

  serialize() {
    return `${this.constructor.name} ${this.pos.tileX()} ${this.pos.tileY()} ${this.rot}`
  }

  static deserialize(line) {
    let [type, x, y, rot] = line.split(' ')
    assert(type === this.name, `expected ${this.name} got ${type}`)
    const p = new TilePos({x: int(x), y: int(y)})
    rot = int(rot)
    return new (this)(p, rot)
  }
}

class Light extends Actor {
  static img = imgLight3

  constructor(p) {
    super(p)
    this.shine()
  }

  shine() {
    // TODO: reflect in the gem

    let dir = 0
    let pos = this.pos.clone()
    let nextPos
    this.path = [pos]
    while (true) {
      nextPos = posDir(pos, dir)

      // stop at dirt or oob
      if (getTile(nextPos) === "dirt" || !inbounds(nextPos)) {
        break
      }

      // kill blocks
      const block = findActor(Block, nextPos)
      if (block) { deadQueue.push(block) }

      // reflect
      const mirror = findActor(Mirror, nextPos)
      if (mirror) {
        const nextDir = mirror.bounceDir(dir)
        if (nextDir === null) { break }
        dir = nextDir
      }

      this.path.push(nextPos)
      pos = nextPos
    }
  }

  draw(ctx) {
    assert(this.path.length >= 2, "light path too short")
    drawImg(ctx, imgLight1, this.path[0])
    drawImg(ctx, imgLight2, this.path[1])
    for (const p of this.path.slice(2)) {
      drawImg(ctx, imgLight3, p)
    }
  }
}

const allActorTypes = [Hero, Block, Gem, Wheel, WireH, WireV, Elevator, Mirror, Light]

function fallableDoGravity(that, collidables) {
  const p = that.pos
  const pUnder = posDir(that.pos, 3)
  const t = getTile(p)
  const tUnder = getTile(pUnder)

  if (tUnder === "dirt") { return false }
  if (tUnder === "platform") { return false }
  if (tUnder === "ladderPlatform") { return false }
  if (t === "ladderPlatform") { return false }
  if (t === "ladder") { return false }
  if (findActor(collidables, pUnder)) { return false }

  that.pos = pUnder
  return true
}

function pushableUpdate(that, dir, collidables) {
  const pCurr = that.pos
  const pNext = posDir(pCurr, dir)
  const tCurr = getTile(pCurr)
  const tNext = getTile(pNext)

  if (!inbounds(pNext)) { return false }
  if (tNext === "dirt") { return false }

  const coll = findActor(collidables, pNext)
  if (coll) { return false }

  that.pos = pNext
  return true
}

function pairElevators() {
  const es = allActors(Elevator)
  es.forEach(e=>e.pair=null)
  es.forEach(e=>e.tryPair())
}

//
// helpers
//

function hero() {
  return actors.find(e=>e.constructor===Hero);
}

function light() {
  return actors.find(e=>e.constructor===Light);
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

function allActorsExcept(cst) {
  // allActorsExcept() -> all actors
  // allActorsExcept(Foo) -> all actors except those with constructor Foo
  // allActorsExcept([Foo, Bar]) -> all actors except those with constructor Foo or constructor Bar
  if (!cst) { return actors }
  if (Array.isArray(cst)) {
    return actors.filter(a=>!cst.includes(a.constructor))
  } else {
    return actors.filter(a=>a.constructor!==cst)
  }
}

function findActor(cst, p) {
  const as = allActors(cst)
  if (p) {
    return as.find(a=>a.pos.toTilePos().equals(p.toTilePos()))
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
