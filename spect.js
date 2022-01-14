var v = init => new Ref(init);

const _teardown = Symbol();

class Ref {
  #observers=[]

  constructor(init){ this[0] = init; }

  get value() { return this[0] }
  set value(val) {
    this[0] = val;
    for (let sub of this.#observers) {
      if (typeof sub[_teardown] === 'function') sub[_teardown]();
      if (sub.next) (sub[_teardown] = sub.next(val));
    }
  }

  valueOf() {return this.value}
  toString() {return this.value}
  [Symbol.toPrimitive](hint) {return this.value}

  // FIXME: replace with 0b?
  subscribe(next, error, complete) {
    next = next && next.next || next;
    error = next && next.error || error;
    complete = next && next.complete || complete;

    const unsubscribe = () => (
      this.#observers.length && this.#observers.splice(this.#observers.indexOf(subscription) >>> 0, 1),
      complete && complete()
    ),
    subscription = { next, error, complete, unsubscribe };
    this.#observers.push(subscription);

    if ( this[0] !== undefined ) subscription[_teardown] = next(this[0]);

    return unsubscribe.unsubscribe = unsubscribe
  }

  map(mapper) {
    const ref = new Ref();
    this.subscribe(v => ref.value = mapper(v));
    return ref
  }

  error(e) {this.#observers.map(sub => sub.error && sub.error(e));}

  [Symbol.observable](){return this}

  async *[Symbol.asyncIterator]() {
    let resolve, buf = [], p = new Promise(r => resolve = r),
      unsub = this.subscribe(v => ( buf.push(v), resolve(), p = new Promise(r => resolve = r) ));
    try { while (1) yield* buf.splice(0), await p; }
    catch {}
    unsub();
  }

  dispose() {
    this[0] = null;
    const unsubs = this.#observers.map(sub => ((typeof sub[_teardown] === 'function') && sub[_teardown](), sub.unsubscribe));
    this.#observers.length = 0;
    unsubs.map(unsub => unsub());
  }
  [Symbol.dispose]() { return this.dispose() }
}

const ELEMENT = 1, SPECT_CLASS = '👁';

let count = 0, ids = {}, classes = {}, tags = {}, names = {}, animations = {}, setCache = new WeakMap,
    hasAnimevent = typeof AnimationEvent !== 'undefined',
    style = document.head.appendChild(document.createElement('style'));


// FIXME: use Symbol.species to fix add/map/etc?

function index (scope, selector, fn) {
  // spect`#x`
  if (scope && scope.raw) return new $(null, String.raw.apply(null, arguments))
  // spect(selector, fn)
  if (typeof scope === 'string') return new $(null, scope, selector)
  // spect(target, fn)
  if (!selector || typeof selector === 'function') {
    fn = selector;
    let target = scope;
    if (!target) target = [];
    if (target.nodeType) target = [target];

    const set = new $(null, null, fn);
    target.forEach(el => set.add(el));
    return set
  }

  return new $(scope, selector, fn)
}

class $ extends Array {
  #channel
  #items
  #delete
  #teardown
  #scope
  #callback
  #selector
  #animation
  #match
  constructor(scope, selector, fn){
    // self-call, like splice, map, slice etc. fall back to array
    if (typeof scope === 'number') return Array(scope)

    super();

    this.#channel = v(this);
    this.#items = new WeakMap;
    this.#delete = new WeakSet;
    this.#teardown = new WeakMap;
    this.#scope = scope;
    this.#callback = fn;

    // ignore non-selector collections
    if (!selector) return

    // init existing elements
    const proto = Object.getPrototypeOf(this)
    ;(scope || document).querySelectorAll(selector).forEach(el => {proto.add.call(this, el);});

    // if last selector part is simple (id|name|class|tag), followed by classes or attrs - index that
    // #a[x][y], [name="e"].x, .x.y, *, a-b-c:x - simple
    // a b - not simple
    // a.b.c - simple, but filter is .b.c
    const rtokens = /(?:#([\w:-]+)|\[\s*name=['"]?([\w:-]+)['"]?\s*\]|\.([\w:-]+)|([\*\w:-]+))(\[[^\]]+\]|\.[\w:-]+)*$/;

    this.#selector = selector.split(/\s*,\s*/).map(selector => {
      selector = new String(selector);

      const match = selector.match(rtokens);
      selector.filter = selector;
      if (!match) return selector // skip indexing

      let [str, id, name, cls, tag, filter] = match;
      if (id) (ids[selector.id = id] = ids[id] || []).push(this);
      else if (name) (names[selector.name = name] = names[name] || []).push(this);
      else if (cls) (classes[selector.class = cls] = classes[cls] || []).push(this);
      else if (tag) (selector.tag = tag = tag.toUpperCase(), tags[tag] = tags[tag] || []).push(this);

      if (filter) selector.filter = selector.slice(0, match.index) + selector.slice(-filter.length);
      // `match.index` === 0 means selector is simple and need no match check
      else if (!match.index) delete selector.filter;

      return selector
    });
    this.#match = this.#selector.some(sel => sel.filter);

    // complex selectors are handled via anim events (technique from insertionQuery).
    // Cases:
    // - dynamically added attributes so that existing nodes match (we don't observe attribs in mutation obserever)
    // - complex selectors, including `*` - we avoid > O(c) sync mutations check
    // NOTE: only connected scope supports anim observer
    if (!hasAnimevent || !this.#selector.every(sel => sel.tag && !sel.filter)) {
      let anim = animations[this.#selector];
      if (!anim) {
        const { sheet } = style, { cssRules } = sheet;
        anim = animations[this.#selector] = [];
        anim.id = SPECT_CLASS + '-' + (count++).toString(36);
        sheet.insertRule(`@keyframes ${ anim.id }{}`, cssRules.length);
        sheet.insertRule(`${ this.#selector.map(sel => sel + `:not(.${ anim.id })`) }{animation:${ anim.id }}`, cssRules.length);
        sheet.insertRule(`.${ anim.id }{animation:${ anim.id }}`, cssRules.length);
        sheet.insertRule(`${ this.#selector.map(sel => sel + `.${ anim.id }`) }{animation:unset;animation:revert}`, cssRules.length);
        anim.rules = [].slice.call(cssRules, -4);

        anim.onanim = e => {
          if (e.animationName !== anim.id) return
          e.stopPropagation();
          e.preventDefault();

          let {target} = e;

          if (!target.classList.contains(anim.id)) {
            target.classList.add(anim.id);
            anim.forEach(set => Object.getPrototypeOf(set).add.call(set, target, false));
          }
          else {
            target.classList.remove(anim.id);
            anim.forEach(set => set.delete(target));
          }
        };
        document.addEventListener('animationstart', anim.onanim, true);
      }
      this.#animation = anim.id;
      anim.push(this);
    }
  }

  add(el, check=this.#match) {
    if (!el) return

    // ignore existing
    if (this.#items.has(el)) return

    // ignore not-matching
    if (check) if (!el.matches(this.#selector)) return

    // ignore out-of-scope
    if (this.#scope) {
      if (this.#scope === el) return
      if (this.#scope.nodeType) { if (!this.#scope.contains(el)) return }
      else if ([].every.call(this.#scope, scope => !scope.contains(el))) return
    }

    // track collection
    this.push(el);
    this.#items.set(el, [el.id, el.name]);
    if (el.name) this[el.name] = el;
    if (el.id) this[el.id] = el;

    // cancel planned delete
    if (this.#delete.has(el)) this.#delete.delete(el);

    // ignore existing items
    if (setCache.has(el) && setCache.get(el).has(this)) return

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
    if (!setCache.has(el)) setCache.set(el, new Set);

    // mark element
    setCache.get(el).add(this);
    el.classList.add(SPECT_CLASS);

    // notify
    this.#teardown.set(el, this.#callback && this.#callback(el));
    this.#channel.value = this;
  }

  delete(el, immediate = false) {
    if (!this.#items.has(el)) return

    // remove element from list sync
    if (this.length) this.splice(this.indexOf(el >>> 0, 1), 1);
    const [id, name] = this.#items.get(el);
    if (name) delete this[name];
    if (id) delete this[id];
    this.#items.delete(el);
    // plan destroy async (can be re-added)
    this.#delete.add(el);

    const del = () => {
      if (!this.#delete.has(el)) return
      this.#delete.delete(el);

      if (!setCache.has(el)) return
      const teardown = this.#teardown.get(el);
      if (teardown) {
        if (teardown.call) teardown(el);
        else if (teardown.then) teardown.then(fn => fn && fn.call && fn());
      }
      this.#teardown.delete(el);
      this.#channel.value = this;

      setCache.get(el).delete(this);
      if (!setCache.get(el).size) {
        setCache.delete(el);
        el.classList.remove(SPECT_CLASS);
        // if (el[_observer]) {
        //   el[_observer].disconnect()
        //   delete el[_observer]
        // }
      }
    };

    if (immediate) del();
    else requestAnimationFrame(del);
  }

  [Symbol.observable]() {
    return this.#channel
  }

  item(n) { return n < 0 ? this[this.length + n] : this[n] }

  namedItem(name) { return this[name] }

  has(item) { return this.#items.has(item) }

  dispose() {
    if (this.#selector) {
      this.#selector.forEach(({id, class:cls, name, tag}) => {
        id && ids[id].splice(ids[id].indexOf(this) >>> 0, 1);
        name && names[name].splice(names[name].indexOf(this) >>> 0, 1);
        cls && classes[cls].splice(classes[cls].indexOf(this) >>> 0, 1);
        tag && tags[tag].splice(tags[tag].indexOf(this) >>> 0, 1);
      });
    }
    if (this.#animation) {
      const anim = animations[this.#selector];
      anim.splice(anim.indexOf(this) >>> 0, 1);
      if (!anim.length) {
        document.removeEventListener('animationstart', anim.onanim);
        delete animations[this.#selector];
        if (anim.rules) anim.rules.forEach(rule => {
          let idx = [].indexOf.call(style.sheet.cssRules, rule);
          if (~idx) style.sheet.deleteRule(idx);
        });
      }
    }

    this.#channel[Symbol.dispose]();
    let els = [...this];
    this.length = 0;
    els.forEach(el => this.delete(el, true));
  }

  [Symbol.dispose]() { return this.dispose }
}

const queryAdd = (targets, sets, check) => {
  if (!sets || !targets) return
  ;[].forEach.call(targets.nodeType ? [targets] : targets, target => sets.forEach(set => Object.getPrototypeOf(set).add.call(set, target, check)));
},
queryDelete = target => [target.classList.contains(SPECT_CLASS) ? target : null, ...target.getElementsByClassName(SPECT_CLASS)]
  .forEach(node => setCache.has(node) && setCache.get(node).forEach(set => set.delete(node)))

;(new MutationObserver((list) => {
  for (let mutation of list) {
    let { addedNodes, removedNodes, target } = mutation;

    // fallback for no-animevents env (like SSR)
    // WARN: O(n*m) or worse performance (insignificant for small docs)
    if (!hasAnimevent) {
      queryDelete(target);
      for (let sel in animations) queryAdd([target, ...target.querySelectorAll(sel)], animations[sel], true);
    }

    removedNodes.forEach(target => target.nodeType === ELEMENT && queryDelete(target));

    addedNodes.forEach(target => {
      if (target.nodeType !== ELEMENT) return

      // selector-set optimization:
      // instead of walking all registered selectors for each node, we detect which selectors are applicable for the node
      if (target.id) {
        queryAdd(target, ids[target.id]);
        // NOTE: <a> and other inlines may not have `getElementById`
        if (target.getElementById) for (let id in ids) queryAdd(target.getElementById(id), ids[id]);
      }
      if (target.name) {
        queryAdd(target, names[target.name]);
        for (let name in names) queryAdd(target.getElementsByName(name), names[name]);
      }
      if (target.className) {
        target.classList.forEach(cls => queryAdd(target, classes[cls]));
        for (let cls in classes) queryAdd(target.getElementsByClassName(cls), classes[cls]);
      }
      queryAdd(target, tags[target.tagName]);
      for (let tag in tags) queryAdd(target.getElementsByTagName(tag), tags[tag]);
    });
  }
}))
.observe(document, {
  childList: true,
  subtree: true,
  attributes: !hasAnimevent
});

export { index as default };
