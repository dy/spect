import SelectorSet from 'selector-set'

const _callbacks = Symbol.for('__spect.callbacks')
const _destroyPlanned = Symbol.for('__spect.destroyPlanned')
const _observer = Symbol.for('__spect.observer')
const _attrTargets = Symbol.for('__spect.attrTargets')
const set = new SelectorSet

// element-based aspect
export default function spect(target, fn, context) {
  // spect('.a', b)
  if (typeof target === 'string') {
    return $(target, fn, context)
  }

  let offs = []

  // spect({'.x': a, '.y': b})
  if (arguments.length === 1) {
    for (let selector in target) {
      offs.push(spect(selector, target[selector], context))
    }
  }

  // spect('.a', [b, c])
  else if (Array.isArray(fn)) {
    offs = fn.map(fn => spect(target, fn, context))
  }

  // spect(list, fn)
  else if (target.length && !target.nodeType) {
    for (let i = 0; i < target.length; i++) {
      offs.push(spect(target[i], fn, context))
    }
  }

  // spect(target, fn)
  else {
    initCallback(target, fn)
    return () => destroyCallback(target, fn)
  }

  return () => offs.map(off => off())
}

// selector-based aspect
function $(selector, fn, context = document.documentElement) {
  if (!context[_observer]) {
    const observer = context[_observer] = new MutationObserver((list) => {
      for (let mutation of list) {
        let { addedNodes, removedNodes, target } = mutation
        if (mutation.type === 'childList') {
          removedNodes.forEach(el => {
            if (el.nodeType !== 1) return
            set.matches(el).forEach(rule => {
              // some elements may be asynchronously reinserted, eg. material hoistMenuToBody etc.
              el[_destroyPlanned] = true
              window.requestAnimationFrame(() => el[_destroyPlanned] && destroyCallback(el, rule.data))
            })
          })
          addedNodes.forEach(el => {
            if (el.nodeType !== 1) return
            set.matches(el).forEach(rule => {
              initCallback(el, rule.data)
            })
          })
        }
        else if (mutation.type === 'attributes') {
          const attrName = mutation.attributeName
          if (!target[_attrTargets]) target[_attrTargets] = {}
          if (!target[_attrTargets][attrName]) target[_attrTargets][attrName] = new Map

          const active = new WeakSet()
          set.matches(target).forEach(rule => {
            initCallback(target, rule.data)
            target[_attrTargets][attrName].set(target, rule.data)
            active.add(target)
          })

          set.queryAll(target).forEach(rule => {
            rule.elements.forEach(el => {
              initCallback(el, rule.data)
              target[_attrTargets][attrName].set(el, rule.data)
              active.add(el)
            })
          })

          // remove selectors not matching attr rules anymore
          for (let [el, aspect] of target[_attrTargets][attrName]) {
            if (active.has(el)) continue
            destroyCallback(el, aspect)
            target[_attrTargets][attrName].delete(el)
            if (!target[_attrTargets][attrName].size) delete target[_attrTargets][attrName]
          }
        }
      }
    })
    observer.observe(context, {
      attributes: true,
      childList: true,
      subtree: true
    })
  }

  set.add(selector, fn)
  set.queryAll(context).forEach(rule => rule.elements.forEach(el => initCallback(el, rule.data)))

  return () => {
    set.queryAll(context).forEach(rule => rule.elements.forEach(el => destroyCallback(el, rule.data)))
    set.remove(selector, fn)
    if (!set.size) {
      context[_observer].disconnect()
      delete context[_observer]
    }
  }
}

function initCallback(el, fn) {
  if (!el[_callbacks]) el[_callbacks] = new WeakMap
  if (el[_callbacks].has(fn)) {
    el[_destroyPlanned] = false
    return
  }

  let cb = fn.bind(el)
  el[_callbacks].set(fn, cb)
  try { cb.destroy = cb(el) }
  catch (e) { console.error(e) }
}

function destroyCallback(el, fn) {
  if (!el[_callbacks]) return
  if (!el[_callbacks].has(fn)) return
  let cb = el[_callbacks].get(fn)
  if (cb.destroy && cb.destroy.call) cb.destroy()
  el[_callbacks].delete(fn)
}
