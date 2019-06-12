export const types = []

export function registerTarget (type) {
  if (~types.indexOf(type)) throw Error('Target type already exists')

  types.push(type)
}
