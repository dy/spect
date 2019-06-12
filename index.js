import { types } from './src/target/index.js'
import { isObject } from './src/util.js'


// per-target storage
export const targetStates = new WeakMap()


function spect (target, ...children) {
  // TODO: if target is already assigned aspect, skip it or just run aspect (figure out what)

  let type = types.find(t => t.test(target))

  // <tag>{fn}</tag> -> spect('tag', fn)
  let props
  if (isObject(children[0])) props = children.shift()

  // TODO: detect function properly
  let aspect = getAspectFunction(props, children)

  type.spect(target, aspect)
}

// build aspect fn from
function getAspectFunction (props, children) {
  let aspect

  // FIXME: expect for now children to be a single aspect function
  if (children.length === 1 && typeof children[0] === 'function') aspect = children[0]

  return aspect
}


// call aspect with corresponding targetStates
export const callStack = []

export function callAspect(target, aspectState) {
  callStack.push([target, aspectState])

  let result = aspectState.aspect(target)

  // TODO: figure out if that should be called after each individual aspect and not in a separate tick or somewhere
  runAfterEffects()

  callStack.pop()

  return result
}

// plan side-effect to call after the current aspect
export function afterEffect(fn, args=[]) {
  afterStack.push([fn, args])
}

// accumulated side-effects for an aspect
export const afterStack = []
export function runAfterEffects() {
  while (afterStack.length) {
    let [fx, args] = afterStack.shift()
    fx(...args)
  }
}

export default spect
