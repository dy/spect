// src/sym.js
var S = Symbol;
var _channel = S("c");
var _items = S("i");
var _delete = S("d");
var _scope = S("s");
var _fn = S("f");
var _selector = S("$");
var _match = S("m");
var _animation = S("a");
var _teardown = S("t");
var _static = _scope;
if (!S.observable)
  S.observable = S("observable");
if (!S.dispose)
  S.dispose = S("dispose");

// v.js
var v_default = (init) => new Ref(init);
var Ref = class {
  constructor(arg) {
    Object.defineProperties(this, {
      observers: {value: []}
    });
    this[0] = arg;
  }
  get value() {
    return this[0];
  }
  set value(val) {
    this[0] = val;
    for (let sub of this.observers) {
      if (typeof sub[_teardown] === "function")
        sub[_teardown]();
      if (sub.next)
        sub[_teardown] = sub.next(val);
    }
  }
  valueOf() {
    return this.value;
  }
  toString() {
    return this.value;
  }
  [Symbol.toPrimitive](hint) {
    return this.value;
  }
  subscribe(next, error, complete) {
    next = next && next.next || next;
    error = next && next.error || error;
    complete = next && next.complete || complete;
    const unsubscribe = () => (this.observers.length && this.observers.splice(this.observers.indexOf(subscription) >>> 0, 1), complete && complete()), subscription = {next, error, complete, unsubscribe, [_teardown]: null};
    this.observers.push(subscription);
    if (this[0] !== void 0)
      subscription[_teardown] = next(this[0]);
    return unsubscribe.unsubscribe = unsubscribe;
  }
  map(mapper) {
    const ref = new Ref();
    this.subscribe((v) => ref.value = mapper(v));
    return ref;
  }
  error(e) {
    this.observers.map((sub) => sub.error && sub.error(e));
  }
  [Symbol.observable]() {
    return this;
  }
  async *[Symbol.asyncIterator]() {
    let resolve, buf = [], p = new Promise((r) => resolve = r), unsub = this.subscribe((v) => (buf.push(v), resolve(), p = new Promise((r) => resolve = r)));
    try {
      while (1)
        yield* buf.splice(0), await p;
    } catch {
    } finally {
      unsub();
    }
  }
  [Symbol.dispose]() {
    this[0] = null;
    const unsubs = this.observers.map((sub) => (typeof sub[_teardown] === "function" && sub[_teardown](), sub.unsubscribe));
    this.observers.length = 0;
    unsubs.map((unsub) => unsub());
  }
};

// $.js
var ELEMENT = 1;
var SPECT_CLASS = "\u{1F441}";
var count = 0;
var ids = {};
var classes = {};
var tags = {};
var names = {};
var animations = {};
var setCache = new WeakMap();
var hasAnimevent = typeof AnimationEvent !== "undefined";
var style = document.head.appendChild(document.createElement("style"));
function __default(scope, selector, fn) {
  if (scope && scope.raw)
    return new $(null, String.raw.apply(null, arguments));
  if (typeof scope === "string")
    return new $(null, scope, selector);
  if (!selector || typeof selector === "function") {
    fn = selector;
    let target = scope;
    if (!target)
      target = [];
    if (target.nodeType)
      target = [target];
    const set = new $(null, null, fn);
    target.forEach((el) => set.add(el));
    return set;
  }
  return new $(scope, selector, fn);
}
var $ = class extends Array {
  constructor(scope, selector, fn) {
    if (typeof scope === "number")
      return Array(scope);
    super();
    this[_channel] = v_default(this);
    this[_items] = new WeakMap();
    this[_delete] = new WeakSet();
    this[_teardown] = new WeakMap();
    this[_scope] = scope;
    this[_fn] = fn;
    if (!selector)
      return;
    const proto = Object.getPrototypeOf(this);
    (scope || document).querySelectorAll(selector).forEach((el) => {
      proto.add.call(this, el);
    });
    const rtokens = /(?:#([\w:-]+)|\[\s*name=['"]?([\w:-]+)['"]?\s*\]|\.([\w:-]+)|([\*\w:-]+))(\[[^\]]+\]|\.[\w:-]+)*$/;
    this[_selector] = selector.split(/\s*,\s*/).map((selector2) => {
      selector2 = new String(selector2);
      const match = selector2.match(rtokens);
      selector2.filter = selector2;
      if (!match)
        return selector2;
      let [str, id, name, cls, tag, filter] = match;
      if (id)
        (ids[selector2.id = id] = ids[id] || []).push(this);
      else if (name)
        (names[selector2.name = name] = names[name] || []).push(this);
      else if (cls)
        (classes[selector2.class = cls] = classes[cls] || []).push(this);
      else if (tag)
        (selector2.tag = tag = tag.toUpperCase(), tags[tag] = tags[tag] || []).push(this);
      if (filter)
        selector2.filter = selector2.slice(0, match.index) + selector2.slice(-filter.length);
      else if (!match.index)
        delete selector2.filter;
      return selector2;
    });
    this[_match] = this[_selector].some((sel) => sel.filter);
    if (!hasAnimevent || !this[_selector].every((sel) => sel.tag && !sel.filter)) {
      let anim = animations[this[_selector]];
      if (!anim) {
        const {sheet} = style, {cssRules} = sheet;
        anim = animations[this[_selector]] = [];
        anim.id = SPECT_CLASS + "-" + (count++).toString(36);
        sheet.insertRule(`@keyframes ${anim.id}{}`, cssRules.length);
        sheet.insertRule(`${this[_selector].map((sel) => sel + `:not(.${anim.id})`)}{animation:${anim.id}}`, cssRules.length);
        sheet.insertRule(`.${anim.id}{animation:${anim.id}}`, cssRules.length);
        sheet.insertRule(`${this[_selector].map((sel) => sel + `.${anim.id}`)}{animation:unset;animation:revert}`, cssRules.length);
        anim.rules = [].slice.call(cssRules, -4);
        anim.onanim = (e) => {
          if (e.animationName !== anim.id)
            return;
          e.stopPropagation();
          e.preventDefault();
          let {target} = e;
          if (!target.classList.contains(anim.id)) {
            target.classList.add(anim.id);
            anim.forEach((set) => Object.getPrototypeOf(set).add.call(set, target, false));
          } else {
            target.classList.remove(anim.id);
            anim.forEach((set) => set.delete(target));
          }
        };
        document.addEventListener("animationstart", anim.onanim, true);
      }
      this[_animation] = anim.id;
      anim.push(this);
    }
  }
  add(el, check = this[_match]) {
    if (!el)
      return;
    if (this[_items].has(el))
      return;
    if (check) {
      if (!el.matches(this[_selector]))
        return;
    }
    if (this[_scope]) {
      if (this[_scope] === el)
        return;
      if (this[_scope].nodeType) {
        if (!this[_scope].contains(el))
          return;
      } else if ([].every.call(this[_scope], (scope) => !scope.contains(el)))
        return;
    }
    this.push(el);
    this[_items].set(el, [el.id, el.name]);
    if (el.name)
      this[el.name] = el;
    if (el.id)
      this[el.id] = el;
    if (this[_delete].has(el))
      this[_delete].delete(el);
    if (setCache.has(el) && setCache.get(el).has(this))
      return;
    if (!setCache.has(el))
      setCache.set(el, new Set());
    setCache.get(el).add(this);
    el.classList.add(SPECT_CLASS);
    this[_teardown].set(el, this[_fn] && this[_fn](el));
    this[_channel].value = this;
  }
  delete(el, immediate = false) {
    if (!this[_items].has(el))
      return;
    if (this.length)
      this.splice(this.indexOf(el >>> 0, 1), 1);
    const [id, name] = this[_items].get(el);
    if (name)
      delete this[name];
    if (id)
      delete this[id];
    this[_items].delete(el);
    this[_delete].add(el);
    const del = () => {
      if (!this[_delete].has(el))
        return;
      this[_delete].delete(el);
      if (!setCache.has(el))
        return;
      const teardown = this[_teardown].get(el);
      if (teardown) {
        if (teardown.call)
          teardown(el);
        else if (teardown.then)
          teardown.then((fn) => fn && fn.call && fn());
      }
      this[_teardown].delete(el);
      this[_channel].value = this;
      setCache.get(el).delete(this);
      if (!setCache.get(el).size) {
        setCache.delete(el);
        el.classList.remove(SPECT_CLASS);
      }
    };
    if (immediate)
      del();
    else
      requestAnimationFrame(del);
  }
  [Symbol.observable]() {
    return this[_channel];
  }
  item(n2) {
    return n2 < 0 ? this[this.length + n2] : this[n2];
  }
  namedItem(name) {
    return this[name];
  }
  has(item) {
    return this[_items].has(item);
  }
  [Symbol.dispose]() {
    const self = this;
    if (self[_selector]) {
      self[_selector].forEach(({id, class: cls, name, tag}) => {
        id && ids[id].splice(ids[id].indexOf(self) >>> 0, 1);
        name && names[name].splice(names[name].indexOf(self) >>> 0, 1);
        cls && classes[cls].splice(classes[cls].indexOf(self) >>> 0, 1);
        tag && tags[tag].splice(tags[tag].indexOf(self) >>> 0, 1);
      });
    }
    if (self[_animation]) {
      const anim = animations[self[_selector]];
      anim.splice(anim.indexOf(self) >>> 0, 1);
      if (!anim.length) {
        document.removeEventListener("animationstart", anim.onanim);
        delete animations[self[_selector]];
        if (anim.rules)
          anim.rules.forEach((rule) => {
            let idx = [].indexOf.call(style.sheet.cssRules, rule);
            if (~idx)
              style.sheet.deleteRule(idx);
          });
      }
    }
    self[_channel][Symbol.dispose]();
    let els = [...self];
    self.length = 0;
    els.forEach((el) => self.delete(el, true));
  }
};
var queryAdd = (targets, sets, check) => {
  if (!sets || !targets)
    return;
  [].forEach.call(targets.nodeType ? [targets] : targets, (target) => sets.forEach((set) => Object.getPrototypeOf(set).add.call(set, target, check)));
};
var queryDelete = (target) => [target.classList.contains(SPECT_CLASS) ? target : null, ...target.getElementsByClassName(SPECT_CLASS)].forEach((node) => setCache.has(node) && setCache.get(node).forEach((set) => set.delete(node)));
new MutationObserver((list) => {
  for (let mutation of list) {
    let {addedNodes, removedNodes, target} = mutation;
    if (!hasAnimevent) {
      queryDelete(target);
      for (let sel in animations)
        queryAdd([target, ...target.querySelectorAll(sel)], animations[sel], true);
    }
    removedNodes.forEach((target2) => target2.nodeType === ELEMENT && queryDelete(target2));
    addedNodes.forEach((target2) => {
      if (target2.nodeType !== ELEMENT)
        return;
      if (target2.id) {
        queryAdd(target2, ids[target2.id]);
        if (target2.getElementById)
          for (let id in ids)
            queryAdd(target2.getElementById(id), ids[id]);
      }
      if (target2.name) {
        queryAdd(target2, names[target2.name]);
        for (let name in names)
          queryAdd(target2.getElementsByName(name), names[name]);
      }
      if (target2.className) {
        target2.classList.forEach((cls) => queryAdd(target2, classes[cls]));
        for (let cls in classes)
          queryAdd(target2.getElementsByClassName(cls), classes[cls]);
      }
      queryAdd(target2, tags[target2.tagName]);
      for (let tag in tags)
        queryAdd(target2.getElementsByTagName(tag), tags[tag]);
    });
  }
}).observe(document, {
  childList: true,
  subtree: true,
  attributes: !hasAnimevent
});

// src/htm.js
var n = function(t2, s, r, e) {
  var u;
  s[0] = 0;
  for (var h2 = 1; h2 < s.length; h2++) {
    var p = s[h2++], a = s[h2] ? (s[0] |= p ? 1 : 2, r[s[h2++]]) : s[++h2];
    p === 3 ? e[0] = a : p === 4 ? e[1] = Object.assign(e[1] || {}, a) : p === 5 ? (e[1] = e[1] || {})[s[++h2]] = a : p === 6 ? e[1][s[++h2]] += a + "" : p ? (u = t2.apply(a, n(t2, a, r, ["", null])), e.push(u), a[0] ? s[0] |= 2 : (s[h2 - 2] = 0, s[h2] = u)) : e.push(a);
  }
  return e;
};
var t = new Map();
function htm_default(s) {
  var r = t.get(this);
  return r || (r = new Map(), t.set(this, r)), (r = n(this, r.get(s) || (r.set(s, r = function(n2) {
    for (var t2, s2, r2 = 1, e = "", u = "", h2 = [0], p = function(n3) {
      r2 === 1 && (n3 || (e = e.replace(/^\s*\n\s*|\s*\n\s*$/g, ""))) ? h2.push(0, n3, e) : r2 === 3 && (n3 || e) ? (h2.push(3, n3, e), r2 = 2) : r2 === 2 && e === "..." && n3 ? h2.push(4, n3, 0) : r2 === 2 && e && !n3 ? h2.push(5, 0, true, e) : r2 >= 5 && ((e || !n3 && r2 === 5) && (h2.push(r2, 0, e, s2), r2 = 6), n3 && (h2.push(r2, n3, 0, s2), r2 = 6)), e = "";
    }, a = 0; a < n2.length; a++) {
      a && (r2 === 1 && p(), p(a));
      for (var l = 0; l < n2[a].length; l++)
        t2 = n2[a][l], r2 === 1 ? t2 === "<" ? (p(), h2 = [h2], r2 = 3) : e += t2 : r2 === 4 ? e === "--" && t2 === ">" ? (r2 = 1, e = "") : e = t2 + e[0] : u ? t2 === u ? u = "" : e += t2 : t2 === '"' || t2 === "'" ? u = t2 : t2 === ">" ? (p(), r2 = 1) : r2 && (t2 === "=" ? (r2 = 5, s2 = e, e = "") : t2 === "/" && (r2 < 5 || n2[a][l + 1] === ">") ? (p(), r2 === 3 && (h2 = h2[0]), r2 = h2, (h2 = h2[0]).push(2, 0, r2), r2 = 0) : t2 === " " || t2 === "	" || t2 === "\n" || t2 === "\r" ? (p(), r2 = 2) : e += t2), r2 === 3 && e === "!--" && (r2 = 4, h2 = h2[0]);
    }
    return p(), h2;
  }(s)), r), arguments, [])).length > 1 ? r : r[0];
}

// src/util.js
var S2 = Symbol;
var sube = (target, fn) => {
  let unsub, stop;
  if (target[S2.observable])
    unsub = target[S2.observable]().subscribe({next: fn});
  else if (target.subscribe)
    unsub = target.subscribe(fn);
  else if (target[S2.asyncIterator]) {
    unsub = () => stop = true;
    (async () => {
      for await (target of target) {
        if (stop)
          break;
        fn(target);
      }
    })();
  } else if (target.then)
    target.then(fn);
  else if (typeof target === "function" && target.set)
    unsub = target(fn);
  return unsub;
};
var primitive = (val) => !val || typeof val === "string" || typeof val === "boolean" || typeof val === "number" || (typeof val === "object" ? val instanceof RegExp || val instanceof Date : typeof val !== "function");
var observable = (arg) => !primitive(arg) && !!(arg[S2.observable] || arg[S2.asyncIterator] || typeof arg === "function" && arg.set || arg.next || arg.then);

// h.js
var TEXT = 3;
var cache = new WeakSet();
var ctx = {init: false};
var h = hyperscript.bind(ctx);
function h_default(statics) {
  if (!Array.isArray(statics))
    return h(...arguments);
  let result, count2 = 1;
  if (!cache.has(statics))
    count2++, cache.add(statics);
  while (count2--) {
    ctx.init = count2 ? true : false;
    result = htm_default.apply(h, count2 ? [statics] : arguments);
  }
  return primitive(result) ? document.createTextNode(result == null ? "" : result) : Array.isArray(result) ? h(document.createDocumentFragment(), null, ...result) : result[_static] ? result.cloneNode(true) : result;
}
function hyperscript(tag, props, ...children) {
  const init = this.init;
  if (typeof tag === "string") {
    if (/#|\./.test(tag)) {
      let id, cls;
      [tag, id] = tag.split("#");
      if (id)
        [id, ...cls] = id.split(".");
      else
        [tag, ...cls] = tag.split(".");
      if (id || cls.length) {
        props = props || {};
        if (id)
          props.id = id;
        if (cls.length)
          props.class = cls;
      }
    }
    tag = document.createElement(tag);
    if (init) {
      tag[_static] = true;
      for (let name in props)
        attr(tag, name, props[name]);
      tag.append(...flat(children));
      return tag;
    }
  } else if (init)
    return;
  else if (typeof tag === "function") {
    tag = tag({children, ...props});
    if (Array.isArray(tag)) {
      let frag = document.createDocumentFragment();
      frag.append(...tag);
      tag = frag;
    }
    return tag;
  } else if (tag[Symbol.dispose])
    tag[Symbol.dispose]();
  let teardown = [], subs, i, child;
  for (let name in props) {
    let value = props[name];
    if (typeof value === "string")
      value = value.replace(/false|null|undefined/g, "");
    if (primitive(value))
      attr(tag, name, value);
    else if (observable(value))
      teardown.push(sube(value, (v) => attr(tag, name, v)));
    else if (name === "style") {
      for (let s in value) {
        let v = value[s];
        if (observable(v))
          teardown.push(sube(v, (v2) => tag.style.setProperty(s, v2)));
        else {
          let match = v.match(/(.*)\W+!important\W*$/);
          if (match)
            tag.style.setProperty(s, match[1], "important");
          else
            tag.style.setProperty(s, v);
        }
      }
    } else
      attr(tag, name, value);
  }
  for (i = 0; i < children.length; i++)
    if (child = children[i]) {
      if (child[_static])
        children[i] = child.cloneNode(true);
      else if (observable(child))
        teardown.push((subs || (subs = []))[i] = child), child = document.createTextNode("");
    }
  if (!tag.childNodes.length)
    tag.append(...flat(children));
  else
    merge(tag, tag.childNodes, flat(children));
  if (subs)
    subs.map((sub, i2) => sube(sub, (child2) => (children[i2] = child2, merge(tag, tag.childNodes, flat(children)))));
  if (teardown.length)
    tag[_teardown] = teardown;
  tag[Symbol.dispose] = dispose;
  return tag;
}
function dispose() {
  if (this[_teardown])
    for (let fn of this[_teardown])
      fn();
  this[_teardown] = null;
}
var flat = (children) => {
  let out = [], i = 0, item;
  for (; i < children.length; ) {
    if ((item = children[i++]) != null) {
      if (primitive(item) || item.nodeType)
        out.push(item);
      else if (item[Symbol.iterator])
        for (item of item)
          out.push(item);
    }
  }
  return out;
};
var same = (a, b) => a === b || a && b && a.nodeType === TEXT && b.nodeType === TEXT && a.data === b.data;
var merge = (parent, a, b, end = null) => {
  let i = 0, cur, next, bi, n2 = b.length, m = a.length;
  while (i < n2 && i < m && same(a[i], b[i]))
    i++;
  while (i < n2 && i < m && same(b[n2 - 1], a[m - 1]))
    end = b[--m, --n2];
  if (i == m)
    while (i < n2)
      insert(parent, b[i++], end);
  else {
    cur = a[i];
    while (i < n2) {
      bi = b[i++], next = cur ? cur.nextSibling : end;
      if (same(cur, bi))
        cur = next;
      else if (i < n2 && same(b[i], next))
        replace(parent, cur, bi), cur = next;
      else
        insert(parent, bi, cur);
    }
    while (cur != end)
      next = cur.nextSibling, parent.removeChild(cur), cur = next;
  }
  return b;
};
var insert = (parent, a, before) => {
  if (a != null) {
    if (primitive(a))
      parent.insertBefore(document.createTextNode(a), before);
    else
      parent.insertBefore(a, before);
  }
};
var replace = (parent, from, to, end) => {
  if (to != null) {
    if (primitive(to))
      if (from.nodeType === TEXT)
        from.data = to;
      else
        from.replaceWith(to);
    else if (to.nodeType)
      parent.replaceChild(to, from);
    else
      merge(parent, [from], to, end);
  }
};
var attr = (el, k, v, desc) => (el[k] !== v && (!(k in el.constructor.prototype) || !(desc = Object.getOwnPropertyDescriptor(el.constructor.prototype, k)) || desc.set) && (el[k] = v), v === false || v == null ? el.removeAttribute(k) : typeof v !== "function" && el.setAttribute(k, v === true ? "" : typeof v === "number" || typeof v === "string" ? v : k === "class" && Array.isArray(v) ? v.filter(Boolean).join(" ") : k === "style" && v.constructor === Object ? (k = v, v = Object.values(v), Object.keys(k).map((k2, i) => `${k2}: ${v[i]};`).join(" ")) : ""));

// index.js
var spect_default = __default;
export {
  __default as $,
  spect_default as default,
  h_default as h,
  v_default as v
};
//# sourceMappingURL=spect.js.map
