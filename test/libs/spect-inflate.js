export default (parent, a, b, end = null) => {
  let i = 0, cur, next, bi, n = b.length, dif = n - a.length

  // skip head
  while (a[i] == b[i] && i++ < n);

  // skip tail
  while (--n >= dif && b[n] == a[n - dif]) end = b[n];

  // append/prepend shortcut
  if (i > n - dif) while (i <= n) parent.insertBefore(b[i++], end)

  else {
    cur = a[i]
    while (i <= n) {
      bi = b[i++], next = cur ? cur.nextSibling : end

      // skip
      if (cur == bi) cur = next

      // swap / replace
      else if (i < n && b[i] == next) (parent.replaceChild(bi, cur), cur = next)

      // insert
      else parent.insertBefore(bi, cur)
    }

    // remove tail
    while (cur != end) (next = cur.nextSibling, parent.removeChild(cur), cur = next)
  }

  return b
}
