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
      x: this.x / gridX,
      y: this.y / gridY,
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
// globals
//

let actors;
let tiles;
let deadQueue;
let isPlayerTurn;
let mousepos;

const lookupActor = {
  "potion": Potion,
  "slime": Slime,
  "hero": Hero,
}

const lookupTile = {
  0: "grass",
  1: "dirt",
  2: "tree",
  3: "brick",
  4: "mountain",
}

const reverseLookupTile = {
  "grass": 0,
  "dirt": 1,
  "tree": 2,
  "brick": 3,
  "mountain": 4,
}

//
// event handlers
//

function registerListeners() {
  window.addEventListener("keyup", (e) => {
    let dir;
    switch (e.key) {
      case "Enter":
        init()
        break;
      case " ":
      case "Space":
        toggleEditor();
        break;
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
    if (editorActive()) {return;}
    if (dir === undefined) {return;}
    if (!isPlayerTurn) {return;}
    isPlayerTurn = false;
    update(dir);
  })

  window.addEventListener("mousemove", (e) => {
    mousepos.x = e.layerX
    mousepos.y = e.layerY
  })

  let mousedown = false
  window.addEventListener("mousedown", (e) => {
    if (inbounds(mousepos)) {
      mousedown = true
      if (editorActive) {
        clickBrush(e)
      }
      e.preventDefault()
    }
  })
  window.addEventListener("mouseup", (e) => {
    if (inbounds(mousepos)) {
      mousedown = false
      e.preventDefault()
    }
  })

  window.addEventListener("mousemove", (e) => {
    if (inbounds(mousepos)) {
      if (editorActive && mousedown) {
        clickBrush(e)
      }
    }
  })

  editorButton.onclick = toggleEditor
  saveButton.onclick = ()=>downloadFile("level.dat", exportLevelString())
}

function init() {
  registerListeners()
  mousepos = new ScreenPos({x: null, y: null});
  initEditor()
  initTiles()
  initActors()
  isPlayerTurn = true;
  deadQueue = [];
  requestAnimationFrame(draw)
}
window.onload = init
