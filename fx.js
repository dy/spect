export default function fx(cb, deps = []) {
  let planned = false
  let values = deps.map(dep => dep.current)
  let unsubscribe = deps.map((dep, i) =>
    // FIXME: extend to async iterable
    dep.subscribe(value => {
      if (values[i] === value) return
      values[i] = value
      plan()
    })
  )

  const plan = () => {
    if (planned) return
    planned = true
    Promise.resolve().then(() => {
      planned = false
      cb(values)
    })
  }

  return () => unsubscribe.map(unsubscribe => unsubscribe())
}
