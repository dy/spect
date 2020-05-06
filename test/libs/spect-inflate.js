export default (parent, a, b, end = null) => {
  let i = 0, cur, next, bi, n = b.length, m = a.length, bnext

  // skip head
  while (i < n && i < m && a[i] == b[i]) i++

  // skip tail
  while (n && m && b[n-1] == a[m-1]) end = b[--m, --n]

  // append/prepend shortcut
  if (i == m) while (i < n) parent.insertBefore(b[i++], end)

  else {
    cur = a[i]

    while (i < n) {
      bi = bnext || b[i], bnext = i == n ? end : b[++i], next = cur ? cur.nextSibling : end

      // skip
      if (cur == bi) cur = next

      // swap / replace
      else if (bnext === next) (parent.replaceChild(bi, cur), cur = next)

      // insert
      else parent.insertBefore(bi, cur)
    }

    // remove tail
    while (cur != end) (next = cur.nextSibling, parent.removeChild(cur), cur = next)
  }

  return b
}
