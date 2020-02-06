export default function fx(cb, deps=[]) {
  let current = deps.map(dep => dep.current)

  // observe changes
  deps.map(async (dep, i) => {
    for await (let value of dep) {
      if (value === current[i]) continue
      current[i] = value
      notify()
    }
  })

  let changed = false
  const notify = () => {
    if (changed) return
    changed = true
    Promise.resolve().then(() => {
      changed = false
      cb(current)
    })
  }
  notify()
}
