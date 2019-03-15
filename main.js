// multipleFilesExample()

//
// helpers
//

function drawMessage(ctx, msg) {
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = "white";
  fillRectCentered(ctx, W/2, H/2, W*0.9 + 10, H*0.1 + 10)
  ctx.fillStyle = "#8873a3";
  fillRectCentered(ctx, W/2, H/2, W*0.9, H*0.1)
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

function randInt(min, max) {
  // returns an int
  //   randInt(a, b) -> [a, b)
  //   randInt(b) -> [0, b)
  if (max === undefined) {
    [min, max] = [0, min];
  }
  return Math.floor(Math.random() * (max-min)) + min;
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
  return 0 <= x && x < 10 && 0 <= y && y < 10
}

function locChecker(p) {
  return (other) => p.equals(other.pos)
}

//
// main game
//

function initTiles() {
  let t = tileData.trim().split('\n')
  tiles = [];
  for (var rr = 0; rr < t.length; rr++) {
    tiles.push([]);
    for (var cc = 0; cc < t[rr].length; cc++) {
      tiles[rr][cc] = t[rr][cc];
    }
  }
}

function init() {
  initTiles()
  initActors()
  isPlayerTurn = true;
  deadQueue = [];
  requestAnimationFrame(draw)
}
window.onload = init

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
  if (!checkWin() && !checkLose()) {
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
  for (var rr = 0; rr < tiles.length; rr++) {
    for (var cc = 0; cc < tiles[rr].length; cc++) {
      const code = tiles[rr][cc]
      const type = lookupTile[code]
      const img = document.getElementById(type)
      const pos = new TilePos({x: cc, y: rr})
      drawImg(ctx, img, pos)
      // ctx.drawImage(img, x*img.width, y*img.height)
    }
  }
}

function drawImg(ctx, img, pos) {
  const {x, y} = pos.toScreenPos()
  ctx.drawImage(img, x, y)
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

  const img = document.getElementById("grass");
  ctx.fillStyle = ctx.createPattern(img, 'repeat');
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const offset = getCameraOffset()
  ctx.translate(offset.x, offset.y)
  drawTiles(ctx);
  drawActors(ctx);
  ctx.translate(-offset.x, -offset.y)

  if (checkWin()) {
    drawMessage(ctx, "You win! :-)")
  } else if (checkLose()) {
    drawMessage(ctx, "You lose! :-(")
  } else {
    requestAnimationFrame(draw)
  }
}

//
// globals
//

let actors;
let tiles;
let deadQueue;
let isPlayerTurn;

const lookupTile = {
  0: "grass",
  1: "dirt",
  2: "tree",
  3: "brick",
  4: "mountain",
  5: "potion",
  6: "slime",
  7: "hero",
}

//
// classes
//

class TilePos {
  constructor({x, y}) {
    this.x = Math.floor(x)
    this.y = Math.floor(y)
    // this.centered = centered
  }

  toTilePos() {
    return this
  }

  toScreenPos() {
    // const x = this.x + (this.centered ? 0.5 : 0)
    // const y = this.y + (this.centered ? 0.5 : 0)
    return new ScreenPos({
      x: this.x*gridX,
      y: this.y*gridY,
    })
  }

  equals(other) {
    const {x, y} = other.toTilePos()
    return this.x === x && this.y === y
  }
}

class ScreenPos {
  constructor({x, y}) {
    this.x = x
    this.y = y
  }

  toTilePos() {
    return new TilePos({
      rr: this.y / gridY,
      cc: this.x / gridX,
    })
  }

  toScreenPos() {
    return this
  }

  equals(other) {
    const {x: tx, y: ty} = this.toTilePos()
    const {x: ox, y: oy} = other.toTilePos()
    return tx === ox && ty === oy
  }
}

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
    if (tileAtIncludes(p, ["brick", "tree", "mountain"])) { return; }
    if (slimes().some(locChecker(p))) { return; }
    if (heros().some(locChecker(p))) { return; }
    this.pos = p;
  }
}

class Alive extends Actor {
  constructor(x, y, img, hp, atk) {
    super(x, y, img);
    this.hp = hp;
    this.maxhp = hp;
    this.atk = atk;
  }

  draw(ctx) {
    Actor.prototype.draw.call(this, ctx);
    let {x, y} = this.pos.toScreenPos()
    x += gridX / 2
    y += gridY / 2 - 40

    // maxhp
    ctx.fillStyle = "#c5648f";
    fillRectCentered(ctx, x, y, 48, 8);

    // hp
    const width = 48 * (this.hp / 4.0);
    ctx.fillStyle = "#ff6b7d";
    fillRectCentered(ctx, x, y, width, 8);
  }

  tryAttack(enemies, p) {
    const other = enemies.find(locChecker(p))
    if (other) {
      other.takeDamage(this.atk);
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      deadQueue.push(this);
    }
  }
}

class Potion extends Actor {
  constructor(x, y) {
    const img = document.getElementById("potion");
    super(x, y, img);
  }
}

class Hero extends Alive {
  constructor(x, y) {
    const img = document.getElementById("hero");
    super(x, y, img, 4, 1);
  }

  update(dir) {
    const dx = [1,0,-1,0][dir];
    const dy = [0,-1,0,1][dir];
    const {x, y} = this.pos.toTilePos()
    const newX = x + dx;
    const newY = y + dy;
    const p = new TilePos({x: newX, y: newY})
    this.tryMove(p);
    this.tryDrink();
    this.tryAttack(slimes(), p);
  }

  tryDrink() {
    const potion = potions().find(locChecker(this.pos))
    if (potion) {
      this.hp = this.maxhp;
      deadQueue.push(potion);
    }
  }
}

class Slime extends Alive {
  constructor(x, y) {
    const img = document.getElementById("slime");
    super(x, y, img, 2, 1);
  }

  update() {
    const dir = randInt(4);
    const dx = [1,0,-1,0][dir];
    const dy = [0,-1,0,1][dir];
    const {x, y} = this.pos.toTilePos()
    const newX = x + dx;
    const newY = y + dy;
    const p = new TilePos({x: newX, y: newY})
    this.tryMove(p);
    this.tryAttack(heros(), p);
  }
}

//
// event handler
//

window.onkeyup = (e) => {
  let dir;
  switch (e.key) {
    case "d":
    case "ArrowRight":
      dir = 0;
      break;
    case "w":
    case "ArrowUp":
      dir = 1;
      break;
    case "a":
    case "ArrowLeft":
      dir = 2;
      break;
    case "s":
    case "ArrowDown":
      dir = 3;
      break;
  }
  if (dir === undefined) {return;}
  if (!isPlayerTurn) {return;}
  isPlayerTurn = false;
  update(dir);
}
