import value from './value.js'

export default (val, cur = value(val)) =>
  (...args) => (args[0] !== (val = cur()) ? cur(...args) : val)
