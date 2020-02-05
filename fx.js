export default function fx(cb, deps=[]) {
  let values = deps.map(dep => dep.current)

  let planned = false
  const plan = () => {
    if (planned) return
    planned = true
    Promise.resolve().then(() => {
      planned = false
      cb(values)
    })
  }

  deps.map(async (dep, i) => {
    for await (let value of dep) {
      if (value === values[i]) continue
      values[i] = value
      plan()
    }
  })

  plan()
}
