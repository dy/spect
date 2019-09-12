// optional effects
export default function fx(fn, deps) {
  if (!this._deps(deps, () => {
    destroy.forEach(fn => fn && (fn.call && fn()) || (fn.then && fn.then(res => res())))
  })) {
    return this
  }

  let destroy = []
  this.then(async () => {
    destroy.push(fn.call(this))
  })

  return this
}
