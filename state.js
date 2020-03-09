import value from './value.js'

export default (val) => {
  const set = cur.set, cur = value(val)
  cur.set = v => v !== cur() ? set(v) : null
  return cur
}
