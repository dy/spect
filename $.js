const _dispose = typeof Symbol !== 'undefined' ? (Symbol.dispose || (Symbol.dispose = Symbol.for('dispose'))) : '@@dispose'

const SPECT_CLASS = '👁'
const ELEMENT = 1
let count = 0


export default function $(scope, selector, fn) {
  // spect`#x`
  if (scope && scope.raw) return $(null, String.raw(...arguments))
  // spect(selector, fn)
  if (typeof scope === 'string') return $(null, scope, selector)

  // spect(target, fn)
  if (!selector ||  typeof selector === 'function') {
    fn = selector
    let target = scope
    if (target.nodeType) target = [target]
    if (!target.nodeType && target[0].nodeType) {
      target = [...target]
      target.map(el => enable(el, fn))
      target[Symbol.dispose] = () => target.map(el => disable(el, fn))
    }
    return target
  }

  let op, id, tag, cls, name, sel, anim

  const parts = selector.match(/^(\s*)(?:#([\w-]+)|(\w+)|\.([\w-]+)|\[\s*name=([\w]+)\s*\])([^]*)/)

  // init existing elements
  const collection = [...(scope || document).querySelectorAll(selector)]
  collection.map(el => enable(el, fn))

  // non-simple selectors are considered secondary aspects
  if (parts) {
  // TODO: handle multiple simple parts, make sure rulesets don't overlap
    [, op, id, tag, cls, name, sel ] = parts

    // 1/2-component selectors
    if (id) (idRules[id] = idRules[id] || []).push([fn, sel, scope])
    else if (name) (nameRules[name] = nameRules[name] || []).push([fn, sel, scope])
    else if (cls) (classRules[cls] = classRules[cls] || []).push([fn, sel, scope])
    else if (tag) (tag = tag.toUpperCase(), tagRules[tag] = tagRules[tag] || []).push([fn, sel, scope])
  }

  // assign secondary aspects via animation observer (technique from insertionQuery). Cases:
  // - dynamically added attributes so that existing nodes match (we don't observe attribs in mutation obserever)
  // - complex selectors, inc * - we avoid >O(c) sync mutations check
  // Simple tag selectors are meaningless to observe - they're never going to dynamically match.
  // NOTE: only connected scope supports anim observer
  // FIXME: if complex selectors have `animation`redefined by user-styles it may conflict
  if (!/^\w+$/.test(selector)) {
    anim = animRules[selector]
    if (!anim) {
      anim = []
      anim.sel = selector
      anim.id = 'spect-' + count++
      animRules[selector] = anim
      anim.style = document.createElement('style')
      anim.style.innerHTML = `
      @keyframes ${ anim.id } { from {} to {} }
      ${ selector }:not(.${ anim.id }) { animation-name: ${ anim.id } }
      .${ anim.id } { animation-name: ${ anim.id } }
      ${ selector }.${ anim.id } { animation-name: unset; animation-name: revert; }
      `
      anim.onanim = e => {
        if (e.animationName !== anim.id) return
        e.stopPropagation()
        e.preventDefault()
        let {target} = e
        if (scope) if (scope === target || !scope.contains(target)) return

        if (!target.classList.contains(anim.id)) {
          target.classList.add(anim.id)
          anim.map(([fn]) => enable(target, fn))
        }
        else {
          target.classList.remove(anim.id)
          anim.map(([fn]) => disable(target, fn))
        }
      }
      document.head.appendChild(anim.style)
      document.addEventListener('animationstart', anim.onanim, true)
    }

    anim.push([fn])
  }

  collection[_dispose] = () => {
    collection.map(el => disable(el, fn))
    if (id) idRules[id].splice(idRules[id].findIndex(rule => rule[0] === fn) >>> 0, 1)
    if (cls) classRules[cls].splice(classRules[cls].findIndex(rule => rule[0] === fn) >>> 0, 1)
    if (tag) tagRules[tag].splice(tagRules[tag].findIndex(rule => rule[0] === fn) >>> 0, 1)
    if (name) nameRules[name].splice(nameRules[name].findIndex(rule => rule[0] === fn) >>> 0, 1)
    if (anim) {
      anim.splice(anim.findIndex(rule => rule[0] === fn) >>> 0, 1)
      if (!anim.length) {
        document.head.removeChild(anim.style)
        document.removeEventListener('animationstart', anim.onanim)
        delete animRules[anim.sel]
      }
    }
  }

  return collection
}

const animRules = {}

// both ruleset and query rules for target
// (it's safe to store ids on function, even `arguments` and `length`)
const idRules = (target) => {
  enableMatched(target, idRules[target.id])
  for (let id in idRules) enableMatched(target.getElementById(id), idRules[id])
}
const classRules = (target) => {
  target.classList.forEach(cls => enableMatched(target, classRules[cls]))
  for (let cls in classRules) enableMatched(target.getElementsByClassName(cls), classRules[cls])
}
const tagRules = (target) => {
  enableMatched(target, tagRules[target.tagName])
  for (let tag in tagRules) {
    enableMatched(target.getElementsByTagName(tag), tagRules[tag])
  }
}
const nameRules = (target) => {
  const name = target.attributes.name.value
  enableMatched(target, nameRules[name])
  for (let name in nameRules) enableMatched(target.getElementsByName(name), nameRules[name])
}
const enableMatched = (el, rules) => {
  if (!rules || !el) return
  if (!el.nodeType && el.item) return [].map.call(el, el => enableMatched(el, rules))
  rules.map(([fn, sel, scope]) => {
    // ignore out-of-scope rules
    if (scope) {
      if (scope.nodeType) {if (!scope.contains(el)) return}
      else if ([].every.call(scope, scope => !scope.contains(el))) return
    }

    // a, .a, #a
    if (!sel) enable(el, fn)
    // a.a, #a[name=b]
    else if (el.matches(sel)) enable(el, fn)
    // else
    // a > b, a b, a~b, a+b
  })
}

const observer = new MutationObserver((list) => {
  for (let mutation of list) {
    let { addedNodes, removedNodes, target } = mutation
    if (mutation.type === 'childList') {
      removedNodes.forEach(target => {
        if (target.nodeType !== ELEMENT) return
        if (target.classList.contains(SPECT_CLASS)) disable(target)
        ;[...target.getElementsByClassName(SPECT_CLASS)].map(node => disable(node))
      })

      addedNodes.forEach(target => {
        if (target.nodeType !== ELEMENT) return

        // selector-set optimization:
        // instead of walking full ruleset for each node, we detect which rules are applicable for the node
        // ruleset checks target itself and its children, returns list of [el, aspect] tuples
        if (target.id) idRules(target)
        if (target.className) classRules(target)
        if (target.attributes.name) nameRules(target)
        tagRules(target)
      })
    }
  }
})
observer.observe(document, {
  childList: true,
  subtree: true
})


const _aspects = Symbol.for('@spect')
const _unaspect = Symbol('unaspect')
function enable(target, aspect) {
  if (!target[_aspects]) {
    target[_aspects] = new Map
    target.classList.add(SPECT_CLASS)
  }
  if (!target[_aspects].has(aspect)) {
    target[_aspects].set(aspect, aspect(target))
  }
  if (target[_unaspect]) delete target[_unaspect]
}

function disable(target, aspect) {
  if (!aspect) return [...target[_aspects].keys()].map(aspect => disable(target, aspect))

  target[_unaspect] = true

  requestAnimationFrame(() => {
    if (!target[_unaspect]) return
    if (!target[_aspects]) return

    let unaspect = target[_aspects].get(aspect)
    target[_aspects].delete(aspect)
    if (unaspect) if (unaspect.call) unaspect(target); else if (unaspect.then) unaspect.then(fn => fn && fn.call && fn())

    if (!target[_aspects].size) {
      delete target[_aspects]
      target.classList.remove(SPECT_CLASS)
    }
  })
}
