
export function css (statics, ...parts) {
  let str = String.raw(statics, ...parts)

  let className = cssClassCache.get(this)

  if (!className) {
    className = `${SPECT_CLASS}-${uid()}`
    cssClassCache.set(this, className)
    this.each(el => el.classList.add(className))
  }

  str = scopeCss(str, '.' + className)
  insertCss(str, { id: className })

  return this
}
