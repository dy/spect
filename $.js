import SelectorSet from 'selector-set'
import channel from './channel.js'

const _callbacks = Symbol.for('__spect.callbacks')
const _destroyPlanned = Symbol.for('__spect.destroyPlanned')
const _observer = Symbol.for('__spect.observer')
const _attrTargets = Symbol.for('__spect.attrTargets')
const set = new SelectorSet

// element-based aspect
export default function spect(context, target, fn) {
  // spect(target, fn)
  if (arguments.length === 2) {
    fn = target
    target = context
    context = document
  }

  // spect('.a', b)
  if (typeof target === 'string') {
    return $(context, target, fn)
  }

  let offs = []

  // spect({'.x': a, '.y': b})
  if (arguments.length === 1) {
    for (let selector in target) {
      offs.push(spect(context, selector, target[selector]))
    }
  }

  // spect('.a', [b, c])
  else if (Array.isArray(fn)) {
    offs = fn.map(fn => spect(context, target, fn))
  }

  // spect(list, fn)
  else if (target.length && !target.nodeType) {
    for (let i = 0; i < target.length; i++) {
      offs.push(spect(context, target[i], fn))
    }
  }

  // spect(target, fn)
  else {
    initCallback(target, fn)
    return channel(() => {}, e => destroyCallback(target, fn) )
  }

  return channel(() => {}, e => offs.map($c => $c.cancel(e)))
}

// selector-based aspect
function $(scope, selector, fn) {
  if (!scope[_observer]) {
    const observer = scope[_observer] = new MutationObserver((list) => {
      for (let mutation of list) {
        let { addedNodes, removedNodes, target } = mutation
        if (mutation.type === 'childList') {
          removedNodes.forEach(target => {
            if (target.nodeType !== 1) return
            set.matches(target).forEach(rule => destroyCallback(target, rule.data))
            set.queryAll(target).forEach(rule => rule.elements.forEach(el => destroyCallback(el, rule.data)))
          })
          addedNodes.forEach(target => {
            if (target.nodeType !== 1) return
            set.matches(target).forEach(rule => initCallback(target, rule.data))
            set.queryAll(target).forEach(rule => rule.elements.forEach(el => initCallback(el, rule.data)))
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
    observer.observe(scope, {
      attributes: true,
      childList: true,
      subtree: true
    })
  }

  const $channel = channel(fn, () => {
    set.queryAll(scope).forEach(rule => rule.elements.forEach(el => destroyCallback(el, rule.data)))
    set.remove(selector, $channel)
    if (!set.size) {
      scope[_observer].disconnect()
      delete scope[_observer]
    }
  })

  set.add(selector, $channel)
  // set.matches(scope).forEach(rule => initCallback(scope, rule.data))
  set.queryAll(scope).forEach(rule => rule.elements.forEach(el => initCallback(el, rule.data)))

  return $channel
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
  el[_destroyPlanned] = true
  window.requestAnimationFrame(() => {
    if (!el[_destroyPlanned]) return
    let cb = el[_callbacks].get(fn);
    if (cb.destroy && cb.destroy.call) cb.destroy();
    el[_callbacks].delete(fn);
  });
}
