const CANCEL = null

export default (...subs) => {
  let cur = subs.length ? [subs.shift()] : []
  return function (val) {
    let res = !arguments.length ? cur[0] :
      val === CANCEL ? (subs.length = 0) :
      typeof val === 'function' ?
      (subs.push(val), cur.length && val(cur[0]), () => subs.splice(subs.indexOf(val) >>> 0, 1)) :
      (cur[0] = val, subs.map(sub => sub(cur[0])), cur[0])

    return res
  }
}

