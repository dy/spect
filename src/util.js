import kebab from 'kebab-case'


export const SPECT_CLASS = '👁'


export function isIterable(val) {
  return (val != null && typeof val[Symbol.iterator] === 'function');
}

export const raf = window.requestAnimationFrame


export function paramCase (str) {
  str = kebab(str)

  if (str[0] === '-') return str.slice(1)
  return str
}


export function noop () {}
