// 2 priorities of aspects: primary and secondary
// _primary_ are run sync by MutationObserver, they're expected to be content/style-modifying so don't have FOUC
// _secondary_ are run by anim-events skipping 1 frame and may have FOUC, they're considered of the same importance as animations
//
// _primary_ are:
// 1. direct simplets: #a, .a, a, [name=a]
// each added node is checked against `getElementBy*`
// 2. simplet combos: #a.a, .a.b.c, .a[name=a]
// each added node is checked against each simplet set `getElementBy*`, min simplet set is checked by `matches`
// 3. star - can safely run all nodes
//
// _secondary_ are:
// 1. pseudos - too difficult to run over all elems in set
// 2. attributes (except name) - that complicated mutation observer and mutations testing
// 3. +, ~, > combinations


const _dispose = typeof Symbol !== 'undefined' ? (Symbol.dispose || (Symbol.dispose = Symbol.for('dispose'))) : '@@dispose'

const SPECT_CLASS = '👁'
const ELEMENT = 1
let count = 0

const rparts = /^(\s*)(?:#([\w-]+)|(\w+)|\.([\w-]+)|\[\s*name=([\w]+)\s*\])([^]*)/

export default function $(selector, fn) {
  if (selector.nodeType) selector = [selector]
  if (!selector.nodeType && selector[0].nodeType) {
    selector = [...selector]
    selector.map(el => enable(el, fn))
    selector[Symbol.dispose] = () => selector.map(el => disable(el, fn))
    return selector
  }

  let op, id, tag, cls, name, sel, style, handler

  // const ruleId = `${SPECT_CLASS}-${count++}`
  const ruleId = `spect-${count++}`

  // TODO: handle multiple simple parts
  const parts = selector.match(rparts)

  // init existing elements
  const collection = [...document.querySelectorAll(selector)]
  collection.map(el => enable(el, fn))

  // non-simple selectors are considered secondary aspects
  if (parts) {
    [, op, id, tag, cls, name, sel ] = parts

    // 1/2-component selectors
    if (id) (idRules[id] = idRules[id] || []).push([fn, sel])
    if (cls) (classRules[cls] = classRules[cls] || []).push([fn, sel])
    if (tag && (tag = tag.toUpperCase())) (tagRules[tag] = tagRules[tag] || []).push([fn, sel])
    if (name) (nameRules[name] = nameRules[name] || []).push([fn, sel])
  }

  // assign secondary aspects via animation observer:
  // - for dynamically added attributes (we don't observe attribs via mutation obserever)
  // - for complex selectors (we avoid long sync mutations check)
  // - simple tag selectors or star are meaningless to observe
  if (!/^(?:\w+|\*)$/.test(selector)) {
    (style = document.createElement('style')).innerHTML = `
    @keyframes ${ ruleId } { from { outline: 1px transparent} to { outline: 0px transparent } }
    ${ selector } {
    animation-delay: -1ms !important; animation-duration: 0ms !important;
    animation-iteration-count: 1 !important; animation-name: ${ ruleId };
    }
    .${ ruleId }:not(${ selector }) {
    animation-delay: -1ms !important; animation-duration: 0ms !important;
    animation-iteration-count: 1 !important; animation-name: ${ ruleId };
    }`

    handler = e => {
      if (e.animationName !== ruleId) return
      let {target} = e
      if (!target.classList.contains(ruleId)) {
        target.classList.add(ruleId)
        enable(target, fn)
      }
      else {
        target.classList.remove(ruleId)
        disable(target, fn)
      }
    }

    document.head.appendChild(style)
    document.addEventListener('animationstart', handler)
  }

  collection[_dispose] = () => {
    collection.map(el => disable(el, fn))
    if (id) idRules[id].splice(idRules[id].findIndex(rule => rule[0] === fn) >>> 0, 1)
    if (cls) classRules[cls].splice(classRules[cls].findIndex(rule => rule[0] === fn) >>> 0, 1)
    if (tag) tagRules[tag].splice(tagRules[tag].findIndex(rule => rule[0] === fn) >>> 0, 1)
    if (name) nameRules[name].splice(nameRules[name].findIndex(rule => rule[0] === fn) >>> 0, 1)
    if (style) document.head.removeChild(style)
    if (handler) document.removeEventListener('animationstart', handler)
  }

  return collection
}


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
const addMatched = (arr, el, rules) => {
  if (!rules || !el) return
  if (!el.nodeType && el.item) return [].map.call(el, el => addMatched(arr, el, rules))
  rules.map(([fn, sel]) => {
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
function enable(target, aspect) {
  if (!target[_aspects]) {
    target[_aspects] = new Map
    target.classList.add(SPECT_CLASS)
  }
  if (!target[_aspects].has(aspect)) {
    target[_aspects].set(aspect, aspect(target))
  }
}

function disable(target, aspect) {
  let unaspect = target[_aspects].get(aspect)
  if (unaspect && unaspect.call) unaspect(target)
  target[_aspects].delete(aspect)

  if (!target[_aspects].size) {
    delete target[_aspects]
    target.classList.remove(SPECT_CLASS)
  }
}
