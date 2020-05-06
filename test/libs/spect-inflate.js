export default (parent, a, b, end = null) => {
  let i = 0, cur, next, bi, n = b.length

  // skip head
  while (a[i] === b[i] && i < n) i++

  // append
  if (i >= a.length) {
    while (i < n) parent.insertBefore(b[i++], end)
  }

  else {
    cur = a[i] || end

    while (i < n) {
      bi = b[i++], next = cur ? cur.nextSibling : end

      // skip
      if (cur == bi) cur = next

      // swap / replace
      else if (b[i] === next) (parent.replaceChild(bi, cur), cur = next)

      // insert
      else parent.insertBefore(bi, cur)
    }

    // remove tail
    while (cur !== end) (next = cur ? cur.nextSibling : end, parent.removeChild(cur), cur = next)
  }

  return b
}
