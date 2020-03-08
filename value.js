const CANCEL = null

export default (...subs) => {
  let cur = subs.length ? [subs.shift()] : []

  value.set = val => (cur[0] = val, subs.map(sub => sub(cur[0])), cur[0])

  function value (val) {
    if (val === CANCEL) subs.length = 0

    let res = !arguments.length ? cur[0] :
      typeof val === 'function' ?
      (subs.push(val), cur.length && val(cur[0]), () => subs.splice(subs.indexOf(val) >>> 0, 1)) :
      value.set(val)

    return res
  }

  return value
}

