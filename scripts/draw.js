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

function drawMessage(ctx, lines, mainColor="black") {
  if (!Array.isArray(lines)) { lines = [lines] }
  const W = canvas.width;
  const H = canvas.height;
  const lineHeight = 30
  const msgHeight = lineHeight*lines.length
  ctxWith(ctx, {globalAlpha: 0.66, fillStyle: "white"}, () => {
    fillRectCentered(ctx, W/2, H/2, W*0.9 + 10, msgHeight + lineHeight + 10)
  })
  ctxWith(ctx, {globalAlpha: 0.75, fillStyle: mainColor}, () => {
    fillRectCentered(ctx, W/2, H/2, W*0.9, msgHeight + lineHeight)
  })
  ctxWith(ctx, {
    font: `${lineHeight}px Consolas`,
    fillStyle: "white",
    textAlign: "center",
  }, () => {
    let i = 0
    for (const line of lines) {
      const yCenter = H/2 - msgHeight/2 + (i+0.5)*lineHeight
      ctx.fillText(line, W/2, yCenter+lineHeight*0.25)
      i += 1
    }
  });
  // // draw crosshairs
  // ctxWith(ctx, {fillStyle: "red"}, () => {
  //   fillRectCentered(ctx, W/2, H/2, W, H*0.005)
  //   fillRectCentered(ctx, W/2, H/2, W*0.005, H)
  // })
}

function fillRectCentered(ctx, cx, cy, w, h) {
  const x = cx - w/2;
  const y = cy - h/2;
  ctx.fillRect(x,y,w,h);
}
