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
      target.fn = fn
      target.map(el => enable(el, target))
      target[Symbol.dispose] = () => target.map(el => disable(el, target))
    }
    return target
  }

  let op, id, tag, cls, name, match, anim

  const parts = selector.match(/^(\s*)(?:#([\w-]+)|(\w+)|\.([\w-]+)|\[\s*name=([\w]+)\s*\])([^]*)/)

  // init existing elements
  const set = []
  set.fn = fn
  set.scope = scope
  ;(scope || document).querySelectorAll(selector).forEach(el => enable(el, set))

  // non-simple selectors are considered secondary aspects
  if (parts) {
  // TODO: handle multiple simple parts, make sure rulesets don't overlap
    [, op, id, tag, cls, name, match ] = parts
    set.match = match

    // 1/2-component selectors
    if (id) (idRules[id] = idRules[id] || []).push(set)
    else if (name) (nameRules[name] = nameRules[name] || []).push(set)
    else if (cls) (classRules[cls] = classRules[cls] || []).push(set)
    else if (tag) (tag = tag.toUpperCase(), tagRules[tag] = tagRules[tag] || []).push(set)
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
          anim.map(set => enable(target, set))
        }
        else {
          target.classList.remove(anim.id)
          anim.map(set => disable(target, set))
        }
      }
      document.head.appendChild(anim.style)
      document.addEventListener('animationstart', anim.onanim, true)
    }

    anim.push(set)
  }

  set[_dispose] = () => {
    set.map(el => disable(el, set))
    if (id) idRules[id].splice(idRules[id].findIndex(rule => rule[0] === set) >>> 0, 1)
    if (cls) classRules[cls].splice(classRules[cls].findIndex(rule => rule[0] === set) >>> 0, 1)
    if (tag) tagRules[tag].splice(tagRules[tag].findIndex(rule => rule[0] === set) >>> 0, 1)
    if (name) nameRules[name].splice(nameRules[name].findIndex(rule => rule[0] === set) >>> 0, 1)
    if (anim) {
      anim.splice(anim.findIndex(rule => rule === set) >>> 0, 1)
      if (!anim.length) {
        document.head.removeChild(anim.style)
        document.removeEventListener('animationstart', anim.onanim)
        delete animRules[anim.sel]
      }
    }
  }

  return set
}

const animRules = {}


const observer = new MutationObserver((list) => {
  for (let mutation of list) {
    let { addedNodes, removedNodes, target } = mutation
    if (mutation.type === 'childList') {
      removedNodes.forEach(target => {
        if (target.nodeType !== ELEMENT) return
        if (target.classList.contains(SPECT_CLASS)) disable(target)
        ;[].map.call(target.getElementsByClassName(SPECT_CLASS), node => disable(node))
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
  rules.map(set => {
    const { match, scope } = set

    // ignore out-of-scope rules
    if (scope) {
      if (scope.nodeType) {if (!scope.contains(el)) return}
      else if ([].every.call(scope, scope => !scope.contains(el))) return
    }

    // a, .a, #a
    if (!match) enable(el, set)
    // a.a, #a[name=b]
    else if (el.matches(match)) enable(el, set)
    // else
    // a > b, a b, a~b, a+b
  })
}

const _sets = Symbol.for('@spect')
const _unaspect = Symbol('unaspect')
function enable(target, set) {
  if (!target[_sets]) {
    target[_sets] = new Map
    target.classList.add(SPECT_CLASS)
  }
  if (!target[_sets].has(set)) {
    set.push(target)
    target[_sets].set(set, set.fn && set.fn.call && set.fn(target))
  }

  if (target[_unaspect]) {
    delete target[_unaspect]
    ;[...target[_sets].keys()].map(set => set.push(target))
  }
}

function disable(target, set) {
  if (!target[_sets]) return
  if (!set) return [...target[_sets].keys()].map(set => disable(target, set))

  // remove from sets
  if (target[_sets]) [...target[_sets].keys()].map(set => set.splice(set.indexOf(target >>> 0), 1))

  target[_unaspect] = true
  requestAnimationFrame(() => {
    if (!target[_unaspect] || !target[_sets]) return

    let unaspect = target[_sets].get(set)
    target[_sets].delete(set)
    if (!target[_sets].size) {
      delete target[_sets]
      target.classList.remove(SPECT_CLASS)
    }

    if (unaspect) if (unaspect.call) unaspect(target); else if (unaspect.then) unaspect.then(fn => fn && fn.call && fn())
  })
}
