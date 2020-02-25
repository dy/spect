import bus from './src/bus.js'

export default function ref (value) {
  let current

  const channel = bus(() => current, value => (current = value, true))

  return channel
}
