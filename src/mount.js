
export function mount(fn, deps = true) {
  if (!commit(fxKey('mount'), deps, () => destroy.forEach(fn => fn && fn()))) return

  let destroy = []

  let unload, connected = false
  let handle = [() => (unload = fn(), connected = true), () => unload && unload()]

  onload(el, ...handle)

  // FIXME: workaround https://github.com/hyperdivision/fast-on-load/issues/3
  if (!connected && isConnected(el)) {
    handle[0]()
  }

  destroy.push(() => onload.delete(el, ...handle))

  return this
}
