import { channel, symbol, desc } from './util.js'

const ELEMENT = 1
const SPECT_CLASS = '👁'
const CLASS_OFFSET = 0x1F700
let count = 0

const ids = {}, classes = {}, tags = {}, names = {}, animations = {}, setCache = new WeakMap

const hasAnimevent = typeof AnimationEvent !== 'undefined'
const style = document.head.appendChild(document.createElement('style'))

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
    target.forEach(el => set.add(el))
    return set
  }

  return new $(scope, selector, fn)
}

class $ extends Array {
  constructor(scope, selector, fn){
    // self-call, like splice, map, slice etc. fall back to array
    if (typeof scope === 'number') return Array(scope)

    super()

    // Object.defineProperties(this, {
    //   _channel: desc(channel()),
    //   _items: desc(new WeakMap),
    //   _delete: desc(new WeakSet),
    //   _teardown: desc(new WeakMap),
    //   _scope: desc(scope),
    //   _fn: desc(fn),
    //   _selector: desc(),
    //   _match: desc(),
    //   _animation: desc()
    // })
    // an alternative way to hide props is creating 1-level prototype
    // FIXME: wait for real private props to come
    this._channel = channel()
    this._items = new WeakMap
    this._delete = new WeakSet
    this._teardown = new WeakMap
    this._scope = scope
    this._fn = fn
    this._selector = null
    this._match = null
    this._animation = null

    // hiding privates to prototype: 1. better look debugger, 2. no `add`/`set` methods conflict
    const set = this.$ = Object.create(this)
    const self = this

    // ignore non-selector collections
    if (!selector) return set
    // if (!selector) return

    // init existing elements
    ;(scope || document).querySelectorAll(selector).forEach(el => self.add(el))

    // if last selector part is simple (id|name|class|tag), followed by classes - index that
    const rtokens = /(?:#([\w:-]+)|\[\s*name=['"]?([\w:-]+)['"]?\s*\]|\.([\w:-]+)|([\*\w:-]+))(\[[^\]]+\]|\.[\w:-]+)*$/

    self._selector = selector.split(/\s*,\s*/).map(selector => {
      selector = new String(selector)

      const match = selector.match(rtokens)
      selector.filter = selector
      if (!match) return selector

      let [str, id, name, cls, tag, filter] = match
      if (id) (ids[selector.id = id] = ids[id] || []).push(self)
      else if (name) (names[selector.name = name] = names[name] || []).push(self)
      else if (cls) (classes[selector.class = cls] = classes[cls] || []).push(self)
      else if (tag) (selector.tag = tag = tag.toUpperCase(), tags[tag] = tags[tag] || []).push(self)

      if (filter) selector.filter = selector.slice(0, match.index) + selector.slice(-filter.length)
      // `match.index` === 0 means selector is simple and need no match check
      else if (!match.index) delete selector.filter

      return selector
    })
    self._match = self._selector.some(sel => sel.filter)

    // complex selectors are handled via anim events (technique from insertionQuery). Cases:
    // - dynamically added attributes so that existing nodes match (we don't observe attribs in mutation obserever)
    // - complex selectors, inc * - we avoid > O(c) sync mutations check
    // NOTE: only connected scope supports anim observer
    if (!hasAnimevent) {
      let anim = animations[self._selector]
      if (!anim) {
        const { sheet } = style, { cssRules } = sheet
        anim = animations[self._selector] = []
        self._animation = anim.id = String.fromCodePoint(CLASS_OFFSET + count++)
      }
      self._animation = anim.id
      anim.push(self)
    }
    else if (!self._selector.every(sel => sel.tag && !sel.filter)) {
      let anim = animations[self._selector]
      if (!anim) {
        const { sheet } = style, { cssRules } = sheet
        anim = animations[self._selector] = []
        anim.id = String.fromCodePoint(CLASS_OFFSET + count++)
        sheet.insertRule(`@keyframes ${ anim.id }{}`, cssRules.length)
        sheet.insertRule(`${ self._selector.map(sel => sel + `:not(.${ anim.id })`) }{animation:${ anim.id }}`, cssRules.length)
        sheet.insertRule(`.${ anim.id }{animation:${ anim.id }}`, cssRules.length)
        sheet.insertRule(`${ self._selector.map(sel => sel + `.${ anim.id }`) }{animation:unset;animation:revert}`, cssRules.length)
        anim.rules = [].slice.call(cssRules, -4)

        anim.onanim = e => {
          if (e.animationName !== anim.id) return
          e.stopPropagation()
          e.preventDefault()

          let {target} = e

          if (!target.classList.contains(anim.id)) {
            target.classList.add(anim.id)
            anim.forEach(self => self.add(target, false))
          }
          else {
            target.classList.remove(anim.id)
            anim.forEach(self => self.delete(target))
          }
        }
        document.addEventListener('animationstart', anim.onanim, true)
      }
      self._animation = anim.id
      anim.push(self)
    }

    return set
  }

  add(el, check=this._match) {
    if (!el) return

    const set = this.$ || this
    const self = Object.getPrototypeOf(set)

    // ignore existing
    if (self._items.has(el)) return

    // ignore not-matching
    if (check) if (!el.matches(self._selector)) return

    // ignore out-of-scope
    if (self._scope) {
      if (self._scope === el) return
      if (self._scope.nodeType) { if (!self._scope.contains(el)) return }
      else if ([].every.call(self._scope, scope => !scope.contains(el))) return
    }

    // track collection
    set.push(el)
    self._items.set(el, [el.id, el.name])
    if (el.name) set[el.name] = el
    if (el.id) set[el.id] = el

    // cancel planned delete
    if (self._delete.has(el)) self._delete.delete(el)

    // ignore existing items
    if (setCache.has(el) && setCache.get(el).has(self)) return

    // FIXME: name/id ref obsever - seems like overkill, waiting for real-case demand
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
    if (!setCache.has(el)) setCache.set(el, new Set)

    // mark element
    setCache.get(el).add(self)
    el.classList.add(SPECT_CLASS)

    // notify
    self._teardown.set(el, self._fn && self._fn(el))
    self._channel.push(set)
  }

  delete(el, immediate = false) {
    const set = this.$ || this
    const self = Object.getPrototypeOf(set)

    if (!self._items.has(el)) return

    // remove element from list sync
    if (set.length) set.splice(set.indexOf(el >>> 0, 1), 1)
    const [id, name] = self._items.get(el)
    if (name) delete set[name]
    if (id) delete set[id]
    self._items.delete(el)
    // plan destroy async (can be re-added)
    self._delete.add(el)

    const del = () => {
      if (!self._delete.has(el)) return
      self._delete.delete(el)

      if (!setCache.has(el)) return
      const teardown = self._teardown.get(el)
      if (teardown) {
        if (teardown.call) teardown(el)
        else if (teardown.then) teardown.then(fn => fn && fn.call && fn())
      }
      self._teardown.delete(el)
      self._channel.push(set)

      setCache.get(el).delete(self)
      if (!setCache.get(el).size) {
        setCache.delete(el)
        el.classList.remove(SPECT_CLASS)
        // if (el[_observer]) {
        //   el[_observer].disconnect()
        //   delete el[_observer]
        // }
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
        push.call(observers.slice(-1), set)
        return unsubscribe
      }
    }
  }

  item(n) {
    const set = this.$ || this
    const self = Object.getPrototypeOf(set);
    return n < 0 ? set[self.length + n] : set[n]
  }

  namedItem(name) { return this[name] }

  has(item) { return this._items.has(item) }

  [symbol.dispose]() {
    const set = this.$ || this
    const self = Object.getPrototypeOf(set)
    // const set = this

    if (set._selector) {
      set._selector.forEach(({id, class:cls, name, tag}) => {
        id && ids[id].splice(ids[id].indexOf(self) >>> 0, 1)
        name && names[name].splice(names[name].indexOf(self) >>> 0, 1)
        cls && classes[cls].splice(classes[cls].indexOf(self) >>> 0, 1)
        tag && tags[tag].splice(tags[tag].indexOf(self) >>> 0, 1)
      })
    }
    if (self._animation) {
      const anim = animations[self._selector]
      anim.splice(anim.indexOf(self) >>> 0, 1)
      if (!anim.length) {
        document.removeEventListener('animationstart', anim.onanim)
        delete animations[self._selector]
        if (anim.rules) anim.rules.forEach(rule => {
          let idx = [].indexOf.call(style.sheet.cssRules, rule)
          if (~idx) style.sheet.deleteRule(idx)
        })
      }
    }

    self._channel.close()
    let els = [...set]
    self.length = 0
    els.forEach(el => self.delete(el, true))
  }
}

;(new MutationObserver((list) => {
  const queryAdd = (targets, sets, check) => {
    if (!sets || !targets) return
    ;[].forEach.call(targets.nodeType ? [targets] : targets, target => sets.forEach(set => set.add(target, check)))
  }
  const queryDelete = target => [target.classList.contains(SPECT_CLASS) ? target : null, ...target.getElementsByClassName(SPECT_CLASS)]
    .forEach(node => setCache.has(node) && setCache.get(node).forEach(set => set.delete(node)))

  for (let mutation of list) {
    let { addedNodes, removedNodes, target } = mutation

    // fallback for no-animevents env (like SSR)
    // WARN: O(n*m) or worse performance (insignificant for small docs)
    if (!hasAnimevent) {
      queryDelete(target)
      for (let sel in animations) {
        queryAdd([target, ...target.querySelectorAll(sel)], animations[sel], true)
      }
    }

    if (mutation.type === 'childList') {
      removedNodes.forEach(target => {
        if (target.nodeType !== ELEMENT) return
        queryDelete(target)
      })

      addedNodes.forEach(target => {
        if (target.nodeType !== ELEMENT) return

        // selector-set optimization:
        // instead of walking all registered selectors for each node, we detect which selectors are applicable for the node
        if (target.id) {
          queryAdd(target, ids[target.id])
          // NOTE: <a> and other inlines may not have `getElementById`
          if (target.getElementById) for (let id in ids) queryAdd(target.getElementById(id), ids[id])
        }
        if (target.name) {
          queryAdd(target, names[target.name])
          for (let name in names) queryAdd(target.getElementsByName(name), names[name])
        }
        if (target.className) {
          target.classList.forEach(cls => queryAdd(target, classes[cls]))
          for (let cls in classes) queryAdd(target.getElementsByClassName(cls), classes[cls])
        }
        queryAdd(target, tags[target.tagName])
        for (let tag in tags) queryAdd(target.getElementsByTagName(tag), tags[tag])
      })
    }
  }
}))
.observe(document, {
  childList: true,
  subtree: true,
  attributes: !hasAnimevent
})
