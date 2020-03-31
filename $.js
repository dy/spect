import * as symbol from './symbols.js'
import channel from './channel.js'

const ELEMENT = 1

const SPECT_CLASS = '👁'
const CLASS_OFFSET = 0x1F700
let count = 0

const _spect = Symbol.for('@spect'), _observer = Symbol.for('@spect.observer')

const ids = {}, classes = {}, tags = {}, names = {}, animations = {}

const style = document.head.appendChild(document.createElement('style'))
style.classList.add('spect-style')
const { sheet } = style


export default function (scope, selector, fn) {
  // spect`#x`
  if (scope && scope.raw) return new $(null, String.raw(...arguments))
  // spect(selector, fn)
  if (typeof scope === 'string') return new $(null, scope, selector)
  // spect(target, fn)
  if (!selector ||  typeof selector === 'function') {
    fn = selector
    let target = scope
    if (!target) target = []
    if (target.nodeType) target = [target]

    const set = new $(null, null, fn)
    set.add(...target)
    return set
  }

  return new $(scope, selector, fn)
}

class $ extends Array {
  constructor(scope, selector, fn){
    // self-call, like splice, map, slice etc. fall back to array
    if (typeof scope === 'number') return Array(scope)

    super()

    this._channel = channel()
    this._items = new WeakSet
    this._delete = new WeakSet
    this._teardown = new WeakMap
    if (scope) this._scope = scope
    if (fn) this._fn = fn

    // ignore non-selector collections
    if (!selector) return

    this._selector = selector

    // init existing elements
    this.add(...(scope || document).querySelectorAll(selector))

    const selectors = selector.split(/\s*,\s*/)

    const rpart = /^\s*(?:#([\w-]+)|\[\s*name=([\w-]+)\s*\]|\.([\w-]+)|(\w+))/
    const rmatch = /^(?:\[[^\]]+\]|[^\s>+~\[]+)+/

    let complex = false
    this._parts = selectors.map(selector => {
      let parts = [], match

      while (selector && (match = selector.match(rpart))) {
        const [chunk, ...part] = match
        selector = selector.slice(chunk.length)
        if (part[3]) part[3] = part[3].toUpperCase()

        // parse filters
        if (match = selector.match(rmatch)) {
          part.push(match[0])
          selector = selector.slice(match[0].length)
        }

        parts.push(part)
      }

      // if exited with non-empty string - selector is not trivial, delegate to anim events
      if (selector) return complex = true

      // indexable selectors
      const [id, name, cls, tag, filter] = parts[0]
      if (id) (ids[id] = ids[id] || []).push(this)
      else if (name) (names[name] = names[name] || []).push(this)
      else if (cls) (classes[cls] = classes[cls] || []).push(this)
      else if (tag) (tag, tags[tag] = tags[tag] || []).push(this)

      // elements can't be turned to match tag selectors without remove/add, so anim observer is not required
      if (parts.some(([i,n,c, tag, filter]) => !tag || filter)) complex = true

      return parts
    })


    // complex selectors are handled via anim events (technique from insertionQuery). Cases:
    // - dynamically added attributes so that existing nodes match (we don't observe attribs in mutation obserever)
    // - complex selectors, inc * - we avoid > O(c) sync mutations check
    // NOTE: only connected scope supports anim observer
    if (complex) {
      let anim = animations[selector]
      if (!anim) {
        anim = animations[selector] = []
        this._animation = anim.id = String.fromCodePoint(CLASS_OFFSET + count++)
        sheet.insertRule(`@keyframes ${ anim.id }{}`, sheet.rules.length)
        sheet.insertRule(`${ selectors.map(sel => sel + `:not(.${ anim.id })`) }{animation:${ anim.id }}`, sheet.rules.length)
        sheet.insertRule(`.${ anim.id }{animation:${ anim.id }}`, sheet.rules.length)
        sheet.insertRule(`${ selectors.map(sel => sel + `.${ anim.id }`) }{animation:unset;animation:revert}`, sheet.rules.length)
        anim.rules = [].slice.call(sheet.rules, -4)

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
      }
      this._animation = anim.id
      anim.push(this)
    }
  }

  add(el, ...els) {
    if (!el) return

    // track collection
    this.push(el)
    this._items.add(el)
    if (el.name) this[el.name] = el
    if (el.id) this[el.id] = el
    // cancel planned delete
    if (this._delete.has(el)) this._delete.delete(el)

    // ignore existing items
    if (el[_spect] && el[_spect].has(this)) return

    // ignore out-of-scope
    if (this._scope) {
      if (this._scope === el) return
      if (this._scope.nodeType) { if (!this._scope.contains(el)) return }
      else if ([].every.call(this._scope, scope => !scope.contains(el))) return
    }
    // ignore not-matching
    if (this._match) if (!el.matches(this._match)) return

    // NOTE: this does not hook props added after
    // if ((el.name || el.id)) {
    //   if (!el[_observer]) {
    //     let name = el.name, id = el.id
    //     // id/name mutation observer tracks refs and handles unmatch
    //     ;(el[_observer] = new MutationObserver(records => {
    //       if (name && (el.name !== name)) if (names[name]) names[name].forEach(c => (delete c[name], c.delete(el)))
    //       if (name = el.name) if (names[name]) names[name].forEach(c => c.add(el))
    //       if (id && (el.id !== id)) if (ids[id]) ids[id].forEach(c => (delete c[id], c.delete(el)))
    //       if (id = el.id) if (ids[id]) ids[id].forEach(c => c.add(el))
    //     }))
    //     .observe(el, {attributes: true, attributeFilter: ['name', 'id']})
    //   }
    // }

    // enable item
    if (!el[_spect]) el[_spect] = new Set

    // mark element
    el[_spect].add(this)
    el.classList.add(SPECT_CLASS)

    // notify
    this._teardown.set(el, this._fn && this._fn(el))
    this._channel.push(this)

    if (els.length) this.add(...els)
  }

  delete(el, immediate = false) {
    // remove element from list sync
    this._items.delete(el)
    if (this.length) this.splice(this.indexOf(el >>> 0, 1), 1)
    if (el.name) delete this[el.name]
    if (el.id) delete this[el.id]
    // plan destroy async (can be re-added)
    this._delete.add(el)

    const del = () => {
      if (!this._delete.has(el)) return
      this._delete.delete(el)

      if (!el[_spect]) return

      const teardown = this._teardown.get(el)
      if (teardown) {
        if (teardown.call) teardown(el)
        else if (teardown.then) teardown.then(fn => fn && fn.call && fn())
      }
      this._teardown.delete(el)
      this._channel.push(this)

      el[_spect].delete(this)
      if (!el[_spect].size) {
        delete el[_spect]
        el.classList.remove(SPECT_CLASS)
        if (el[_observer]) {
          el[_observer].disconnect()
          delete el[_observer]
        }
      }
    }

    if (immediate) del()
    else requestAnimationFrame(del)
  }

  [symbol.observable]() {
    const { subscribe, observers, push } = this._channel
    const set = this
    return {
      subscribe(){
        const unsubscribe = subscribe(...arguments)
        push(set, observers.slice(-1))
        return unsubscribe
      }
    }
  }

  item(n) { return n < 0 ? this[this.length + n] : this[n] }

  namedItem(name) { return this[name] }

  has(item) { return this._items.has(item) }

  [symbol.dispose]() {
    if (this._parts) {
      this._parts.forEach(([sel, [id, name, cls, tag]]) => {
        id && ids[id].splice(ids[id].indexOf(this) >>> 0, 1)
        name && names[name].splice(names[name].indexOf(this) >>> 0, 1)
        cls && classes[cls].splice(classes[cls].indexOf(this) >>> 0, 1)
        tag && tags[tag].splice(tags[tag].indexOf(this) >>> 0, 1)
      })
    }
    if (this._animation) {
      const anim = animations[this._selector]
      anim.splice(anim.indexOf(this) >>> 0, 1)
      if (!anim.length) {
        document.removeEventListener('animationstart', anim.onanim)
        delete animations[this._selector]
        anim.rules.forEach(rule => {
          let idx = [].indexOf.call(sheet.rules, rule)
          if (~idx) sheet.deleteRule(idx)
        })
      }
    }

    this._channel.close()
    let els = [...this]
    this.length = 0
    els.forEach(el => this.delete(el, true))
  }
}


const observer = new MutationObserver((list) => {
  for (let mutation of list) {
    let { addedNodes, removedNodes, target } = mutation
    if (mutation.type === 'childList') {
      removedNodes.forEach(target => {
        if (target.nodeType !== ELEMENT) return
        ;[target.classList.contains(SPECT_CLASS) ? target : null, ...target.getElementsByClassName(SPECT_CLASS)]
        .forEach(node => node && node[_spect].forEach(set => set.delete(node)))
      })

      addedNodes.forEach(target => {
        if (target.nodeType !== ELEMENT) return

        // selector-set optimization:
        // instead of walking full ruleset for each node, we detect which rules are applicable for the node
        // ruleset checks target itself and its children, returns list of [el, aspect] tuples
        if (target.id) {
          // ids(target).map(el => )
          ids[target.id] && ids[target.id].forEach(c => c.add(target))
          let node
          // NOTE: <a> and other inlines may not have `getElementById`
          if (target.getElementById) for (let id in ids) if (node = target.getElementById(id)) ids[id].forEach(c => c.add(node))
        }
        if (target.className) {
          target.classList.forEach(cls => classes[cls] && classes[cls].forEach(c => c.add(target)))
          for (let cls in classes) [].forEach.call(target.getElementsByClassName(cls), node => classes[cls].forEach(c => c.add(node)))
        }
        if (target.attributes.name) {
          const name = target.attributes.name.value
          names[name] && names[name].forEach(c => c.add(target))
          for (let name in names) [].forEach.call(target.getElementsByName(name), node => names[name].forEach(c => c.add(node)))
        }
        tags[target.tagName] && tags[target.tagName].forEach(c => c.add(target))
        for (let tag in tags) [].forEach.call(target.getElementsByTagName(tag), node => tags[tag].forEach(c => c.add(node)))
      })
    }
  }
})
observer.observe(document, {
  childList: true,
  subtree: true
})

