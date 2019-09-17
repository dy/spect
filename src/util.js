import kebab from 'kebab-case'

export function isIterable(val) {
  if (val instanceof Node) return false
  return (val != null && typeof val[Symbol.iterator] === 'function');
}

export const raf = window.requestAnimationFrame

export function paramCase(str) {
  str = kebab(str)

  if (str[0] === '-') return str.slice(1)
  return str
}

export function noop() { }

export function uid() { return Math.random().toString(36).slice(2, 8) }

export const isConnected = 'isConnected' in window.Node.prototype
  ? node => node.isConnected
  : node => document.documentElement.contains(node)
