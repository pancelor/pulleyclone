//
// main game
//

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

function checkLose() {
  return heros().length === 0;
}

function update(dir) {
  // if (!checkWin() && !checkLose()) {
  if (!checkLose()) {
    heros().forEach(e=>e.update(dir));
    purgeDead();
    raf()
    setTimeout(() => {
      // TODO: do post-player updates here
      // slimes().forEach(e=>e.update());
      // purgeDead();
      // raf()
      isPlayerTurn = true;
    }, 100);
  }
}

function getCameraOffset() {
  const hero = heros()[0]
  if (!hero) {
    return { x:0, y:0 }
  }

  const W = canvas.width;
  const H = canvas.height;
  let {x, y} = hero.pos.toCanvasPos();
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

function drawTiles(ctx) {
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
  drawTiles(ctx);
  drawActors(ctx);
  // ctx.translate(-offset.x, -offset.y)

  if (checkWin()) {
    drawMessage(ctx, "You win!")
  } else if (checkLose()) {
    drawMessage(ctx, "You lose!")
  }
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

//
// actors
//

class Actor {
  constructor(x, y, img) {
    this.pos = new TilePos({x, y});
    this.img = img;
  }

  draw(ctx){
    drawImg(ctx, this.img, this.pos)
  }

  tryMove(p) {
    if (!inbounds(p)) { return; }
    if (tileAtIncludes(p, ["dirt"])) { return; }
    this.pos = p;
  }
}

class Block extends Actor {
  constructor(x, y) {
    const img = document.getElementById("block");
    super(x, y, img);
  }

  serialize() {
    return `block ${this.pos.tileX()} ${this.pos.tileY()}`
  }

  static deserialize(line) {
    const [type, x, y] = line.split(' ')
    assert(type === "block", `expected block got ${type}`)
    return new Block(x, y);
  }
}

class Gem extends Actor {
  constructor(x, y) {
    const img = document.getElementById("gem");
    super(x, y, img);
  }

  serialize() {
    return `gem ${this.pos.tileX()} ${this.pos.tileY()}`
  }

  static deserialize(line) {
    const [type, x, y] = line.split(' ')
    assert(type === "gem", `expected gem got ${type}`)
    return new Gem(x, y);
  }
}

class Hero extends Actor {
  constructor(x, y) {
    const img = document.getElementById("heroClimb");
    super(x, y, img, 4, 1);
  }

  update(dir) {
    const dx = [1,0,-1,0][dir];
    const dy = [0,-1,0,1][dir];
    const p = new TilePos({
      x: this.pos.tileX() + dx,
      y: this.pos.tileY() + dy,
    })
    this.tryMove(p);
  }

  serialize() {
    return `hero ${this.pos.tileX()} ${this.pos.tileY()}`
  }

  static deserialize(line) {
    const [type, x, y] = line.split(' ')
    assert(type === "hero", `expected hero got ${type}`)
    return new Hero(x, y);
  }
}

//
// helpers
//

function heros() {
  return actors.filter(e=>e.constructor===Hero);
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
