export const effects = []

export function registerEffect (effect) {
  if (~effects.indexOf(effect)) throw Error('Effect already exists')

  effects.push(effect)
}
