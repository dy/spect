import SelectorSet from 'selector-set'
import channel from './channel.js'
import tuple from 'immutable-tuple'

const _callbacks = Symbol.for('__spect.callbacks')
const _destroyPlanned = Symbol.for('__spect.destroyPlanned')
const _observer = Symbol.for('__spect.observer')
const _attrAspects = Symbol.for('__spect.attrAspects')
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
          if (!target[_attrAspects]) target[_attrAspects] = new Set

          const active = new WeakSet()
          set.matches(target).forEach(rule => {
            initCallback(target, rule.data)
            const t = tuple(target, attrName, rule.selector, rule.data)
            target[_attrAspects].add(t)
            active.add(t)
          })

          set.queryAll(target).forEach(rule => {
            rule.elements.forEach(el => {
              initCallback(el, rule.data)
              const t = tuple(el, attrName, rule.selector, rule.data)
              target[_attrAspects].add(t)
              active.add(t)
            })
          })

          // remove selectors not matching attr rules anymore
          for (let t of target[_attrAspects]) {
            if (active.has(t)) continue
            destroyCallback(t[0], t[3])
            target[_attrAspects].delete(t)
            if (!target[_attrAspects].size) delete target[_attrAspects]
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
