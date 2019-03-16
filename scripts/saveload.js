function loadTiles() {
  let lines = tileData.trim().split('\n')
  const nrr = lines.length
  const ncc = lines[0].length
  tiles = [];
  for (let rr = 0; rr < nrr; rr++) {
    tiles.push([]);
    for (let cc = 0; cc < ncc; cc++) {
      tiles[rr][cc] = lines[rr][cc];
    }
  }
}

function exportTilesString() {
  const lines = []
  lines.push("const tileData = `")
  const {width: ncc, height: nrr} = tilesDim()
  for (let rr = 0; rr < nrr; rr++) {
    const chars = []
    for (let cc = 0; cc < ncc; cc++) {
      chars.push(tiles[rr][cc]);
    }
    lines.push(chars.join(''))
  }
  lines.push("`")
  lines.push("")
  return lines.join("\n")
}

function loadActors() {
  let lines = actorData.trim().split('\n')
  actors = [];
  for (let l of lines) {
    const type = l.split(' ')[0]
    const klass = deserActorClass[type]
    actors.push(klass.deserialize(l));
  }
}

function exportActorsString() {
  const lines = []
  lines.push("const actorData = `")
  for (let a of actors) {
    lines.push(a.serialize())
  }
  lines.push("`")
  lines.push("")
  return lines.join("\n")
}

function exportLevelString() {
  const lines = []
  lines.push(exportTilesString())
  lines.push(exportActorsString())
  return lines.join("\n")
}
