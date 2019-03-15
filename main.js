multipleFilesExample()

//
// helpers
//

function drawMessage(canvas, ctx, msg) {
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
  return entities.filter(e=>e.constructor===Hero);
}

function obstacles() {
  return entities.filter(e=>e.constructor===Obstacle);
}

function slimes() {
  return entities.filter(e=>e.constructor===Slime);
}

function potions() {
  return entities.filter(e=>e.constructor===Potion);
}

function inbounds(x, y) {
  return 0 <= x && x < 10 && 0 <= y && y < 10
}

function locChecker(x, y) {
  return (other) => (x===other.x && y===other.y)
}

//
// main game
//

function initTiles() {
  entities = [];
  for (var i = 0; i < startingMap.length; i++) {
    for (var j = 0; j < startingMap[i].length; j++) {
      const code = startingMap[i][j];
      const type = spriteIndex[code];
      if (type == "brick" || type == "tree" || type == "mountain") {
        const img = document.getElementById(type)
        entities.push(new Obstacle(j, i, img));
      }
    }
  }
}

function initActors() {
  entities.push(new Hero(1, 1));
  entities.push(new Slime(3, 5));
  entities.push(new Slime(4, 8));
  entities.push(new Slime(8, 4));
  entities.push(new Potion(2, 6));
  entities.push(new Potion(8, 3));
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
  const t2 =  t1.map(dead=>entities.findIndex(e=>e===dead))
  const t3 =  t2.sort((a, b)=>b-a)
              t3.forEach(i=>entities.splice(i, 1));
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

function getCameraOffset(canvas) {
  const hero = heros()[0]
  if (!hero) {
    return { x:0, y:0 }
  }

  const H = canvas.height;
  const W = canvas.width;
  return { x: W/2 - (hero.x+0.5)*hero.img.width, y: H/2 - (hero.y+0.5)*hero.img.height }
}

function draw() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext('2d');

  const img = document.getElementById("grass");
  ctx.fillStyle = ctx.createPattern(img, 'repeat');
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const offset = getCameraOffset(canvas)
  ctx.translate(offset.x, offset.y)
  entities.forEach(e=>e.draw(canvas, ctx, offset));
  ctx.translate(-offset.x, -offset.y)

  if (checkWin()) {
    drawMessage(canvas, ctx, "You win! :-)")
  } else if (checkLose()) {
    drawMessage(canvas, ctx, "You lose! :-(")
  } else {
    requestAnimationFrame(draw)
  }
}

//
// globals
//

let entities;
let deadQueue;
let isPlayerTurn;

const spriteIndex = {
  // 0: "grass",
  1: "dirt",
  2: "tree",
  3: "brick",
  4: "mountain",
  5: "potion",
  6: "slime",
  7: "hero",
}

const startingMap = [
  [4,4,4,4,4,4,4,4,4,4],
  [0,0,0,2,2,0,0,2,2,2],
  [0,0,0,0,2,0,2,2,2,2],
  [3,0,0,0,0,0,2,3,0,2],
  [3,0,0,0,0,3,2,3,0,0],
  [3,3,0,0,0,3,0,3,0,0],
  [3,3,0,0,0,3,0,0,0,0],
  [0,0,0,2,0,0,0,0,2,2],
  [2,0,0,0,0,2,2,2,2,2],
  [2,3,3,3,3,3,2,2,2,2],
];

//
// classes
//

class Entity {
  constructor(x, y, img) {
    this.x = x;
    this.y = y;
    this.img = img;
  }

  draw(canvas, ctx){
    ctx.drawImage(this.img, this.x*this.img.width, this.y*this.img.height)
  }

  tryMove(x, y) {
    if (!inbounds(x, y)) { return; }
    if (slimes().some(locChecker(x, y))) { return; }
    if (heros().some(locChecker(x, y))) { return; }
    if (obstacles().some(locChecker(x, y))) { return; }
    this.x = x;
    this.y = y;
  }
}

class Obstacle extends Entity {
  constructor(x, y, img) {
    super(x, y, img);
  }
}

class Alive extends Entity {
  constructor(x, y, img, hp, atk) {
    super(x, y, img);
    this.hp = hp;
    this.maxhp = hp;
    this.atk = atk;
  }

  draw(canvas, ctx) {
    Entity.prototype.draw.call(this, canvas, ctx);
    let x = (this.x+0.5)*this.img.width
    let y = (this.y+0.5)*this.img.height - 40

    // maxhp
    ctx.fillStyle = "#c5648f";
    fillRectCentered(ctx, x, y, 48, 8);

    // hp
    const width = 48 * (this.hp / 4.0);
    ctx.fillStyle = "#ff6b7d";
    fillRectCentered(ctx, x, y, width, 8);
  }

  tryAttack(enemies, x, y) {
    const other = enemies.find(locChecker(x, y))
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

class Potion extends Entity {
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
    const newX = this.x + dx;
    const newY = this.y + dy;
    this.tryMove(newX, newY);
    this.tryDrink();
    this.tryAttack(slimes(), newX, newY);
  }

  tryDrink() {
    const potion = potions().find(locChecker(this.x, this.y))
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
    const newX = this.x + dx;
    const newY = this.y + dy;
    this.tryMove(newX, newY);
    this.tryAttack(heros(), newX, newY);
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
