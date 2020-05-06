export default (parent, a, b, end = null) => {
  let i = 0, cur, next, bi, bidx = new Set(b)

  while (bi = a[i++]) !bidx.has(bi) ? parent.removeChild(bi) : cur = cur || bi
  cur = cur || end, i = 0

  while (bi = b[i++]) {
    next = cur ? cur.nextSibling : end

    // skip
    if (cur == bi) cur = next

    else {
      // swap 1:1
      if (b[i] === next) cur = next

      // insert
      parent.insertBefore(bi, cur)
    }
  }

  return b
}
