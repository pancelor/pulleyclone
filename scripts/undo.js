//
// globals
//

let gameHistory;
let historyCursor;
let currentEpoch;

//
// history / undo
//

function initHistory() {
  gameHistory = []
  historyCursor = 0
}

function recordChange(delta) {
  currentEpoch.buffer.push(delta)
}

function startEpoch() {
  // call this before the player gets control
  currentEpoch = {}
  currentEpoch.buffer = []
}

function midEpoch() {
  // call this after the player cedes control but before gravity happens
  currentEpoch.half1 = collateEpoch(currentEpoch.buffer)
  currentEpoch.buffer = []
}

function endEpoch() {
  // call this after gravity is over
  currentEpoch.half2 = collateEpoch(currentEpoch.buffer)
  delete currentEpoch.buffer

  if (currentEpoch.half1.length === 0 && currentEpoch.half2.length === 0) { return }

  gameHistory.length = historyCursor
  gameHistory.push(currentEpoch)
  historyCursor += 1
}

function collateEpoch(buffer) {
  // collates records with the same id together; see testCollateEpoch
  const seen = new Map()
  const res = []
  const resIndex = 0
  for (const delta of buffer) {
    const id = delta.id
    let ix
    if (seen.has(id)) {
      ix = seen.get(id)
      assert(res[ix].id === delta.id, "id mismatch")
      res[ix].before = {
        ...delta.before,
        ...res[ix].before, // the pre-existing delta takes precedence
      }
      res[ix].after = {
        ...res[ix].after,
        ...delta.after, // now the new delta takes precedence
      }
    } else {
      ix = res.length
      res.push(delta)
      seen.set(id, ix)
    }
  }
  return res
}

function testCollateEpoch1() {
  const buffer = [
    {id: 1, before: { x: 1 }, after: { x: 2 }},
    {id: 2, unrelatedStuff: true},
    {id: 1, before: { x: 2 }, after: { x: 3 }},
  ]
  const newBuffer = collateEpoch(buffer)
  assert(newBuffer.length === 2)
  assertObjMatch(newBuffer[0], {id: 1, before: { x: 1 }, after: { x: 3 }})
  assertObjMatch(newBuffer[1], {id: 2, unrelatedStuff: true})
} testCollateEpoch1()

function testCollateEpoch2() {
  const buffer = [
    {id: 1, before: { x: 1 }, after: { x: 2 }},
    {id: 1, before: { y: 10 }, after: { y: 11 }},
  ]
  const newBuffer = collateEpoch(buffer)
  assert(newBuffer.length === 1)
  assertObjMatch(newBuffer[0], {id: 1, before: { x: 1, y: 10 }, after: { x: 2, y: 11 }})
} testCollateEpoch2()

function testCollateEpoch3() {
  const buffer = [
    {id: 1, before: { x: 1 }, after: { x: 2 }},
    {id: 1, before: { x: 2, y: 10 }, after: { x: 3, y: 11 }},
  ]
  const newBuffer = collateEpoch(buffer)
  assert(newBuffer.length === 1)
  assertObjMatch(newBuffer[0], {id: 1, before: { x: 1, y: 10 }, after: { x: 3, y: 11 }})
} testCollateEpoch3()

function historyToString(join=true) {
  // returns a yaml-ish string; made for human debugging purposes
  const lines = []
  for (const e of gameHistory) {
    lines.push(`* half 1:`)
    lines.push(...epochHalfToString(e.half1, false));
    lines.push(`  half 2:`)
    lines.push(...epochHalfToString(e.half2, false));
  }
  return join ? lines.join('\n') : lines
}

function epochHalfToString(half, join=true) {
  const lines = []
  for (const {id, before, after} of half) {
    lines.push(`    #${id}: ${JSON.stringify(before)} -> ${JSON.stringify(after)}`)
  }
  return join ? lines.join('\n') : lines
}

function undo() {
  if (historyCursor <= 0) { return }
  historyCursor -= 1
  const { half1, half2 } = gameHistory[historyCursor]
  for (const { id, before, after } of [...half2, ...half1]) {
    const a = getActorId(id)
    for (const prop of Object.keys(after)) {
      if ([TilePos, CanvasPos].includes(a[prop].constructor)) { // TODO: hacky
        assert(a[prop].equals(after[prop]), `undo error on ${a.serialize()} on prop ${prop}`)
      } else {
        assertEqual(a[prop], after[prop], `undo error on ${a.serialize()} on prop ${prop}`)
      }
    }
    Object.assign(a, before)
  }
  light().shine()
}

function redo() {
  if (historyCursor >= gameHistory.length) { return }
  const { half1, half2 } = gameHistory[historyCursor]
  historyCursor += 1
  for (const { id, before, after } of [...half1, ...half2]) {
    const a = getActorId(id)
    for (const prop of Object.keys(before)) {
      if ([TilePos, CanvasPos].includes(a[prop].constructor)) { // TODO: hacky
        assert(a[prop].equals(before[prop]), `redo error on ${a.serialize()} on prop ${prop}: expected ${before[prop].serialize()}; got ${a[prop].serialize()}`)
      } else {
        assertEqual(a[prop], before[prop], `redo error on ${a.serialize()} on prop ${prop}`)
      }
    }
    Object.assign(a, after)
  }
  light().shine()
}
