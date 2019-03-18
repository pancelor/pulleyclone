function downloadFile(name, contents, mime_type) {
    mime_type = mime_type || "text/plain";

    let blob = new Blob([contents], {type: mime_type});

    let dlink = document.createElement('a');
    dlink.download = name;
    dlink.href = window.URL.createObjectURL(blob);
    dlink.onclick = function(e) {
        // revokeObjectURL needs a delay to work properly
        let that = this;
        setTimeout(function() {
            window.URL.revokeObjectURL(that.href);
        }, 1500);
    };

    dlink.click();
    dlink.remove();
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

function clamp(x, a, b) {
  if (x < a) { return a }
  if (x > b) { return b }
  return x
}
assert(clamp(0, 3, 10) === 3)
assert(clamp(3, 3, 10) === 3)
assert(clamp(5, 3, 10) === 5)
assert(clamp(10, 3, 10) === 10)
assert(clamp(11, 3, 10) === 10)
assert(clamp(-5, 3, 10) === 3)

function saneMod(x, y) {
  // mod(x, y) returns a number in [0, y), like % should do (but doesn't)
  x = x % y
  if (x < 0) { x += y}
  return x
}
assert(saneMod(3, 10) === 3)
assert(saneMod(0, 10) === 0)
assert(saneMod(10, 10) === 0)
assert(saneMod(-6, 10) === 4)

function assert(b, msg=null) {
  if (!b) {
    msg = (msg === null) ? msg : "assert error"
    throw new Error(msg)
  }
}

// function assertLite(b, msg=null) {
//   if (!b) {
//     msg = (msg === null) ? msg : "assert error"
//     console.warn(msg)
//   }
// }

function xor(a, b) {
  return !!a != !!b
}
assert(xor(0, 0) === false)
assert(xor(0, 1) === true)
assert(xor(1, 0) === true)
assert(xor(1, 1) === false)

async function sleep(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}


function addDiffListener(evName, ignore=[]) {
  let last = null;
  window.addEventListener(evName, (e) => {
    if (last) {
      diffSummary(last, e, ignore)
    }
    last = e
  })
}

function diffSummary(a, b, ignore=[]) {
  const d = diff(a, b)
  console.log("old:")
  for (const prop of Object.keys(d.old)) {
    if (ignore.includes(prop)) { continue }
    console.log(`  ${prop}: ${d.old[prop]}`);
  }
  console.log("new:")
  for (const prop of Object.keys(d.new)) {
    if (ignore.includes(prop)) { continue }
    console.log(`  ${prop}: ${d.new[prop]}`);
  }
}

function diff(a, b) {
  const res = { old: {}, new: {}}
  for (const prop in a) {
    if (a[prop] !== b[prop]) {
      res.old[prop] = a[prop]
      res.new[prop] = b[prop]
    }
  }
  for (const prop in b) {
    if (a[prop] !== b[prop]) {
      res.old[prop] = a[prop]
      res.new[prop] = b[prop]
    }
  }
  return res
}

// e.g. addDiffListener("mousewheel", ["timestamp"])
