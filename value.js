export default (cur, subs=[]) => function (val) {
  let res = !arguments.length ? cur :
    typeof val === 'function' ?
    (subs.push(val), val(cur), () => subs.splice(subs.indexOf(val) >>> 0, 1)) :
    (cur = val, subs.map(sub => sub(cur)), cur)
  return res
}

