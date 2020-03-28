const _dispose = typeof Symbol !== 'undefined' ? (Symbol.dispose || (Symbol.dispose = Symbol.for('dispose'))) : '@@dispose'

const SPECT_CLASS = '👁'
const ELEMENT = 1
let count = 0

// both ruleset and query rules for target
// (it's safe to store ids on function, even `arguments` and `length`)
const idRules = (target) => {
  let arr = []
  addMatched(arr, target, idRules[target.id])
  for (let id in idRules) addMatched(arr, target.getElementById(id), idRules[id])
  return arr
}
const classRules = (target) => {
  let arr = []
  target.classList.forEach(cls => addMatched(arr, target, classRules[cls]))
  for (let cls in classRules) addMatched(arr, target.getElementsByClassName(cls), classRules[cls])
  return arr
}
const tagRules = (target) => {
  let arr = []
  addMatched(arr, target, tagRules[target.tagName])
  for (let tag in tagRules) {
    addMatched(arr, target.getElementsByTagName(tag), tagRules[tag])
  }
  return arr
}
const nameRules = (target) => {
  let arr = [], name = target.attributes.name.value
  addMatched(arr, target, nameRules[name])
  for (let name in nameRules) addMatched(arr, target.getElementsByName(name), nameRules[name])
  return arr
}


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

  let op, id, tag, cls, name, sel, style, anim, trans

  // const ruleId = `${SPECT_CLASS}-${count++}`
  const ruleId = `spect-${count++}`
  const scopeClass = scope ? `spect-scope-${count}` : ''

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
    else if (tag && (tag = tag.toUpperCase())) (tagRules[tag] = tagRules[tag] || []).push([fn, sel, scope])
  }

  // assign secondary aspects via animation observer (technique inspired by insertionQuery). Cases:
  // - dynamically added attributes (we don't observe attribs via mutation obserever)
  // - complex selectors (we avoid long sync mutations check)
  // - simple tag selectors are meaningless to observe - they're never going to dynamically match
  // NOTE: only connected scope supports anim observer
  // tracking unmathed elements is done via transition events
  if (!/^\w+$/.test(selector)) {
    if (scope) scope.classList.add(scopeClass)

    style = document.createElement('style')
    style.innerHTML = `
    @keyframes ${ ruleId } { from {} to {} }
    ${ scope ? '.' + scopeClass : '' } ${ selector }:not(${ ruleId }) {
    animation-delay: -1ms; animation-duration: 0ms;
    animation-iteration-count: 1; animation-name: ${ ruleId };
    }
    .${ ruleId } {
      transition: 1s linear;
      outline: 1px transparent;
    }
    ${ selector }.${ ruleId } {
      outline: 0px transparent;
    }
    `
    console.log(style.innerHTML)

    anim = e => {
      if (e.animationName !== ruleId) return
      let {target} = e
      if (!target.classList.contains(ruleId)) {
        target.addEventListener('transitionstart', trans)
        target.classList.add(ruleId)
        enable(target, fn)
      }
    }
    trans = e => {
      console.log(e)
      // else {
      //   target.classList.remove(ruleId)
      //   disable(target, fn)
      // }
    }

    document.head.appendChild(style)
    document.addEventListener('animationstart', anim)
  }

  collection[_dispose] = () => {
    collection.map(el => disable(el, fn))
    if (id) idRules[id].splice(idRules[id].findIndex(rule => rule[0] === fn) >>> 0, 1)
    if (cls) classRules[cls].splice(classRules[cls].findIndex(rule => rule[0] === fn) >>> 0, 1)
    if (tag) tagRules[tag].splice(tagRules[tag].findIndex(rule => rule[0] === fn) >>> 0, 1)
    if (name) nameRules[name].splice(nameRules[name].findIndex(rule => rule[0] === fn) >>> 0, 1)
    if (style) document.head.removeChild(style)
    if (animHandler) document.removeEventListener('animationstart', animHandler)
    if (scope) scope.classList.remove(scopeClass)
  }

  return collection
}


const addMatched = (arr, el, rules) => {
  if (!rules || !el) return
  if (!el.nodeType && el.item) return [].map.call(el, el => addMatched(arr, el, rules))
  rules.map(([fn, sel, scope]) => {
    // ignore out-of-scope rules
    if (scope) {
      if (scope.nodeType) if (!scope.contains(el)) return
      if ([].every.call(scope, scope => !scope.contains(el))) return
    }

    // a, .a, #a
    if (!sel) arr.push([el, fn])
    // a.a, #a[name=b]
    else if (el.matches(sel)) arr.push([el, fn])
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
        if (target.id) idRules(target).map(rule => enable(...rule))
        if (target.className) classRules(target).map(rule => enable(...rule))
        if (target.attributes.name) nameRules(target).map(rule => enable(...rule))
        tagRules(target).map(rule => enable(...rule))
      })
    }
  }
})
observer.observe(document, {
  childList: true,
  subtree: true
})


const _aspects = Symbol.for('@spect')
const _unspect = Symbol('unspect')
function enable(target, aspect) {
  if (!target[_aspects]) {
    target[_aspects] = new Map
    target.classList.add(SPECT_CLASS)
  }
  if (!target[_aspects].has(aspect)) {
    target[_aspects].set(aspect, aspect(target))
  }
  if (target[_unspect]) delete target[_unspect]
}

function disable(target, aspect) {
  if (!aspect) return [...target[_aspects].keys()].map(aspect => disable(target, aspect))

  target[_unspect] = true

  requestAnimationFrame(() => {
    if (!target[_unspect]) return
    if (!target[_aspects]) return

    let unaspect = target[_aspects].get(aspect)
    target[_aspects].delete(aspect)
    if (unaspect && unaspect.call) unaspect(target)

    if (!target[_aspects].size) {
      delete target[_aspects]
      target.classList.remove(SPECT_CLASS)
    }
  })
}
