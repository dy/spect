import value from './value.js'

export default (val) => {
  const cur = value(val), set = cur.set
  cur.set = v => v !== cur() ? set(v) : null
  return cur
}
