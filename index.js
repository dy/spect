import SelectorSet from 'selector-set'

let set = new SelectorSet

// element-based aspect
export default function spect(target, fn) {
  // spect({'.x': a, '.y': b})
  if (arguments.length === 1) {
    let offs = []
    for (let selector in target) {
      offs.push(spect(selector, target[selector]))
    }
    return () => offs.map(off => off())
  }

  // spect('.a', [b, c])
  if (Array.isArray(fn)) {
    let offs = fn.map(fn => spect(target, fn))
    return () => offs.map(off => off())
  }



  // spect('.a', b)
  if (typeof target === 'string') {
    return $(target, fn)
  }

  // spect(a)
  if (target.forEach) {
    let offs = target.map(target => spect(target, fn))
    return () => offs.map(off => off())
  }

  return run(target, fn)
}

// selector-based aspect
export function $(selector, fn) {
  if (Array.isArray(fn)) {
    fn.forEach(fn => spect(selector, fn))
    return
  }

  return observe(selector, {
    initialize() {
      let unrun
      return {
        add(el) {
          if (el._abortUnrun) return el._abortUnrun()

          unrun = run(el, fn)

          // duplicate event since it's not emitted
          el.dispatchEvent(new CustomEvent('connected'))
        },
        remove(el) {
          // disposal is scheduled, because some elements may be asynchronously reinserted, eg. material hoistMenuToBody etc.
          el._abortUnrun = window.requestAnimationFrame(unrun)
        }
      }
    }
  }).abort
}

export function run(el, fn) {
  if (!el[_aspects]) el[_aspects] = new WeakMap

  if (!el[_aspects].has(fn)) {
    let aspect = augmentor(fn)
    el[_aspects].set(fn, aspect)
    aspect.destroy = aspect(el)
  }

  return () => {
    let aspect = el[_aspects].get(fn)
    if (aspect.destroy && aspect.destroy.call) aspect.destroy()
    el[_aspects].delete(fn)
    dropEffect(aspect)
  }
}

export { useEffect, useState, useReducer, useRef, useContext, useMemo, useLayoutEffect, useCallback } from 'augmentor'
