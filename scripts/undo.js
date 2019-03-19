//
// globals
//

let gameHistory;
let currentEpoch;

//
// history / undo
//

function initHistory() {
  gameHistory = []
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
  currentEpoch.buffer = []
  gameHistory.push(currentEpoch)
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

function printEpoch(e) {
  console.log("epoch");
  console.log(epochHalfToString(e.half1));
  console.log(epochHalfToString(e.half2));
}
function epochHalfToString(half) {
  const lines = []
  lines.push("  half")
  for (const [a, pos] of half) {
    lines.push(`    ${a.constructor.name}: ${pos.str()}`)
  }
  return lines.join('\n')
}
function undo() {
  if (gameHistory.length === 0) { return }
  const { half1, half2 } = gameHistory.pop()
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
  // TODO: need to store more info in the epochs to make redo possible
  undo()
}
