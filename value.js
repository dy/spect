import channel, { observer, CANCEL } from './channel.js'

export default (...subs) => {
  let cur = subs.length ? [subs.shift()] : []
  let chan = channel()

  value.get = () => cur[0]
  value.set = val => chan(cur[0] = val)

  function value (val) {
    if (!cur) return CANCEL
    if (val === CANCEL) return chan(cur = val)
    let res = !arguments.length ? (value.get && value.get()) :
      observer(val) ? (val = val.next || val, cur.length && val(value.get && value.get()), chan(val)) :
      (value.set && value.set(val))

    return res
  }

  return value
}

