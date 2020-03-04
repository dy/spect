const CANCEL = null

export default (cur, subs=[]) => function (val) {
  let res = !arguments.length ? cur :
    val === CANCEL ? (subs.length = 0) :
    typeof val === 'function' ?
    (subs.push(val), val(cur), () => subs.splice(subs.indexOf(val) >>> 0, 1)) :
    (cur = val, subs.map(sub => sub(cur)), cur)
  return res
}

