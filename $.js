import * as symbol from './symbols.js'
import channel from './channel.js'

const SPECT_CLASS = '👁'
const ELEMENT = 1
let count = 0
const _spect = Symbol.for('@spect')
const animSets = {}, idSets = {}, classSets = {}, tagSets = {}, nameSets = {}


const observer = new MutationObserver((list) => {
  for (let mutation of list) {
    let { addedNodes, removedNodes, target } = mutation
    if (mutation.type === 'childList') {
      removedNodes.forEach(target => {
        if (target.nodeType !== ELEMENT) return
        ;[target.classList.contains(SPECT_CLASS) ? target : null, ...target.getElementsByClassName(SPECT_CLASS)]
        .forEach(node => node?.[_spect].forEach(set => set.delete(node)))
      })

      addedNodes.forEach(target => {
        if (target.nodeType !== ELEMENT) return

        // selector-set optimization:
        // instead of walking full ruleset for each node, we detect which rules are applicable for the node
        // ruleset checks target itself and its children, returns list of [el, aspect] tuples
        if (target.id) {
          idSets[target.id]?.forEach(c => c.add(target))
          let node
          for (let id in idSets) if (node = target.getElementById(id)) idSets[id].forEach(c => c.add(node))
        }
        if (target.className) {
          target.classList.forEach(cls => classSets[cls]?.forEach(c => c.add(target)))
          for (let cls in classSets) [].forEach.call(target.getElementsByClassName(cls), node => classSets[cls].forEach(c => c.add(node)))
        }
        if (target.attributes.name) {
          const name = target.attributes.name.value
          nameSets[name]?.forEach(c => c.add(target))
          for (let name in nameSets) [].forEach.call(target.getElementsByName(name), node => nameSets[name].forEach(c => c.add(node)))
        }
        tagSets[target.tagName]?.forEach(c => c.add(target))
        for (let tag in tagSets) [].forEach.call(target.getElementsByTagName(tag), node => tagSets[tag].forEach(c => c.add(node)))
      })
    }
  }
})
observer.observe(document, {
  childList: true,
  subtree: true
})


export default function $(scope, selector, fn) {
  // spect`#x`
  if (scope?.raw) return new $Collection(null, String.raw(...arguments))
  // spect(selector, fn)
  if (typeof scope === 'string') return new $Collection(null, scope, selector)
  // spect(target, fn)
  if (!selector ||  typeof selector === 'function') {
    fn = selector
    let target = scope
    if (target.nodeType) target = [target]
    if (!target.nodeType && target[0].nodeType) {
      const set = new $Collection(null, null, fn)
      target.forEach(node => set.add(node))
      return set
    }
    throw 'Unknown argument'
  }

  return new $Collection(scope, selector, fn)
}

export class $Collection extends Array {
  #scope
  #selector
  #fn
  #match
  #id
  #tag
  #name
  #class
  #animation
  #channel = channel()
  #items = new WeakMap
  #delete = new WeakSet

  constructor(scope, selector, fn){
    // self-call, like splice, map, slice etc. fall back to array
    if (typeof scope === 'number') return Array(scope)

    super()

    this.#scope = scope
    this.#selector = selector
    this.#fn = fn

    // init existing elements
    ;[].forEach.call((scope || document).querySelectorAll(selector), node => this.add(node))

    const parts = selector?.match(/^(\s*)(?:#([\w-]+)|(\w+)|\.([\w-]+)|\[\s*name=([\w]+)\s*\])([^]*)/)

    if (parts) {
    // TODO: handle multiple simple parts, make sure rulesets don't overlap
      let [, op, id, tag, cls, name, match ] = parts

      this.#match = match

      // indexable selectors
      if (id) (idSets[id] = idSets[this.#id = id] || []).push(this)
      else if (name) (nameSets[name] = nameSets[this.#name = name] || []).push(this)
      else if (cls) (classSets[cls] = classSets[this.#class = cls] || []).push(this)
      else if (tag) (this.#tag = tag = tag.toUpperCase(), tagSets[tag] = tagSets[tag] || []).push(this)
    }

    // complex selectors are handled via anim events (technique from insertionQuery). Cases:
    // - dynamically added attributes so that existing nodes match (we don't observe attribs in mutation obserever)
    // - complex selectors, inc * - we avoid >O(c) sync mutations check
    // Simple tag selectors are meaningless to observe - they're never going to dynamically match.
    // NOTE: only connected scope supports anim observer
    // FIXME: if complex selectors have `animation`redefined by user-styles it may conflict
    if (!/^\w+$/.test(selector)) {
      // TODO: track selectors globally and assign class per selector, not per-anim
      this.#animation = animSets[selector]
      if (!this.#animation) {
        const anim = animSets[selector] = this.#animation = []
        anim.id = 'spect-' + count++
        (anim.style = document.createElement('style'))
        .innerHTML = `@keyframes ${ anim.id } { from{} to{} }
        ${ selector }:not(.${ anim.id }) { animation-name: ${ anim.id } }
        .${ anim.id } { animation-name: ${ anim.id } }
        ${ selector }.${ anim.id } { animation-name: unset; animation-name: revert; }`

        anim.onanim = e => {
          if (e.animationName !== anim.id) return
          e.stopPropagation()
          e.preventDefault()

          let {target} = e

          if (!target.classList.contains(anim.id)) {
            target.classList.add(anim.id)
            anim.forEach(set => set.add(target))
          }
          else {
            target.classList.remove(anim.id)
            anim.forEach(set => set.delete(target))
          }
        }
        document.addEventListener('animationstart', anim.onanim, true)
        document.head.appendChild(anim.style)
      }
      this.#animation.push(this)
    }
  }

  add(el, ...els) {
    if (!el) return

    // ignore existing items
    if (el[_spect]?.has(this)) return

    // ignore out-of-scope
    if (this.#scope) {
      if (this.#scope === el) return
      if (this.#scope.nodeType) { if (!this.#scope.contains(el)) return }
      else if ([].every.call(this.#scope, scope => !scope.contains(el))) return
    }
    // ignore not-matching
    if (this.#match) if (!el.matches(this.#match)) return


    // expose refs
    // TODO: add attribs mutation observer
    if (el.attributes.name) this[el.attributes.name.value] = el
    if (el.id) this[el.id] = el

    // enable item
    if (!el[_spect]) el[_spect] = new Set

    // mark element
    el[_spect].add(this)
    el.classList.add(SPECT_CLASS)

    // cancel planned delete
    if (this.#delete.has(el)) this.#delete.delete(el)

    // track collection
    this.push(el)
    this.#items.set(el, this.#fn?.(el))

    // notify
    this.#channel.push(this)
  }

  delete(el, immediate = false) {
    // clean up refs
    if (el.attributes.name) delete this[el.attributes.name.value]
    if (el.id) delete this[el.id]

    // remove element from list sync
    const teardown = this.#items.get(el)
    this.#items.delete(el)
    if (this.length) {
      this.splice(this.indexOf(el >>> 0, 1), 1)
      this.#channel.push(this)
    }

    // plan destructor async
    this.#delete.add(el)

    const del = () => {
      if (!this.#delete.has(el)) return
      this.#delete.delete(el)

      if (!el[_spect]) return

      if (teardown?.call) teardown(el)
      else if (teardown?.then) teardown.then(fn => fn?.call && fn())

      el[_spect].delete(this)

      if (!el[_spect].size) {
        delete el[_spect]
        el.classList.remove(SPECT_CLASS)
      }
    }

    if (immediate) del()
    else requestAnimationFrame(del)
  }

  [symbol.dispose]() {
    if (this.#id) idSets[this.#id].splice(idSets[this.#id].indexOf(this) >>> 0, 1)
    if (this.#class) classSets[this.#class].splice(classSets[this.#class].indexOf(this) >>> 0, 1)
    if (this.#tag) tagSets[this.#tag].splice(tagSets[this.#tag].indexOf(this) >>> 0, 1)
    if (this.#name) nameSets[this.#name].splice(nameSets[this.#name].indexOf(this) >>> 0, 1)
    if (this.#animation) {
      const anim = this.#animation
      anim.splice(anim.indexOf(this) >>> 0, 1)
      if (!anim.length) {
        document.head.removeChild(anim.style)
        document.removeEventListener('animationstart', anim.onanim)
        delete animSets[this.#selector]
      }
    }

    this.#channel.close()
    let els = [...this]
    this.length = 0
    els.forEach(el => this.delete(el, true))
  }

  [symbol.observable]() { return this.#channel }

  item(n) { return n < 0 ? this[this.length + n] : this[n] }

  namedItem(name) { return this[name] }

  has(item) { return this.#items.has(item) }
}
