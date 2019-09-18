import onload from 'fast-on-load'

const _deps = Symbol.for('spect.deps')
const _target = Symbol.for('spect.target')

export default function mount(fn, deps) {
  if (this[_deps]) if (!this[_deps](deps, () => {
    destroy.forEach(fn => fn && fn())
  })) return this

  let destroy = []

  let unload, connected = false
  let handle = [() => (unload = fn(), connected = true), () => unload && unload()]

  let el = this[_target] || this

  onload(el, ...handle)

  // FIXME: workaround https://github.com/hyperdivision/fast-on-load/issues/3
  if (!connected && isConnected(el)) {
    handle[0]()
  }

  destroy.push(() => onload.delete(el, ...handle))

  return this
}

export const isConnected = 'isConnected' in window.Node.prototype
  ? node => node.isConnected
  : node => document.documentElement.contains(node)
