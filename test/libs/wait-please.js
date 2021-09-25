const raf = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : (fn) => setTimeout(fn, 0)
const macrotask = typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : setImmediate

export function idle (n = 1) {
  return new Promise(ok => {
    let count = 0
    f()
    async function f() {
      if (count === n) return ok()
      count++
      await time()
      macrotask(f)
    }
  })
}

export function time (n) {
  return new Promise(ok => setTimeout(ok, n))
}

export function frame (n = 1) {
  return new Promise(ok => {
    let count = 0
    f()
    function f() {
      if (count === n) return ok()
      count++
      raf(f)
    }
  })
}

export function tick(n = 1) {
  return new Promise(ok => {
    let count = 0
    f()
    function f() {
      if (count === n) return ok()
      count++
      Promise.resolve().then(f)
    }
  })
}
