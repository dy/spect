import bus from './src/bus.js'

export default function ref (value) {
  return bus(() => value, v => (value = v, true))
}
