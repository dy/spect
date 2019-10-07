import prop from './prop'

export default function store (target, ...args) {
  if (target) return prop(target, ...args)
  return prop({}, ...args)
}

