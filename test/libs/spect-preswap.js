// Features
// - no sets/maps used
// - fast prepend/append
// - fast 1:1 swaps
// - works on live input childNodes
// → no nextSibling used - can merge attributes (Yay!)
export default (parent, a, b, end = null) => {
  let i = 0, cur, next, bi, bnext, n = b.length, m = a.length,
    swap = [],
    min = m < n ? m : n,
    nexts

  // skip head, collect swaps
  while (i < min && (a[i] == b[i] || ((i == min-1 || a[i+1] == b[i+1]) && swap.push(i) && nexts.push(i+1)))) i++

  // collect swap items, though... it is handled by main loop anyways

  // skip tail
  while (n && m && b[n-1] == a[m-1]) end = b[--m, --n]

  // append/prepend shortcut
  if (!swap.length && i == m) while (i < n) parent.insertBefore(b[i++], end)

  else {
    while (i < n) swap.push(i++)

    nexts = Array.from(swap.length)
    // FIXME: would be nice to make it work no-nextSibling to be able to merge attributes too
    // FIXME: that works for replace, but not swap
    while (swap.length) {
      i = swap.shift()
      bi = b[i], cur = a[i], next = nexts[i]// cur.nextSibling || end

      // swap / replace
      if (b[i+1] === next) parent.replaceChild(bi, cur)

      // insert
      else parent.insertBefore(bi, cur)
    }

    cur = a[i]

    while (i < n) {
      bi = bnext || b[i], bnext = i == n ? end : b[++i], next = cur ? cur.nextSibling : end

      // skip
      if (cur == bi) cur = next

      // swap / replace
      else if (b === next) (parent.replaceChild(bi, cur), cur = next)

      // insert
      else parent.insertBefore(bi, cur)
    }

    // remove tail
    while (cur != end) (next = cur.nextSibling, parent.removeChild(cur), cur = next)
  }

  return b
}
