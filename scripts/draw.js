function cls(ctx) {
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function drawBkg(ctx) {
  drawImg(ctx, imgBackground, new TilePos({x: 0, y: 0}))
}

function ctxWith(ctx, map, cb) {
  // Used to temporarily set ctx attributes, e.g.:
  //   ctxWith(ctx, {globalAlpha: 0.75, fillStyle: "green"}, () => {
  //     drawLine(ctx, pos1, pos2)
  //   })
  const old = {}
  Object.keys(map).forEach((k) => {
    old[k] = ctx[k]
  })
  Object.assign(ctx, map)
  cb(ctx)
  Object.assign(ctx, old)
}

function drawImg(ctx, img, pos, scale=1) {
  if (img == null) {
    assert(0, "null image")
    return
  }
  scale *= imgScale
  ctx.drawImage(img, pos.canvasX(), pos.canvasY(), img.width*scale, img.height*scale)
}

function drawLine(ctx, p1, p2) {
  ctx.beginPath()
  ctx.moveTo(p1.canvasX(), p1.canvasY())
  ctx.lineTo(p2.canvasX(), p2.canvasY())
  ctx.stroke()
}

function drawCircle(ctx, p, r) {
  ctx.beginPath()
  ctx.arc(p.canvasX(), p.canvasY(), r, 0, 2 * Math.PI)
  ctx.fill()
}

function drawMessage(ctx, msg, mainColor="black") {
  const W = canvas.width;
  const H = canvas.height;
  ctxWith(ctx, {globalAlpha: 0.66, fillStyle: "white"}, () => {
    fillRectCentered(ctx, W/2, H/2, W*0.9 + 10, H*0.1 + 10)
  })
  ctxWith(ctx, {globalAlpha: 0.75, fillStyle: mainColor}, () => {
    fillRectCentered(ctx, W/2, H/2, W*0.9, H*0.1)
  })
  ctxWith(ctx, {
    font: "30px Comic Sans MS",
    fillStyle: "white",
    textAlign: "center",
  }, () => { ctx.fillText(msg, W/2, H/2 + 10) });
}

function fillRectCentered(ctx, cx, cy, w, h) {
  const x = cx - w/2;
  const y = cy - h/2;
  ctx.fillRect(x,y,w,h);
}
