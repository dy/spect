
export function isIterable(val) {
  return (val != null && typeof val[Symbol.iterator] === 'function');
}
