import value from './value.js'

export default function fx(fn, deps=[]) {
  const args = value([])

  deps.map((dep, i) =>
    dep(value =>
      (args()[i] = value, args(args()))
    )
  )

  let destroy
  args(values => {
    if (!values.length) return
    if (destroy && destroy.call) destroy()
    destroy = fn(...values)
  })

  // curious inversion
  // usually we return subscriber function and keep value private
  // with list we return value and keep subscriber function private
  // ideally we'd return both value and subscriber
  return args
}
