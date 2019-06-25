export const effects = []

export default function registerEffect (effect) {
  if (~effects.indexOf(effect)) throw Error('Effect already exists')

  effects.push(effect)
}
