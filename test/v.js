import t from 'tst'
import { v } from '../index.js'
import { tick, frame, time } from 'wait-please'
import Observable from 'zen-observable/esm'
import observable from './observable.js'

// value
t('v: readme', async t => {
  let log = []
  let v1 = v(0)

  // get
  t.is(v1(), 0)

  // subscribe
  let unsub = v1(value => {
    log.push(value)
    return () => {
      log.push('-')
    }
  })

  // set
  v1(1)
  t.is(v1(), 1)
  t.is(log, [0, '-', 1])
  unsub()

  // from value
  let v2 = v(v1, v1 => v1 * 2)
  log = []
  v2(v2 => log.push(v2))
  t.is(v2(), 2) // > 2
  t.is(v1(), 1)
  t.is(log, [2])
  v1(1)
  t.is(log, [2, 2])

  // gotcha
  v(v2)
  t.is(v1(), 1)
  t.is(v2(), 2)
  v([v2, v1])
  t.is(v1(), 1)
  t.is(v2(), 2)

  // from multiple values
  let v3 = v([v1, v2], ([v1, v2]) => v1 + v2)
  t.is(v3(), 3, 'from multiple values') // > 3

  // run effect on every change
  log = []
  v([v1, v2, v3])(([v1, v2, v3]) => {
    log.push(v1, v2, v3)
    return () => log.push('-')
  })
  t.is(log, [1, 2, 3])
  // > 1, 2, 3

  // from object
  let item = { done: false }
  let v5 = v(item)
  log = []
  v5(v => log.push({...v}))
  t.is(v5.done(), false, 'internal props') // false
  t.is(log, [{done: false}], 'emit props')

  // set property, notify
  item.done = true
  t.is(v5().done, true) // false
  t.is(log, [{done: false}, {done: true}])

  // initialize value
  let v6 = v(() => v5)
  t.is(v6(), v5) // v5

  // dispose
  ;[v6, v5, v3, v2, v1].map(v => v[Symbol.dispose]())
})
t('v: core', async t => {
  let s = v(0)

  // observer 1
  let log = []
  // ;(async () => { for await (let value of s) log.push(value) })()
  s(value => log.push(value))

  t.equal(+s, 0, 'toPrimitive')
  t.equal(s.valueOf(), 0, 'valueOf')
  t.equal(s.toString(), 0, 'toString')

  t.equal(s(), 0, 's()')

  await tick()
  t.deepEqual(log, [0], 'should publish the initial state')

  s(1)
  t.equal(+s, 1, 'state.current = value')

  s(2)
  t.equal(+s, 2, 'state(value)')
  t.equal(s(), 2, 'state(value)')

  s(s() + 1)
  t.equal(s(), 3, 'state(state + value)')

  // observer 2
  let log2 = []
  // ;(async () => { for await (let value of s) log2.push(value) })()
  s(value => log2.push(value))

  await tick(8)
  t.deepEqual(log.slice(-1), [3], 'should track and notify first tick changes')
  await tick(8)
  t.deepEqual(log2, [3], 'should properly init set')
  s(4)
  await tick(8) // why 4 ticks delay?
  t.deepEqual(log.slice(-1), [4], 'arbitrary change 1')
  s(5)
  await tick(8)
  t.deepEqual(log.slice(-1), [5], 'arbitrary change 2')

  t.deepEqual(log2.slice(-1), [5], 'secondary observer is fine')

  t.end()
})
t('v: should not expose technical symbols', async t => {
  let s = v({x: 1})
  let log = []
  for(let p in s()) {
    log.push(p)
  }
  t.is(log, ['x'])
})
t('v: function/other state gets subscribed', async t => {
  let s = v(1)
  let s2 = v(s)

  t.is(s2(), 1)
  s(2)
  t.is(s2(), 2)
})
t('v: v to v', t => {
  const a = v(0), b = v()
  a(b)
  t.is(a(), 0)
  t.is(b(), 0)
})
t('v: subscribe teardown', t => {
  const a = v()
  const log = []
  a(value => {
    log.push('in', value)
    return () => log.push('out', value)
  })
  t.is(log, [])
  a(0)
  t.is(log, ['in', 0])
  a(1)
  t.is(log, ['in', 0, 'out', 0, 'in', 1])
})
t('v: multiple subscriptions should not inter-trigger', async t => {
  let value = v(0)
  let log1 = [], log2 = [], log3 = []
  value(v => log1.push(v))
  value(v => log2.push(v))
  t.is(log1, [0])
  t.is(log2, [0])
  value(1)
  t.is(log1, [0, 1])
  t.is(log2, [0, 1])
  value(v => log3.push(v))
  t.is(log1, [0, 1])
  t.is(log2, [0, 1])
  t.is(log3, [1])
  value(2)
  t.is(log1, [0, 1, 2])
  t.is(log2, [0, 1, 2])
  t.is(log3, [1, 2])
})
t('v: mapper should be called once on group deps', async t => {
  let a=v(0), b=v(1), log = []
  v([a,b], (args) => log.push([...args]))
  t.is(log, [[0, 1]])
})
t('v: stores arrays with observables', async t => {
  let a = v(() => [])
  t.is(a(), [])
  a([1])
  t.is(a(), [1])
  a([1, 2])
  t.is(a(), [1, 2])
  a([])
  t.is(a(), [])

  let b = v(0)
  a = v([b])
  t.is(a(), [0])
  b(1)
  t.is(a(), [1])
  a([b()])
  t.is(a(), [1])
})
t('v: simple unmap', async t => {
  let a = v(1, v => v + 1, v => v - 1)
  t.is(a(), 1)
  a(2)
  t.is(a(), 2)
  a(3)
  t.is(a(), 3)
})
t('v: object deps', async t => {
  let x = v(1), y = v(1)
  let o = {x, y}
  let log = []
  v(o, ({x, y}) =>{
    log.push(x, y)
  })
  t.is(log, [1,1])
  x(2)
  t.is(log, [1,1, 2,1])
  y(2)
  t.is(log, [1,1, 2,1, 2,2])
})
t('v: recursion', async t => {
  let x = {a: 1}
  x.x = x
  let vx = v(x)
  t.is(vx().a, 1)
})
t('v: internal observers are preserved', async t => {
  // NOTE: we preserve internal observers to let object props be rewritable
  // DENOTE: internal objects/arrays are expected to be non-changeable props, only primitives can be rewritable
  let x = [{x: v(0)}]
  let log = []
  v(x)(v => log.push(v))
  t.is(log, [[{x: 0}]])
})
t('v: initializer', async t => {
  let a = v(0), b = v(() => a), c = v(0, (v) => v + 2, (v) => v - 2)
  t.is(b(), a)

  a(1)
  t.is(a(), 1)

  b(2)
  t.is(b(), 2)

  t.is(c(), 0)
  c(4)
  t.is(c(), 4)
})
t('v: stringify', async t => {
  let v1 = v(1), v2 = v({x:1})
  t.is(JSON.stringify(v1()), '1')
  t.is(JSON.stringify(v2()), `{"x":1}`)
})
t('v: propagates internal item updates', async t => {
  let a = v(0), deps = {a, x: 1}, b = v(deps)
  let log = []
  let unb = b(v => log.push({...v}))
  t.is(log, [{x: 1, a: 0}])

  a(1)
  t.is(log, [{x: 1, a: 0}, {x: 1, a: 1}])

  deps.x = 2
  t.is(log, [{x: 1, a: 0}, {x: 1, a: 1}, {x: 2, a: 1}])

  let c = v({b})
  log = []
  c(v => log.push(v))
  t.is(log, [{b: {x:2, a: 1}}])

  unb()
  log = []
  a(2)
  t.is(log, [{b: {x:2, a: 2}}])
})
t('v: deep propagate internal props updates', async t => {
  let a = v(0), b = v([[a]])
  let log
  b(v => log = v)
  t.is(log, [[0]])

  a(1)
  t.is(log, [[1]])
})
t('v: push multiple values', async t => {
  let x = v()
  let log = []
  x((a,b) => log.push(a, b))
  t.is(log, [])
  x(1,2,3)
  t.is(log, [1,2])
  t.is(x(), 1)
})
t('v: diff object', async t => {
  let x = v({x: 1, y: 2})
  let log = []
  x((vals, diff) => log.push(diff))
  t.is(log, [{x:1, y:2}])
  x({x: 2})
  t.is(x(), {x:2, y:2})
  t.is(log.slice(-1), [{x: 2}])
})
t('v: diff array', async t => {
  let x = v([1, 2])
  let log = []
  x((vals, diff) => log.push(diff))
  t.is(log, [[1,2]])
  x({1:1})
  t.is(x(), [1,1])
  t.is(log.slice(-1), [{1:1}])
})
t('v: repeated init', async t => {
  let o = {x:1}, log = []
  let o1 = v(o, vals => log.push(vals))
  let o2 = v(o, vals => log.push(vals))
  t.is(log, [{x:1}, {x:1}])
  log = []
  o.x = 2
  t.is(log, [{x:2}, {x:2}])

  log = []
  o2[Symbol.dispose]()
  o.x = 3
  t.is(log, [{x: 3}])

  log = []
  o1[Symbol.dispose]()
  o.x = 4
  t.is(log, [])
})
t('v: template literals', async t => {
  let b = v(0), s = v`a${b}c`
  t.is(s(), `a0c`)
  b(1)
  t.is(s(), `a1c`)
})
t('v: reserved words', async t => {
  let s = v({name: 1, arguments: 2})
  t.is(s(), {name:1, arguments: 2})
})

// from
t('v: from promise', async t => {
  let log = []

  let vp = v(time(10).then(() => 1))
  vp(v => log.push(v))

  t.is(vp(), undefined)
  await time(10)
  t.is(vp(), 1)
  t.is(log, [1])

  vp(time(10).then(() => 2))
  t.is(vp(), undefined)
  await time(10)
  t.is(vp(), 2)
  t.is(log, [1, 2])
})
t('v: from promise / observable / observ', async t => {
  let p = new Promise(r => setTimeout(() => r(2), 10))
  let O = new Observable(obs => setTimeout(() => obs.next(3), 20))
  let o = observable(0); setTimeout(() => o(4), 30)
  let c = 1

  let log = []

  let op = v(p), oO = v(O), ov = v(c), oo = v(o)
  oo(v => log.push(v))
  op(v => log.push(v))
  ov(v => log.push(v))
  oO(v => log.push(v))

  await tick(8)
  t.is(log, [0, 1])

  await time(10)
  t.is(log, [0, 1, 2])

  await time(10)
  t.is(log, [0, 1, 2, 3])

  await time(10)
  t.is(log, [0, 1, 2, 3, 4])
})
t('v: from async generator', async t => {
  async function* x () {
    yield 1
    await tick(3)
    yield 2
    await time(10)
    yield 3
  }
  const log = []
  let a = v([x(), x()], ([x1, x2]) => {
    log.push(x1, x2)
  })
  await tick(12)
  t.is(log, [1,undefined,1,1,2,1,2,2])
  a[Symbol.dispose]()
  await time(10)
  t.is(log, [1,undefined,1,1,2,1,2,2])
})
t('v: mapper from v', async t => {
  let v0 = v()
  let v1 = v(0, x => x + 1)
  v1(v0)
  t.is(v0(), 1)
})
t('v: to value', async t => {
  let x = v(0)
  const y = v()
  v(x)(y)
  t.is(y(), 0)
})
t('v: subscribed observable setter', async t => {
  let a = v(0), b = v(a), c = v(b)
  a(1)
  t.is(b(), 1)
  b(2)
  t.is(a(), 2)
  t.is(c(), 2)
  c(3)
  t.is(a(), 3)
  t.is(b(), 3)
})
t('v: init non-input elements', async t => {
  let el = document.createElement('div')
  el.x = 1
  let vel = v(el)
  t.is(vel(), {x: 1})
  vel[Symbol.dispose]()

  let vel2 = v()
  vel2(el)
  t.is(vel2(), el)
  vel2[Symbol.dispose]()
})
t('v: expose deps observables', async t => {
  let a = v(0), b = v(1), c = v({a, b})
  t.is(c.a(), 0)
  t.is(c.b(), 1)
  t.is(c(), {a:0, b:1})
})
t('v: deps set', async t => {
  let x, a = v(x = {x: 1, y: v(2)})
  t.is(a(), {x: 1, y: 2})
  a({x: 2, y: 3})
  t.is(x.x, 2)
  t.is(x.y(), 3)
})

// fx
t('v: fx core', async t => {
  let a = v(0)
  let o = { b: 1 }
  let b = v(o)

  let log = []
  v([a, b], ([a, b]) => {
    log.push(a, b.b)
  })

  await tick(8)
  t.is(log, [0, 1], 'initial state')
  a(1)
  a(2)
  await tick(8)
  t.any(log, [[0, 1, 2, 1], [0, 1, 1, 1, 2, 1]], 'changed state')
  b({b: 2})
  await tick(8)
  t.any(log, [[0, 1, 2, 1, 2, 2], [0, 1, 1,1, 2,1, 2,2]], 'changed prop')
  b({b: 2})
  a(2)
  await tick(8)
  t.is(log, [0,1, 1,1, 2,1, 2,2, 2,2, 2,2], 'unchanged prop')
})
t('v: fx destructor', async t => {
  let log = []
  let a = v(0), b = v(0)
  v([a,b])(([a, b]) => {
    log.push('in', a, b)
    return () => {
      log.push('out', a, b)
    }
  })

  await tick(8)
  t.is(log, ['in', 0, 0])

  log = []
  a(1)
  b(1)
  await tick(8)
  t.is(log.slice(0, 3), ['out', 0, 0], 'destructor is ok')
  t.is(log.slice(-3), ['in', 1, 1], 'destructor is ok')
})
t.todo('v: fx disposed by unmounted element automatically')
t('v: fx runs unchanged', async t => {
  let a = v(0)
  let log = []
  v(a)(a => {
    log.push(a)
  })

  await tick(8)
  t.is(log, [0])
  a(1)
  a(0)
  await tick(8)
  t.is(log, [0, 1, 0], 'runs unchanged')
})
t('v: fx no-deps/empty deps runs once after deps', async t => {
  let log = []
  const c = v(0)
  v([c])(([c]) => {
    log.push(c)
  })
  v([])(() => {
    log.push(1)
  })
  v()(() => {
    log.push(2)
  })
  v([c])(() => {
    log.push(c())
  })

  await tick(8)
  t.is(log, [0, 1, 0])
})
t('v: fx async fn', async t => {
  let count = v(0)
  let log = []
  v(count)(async c => {
    log.push(c)
    if (c > 3) return
    await tick()
    count(c + 1)
  })

  await tick(10)
  t.is(log, [0, 1, 2, 3, 4])
})
t('v: fx promise / observable / direct dep', async t => {
  let p = new Promise(r => setTimeout(() => r(2), 10))
  let O = new Observable(obs => setTimeout(() => obs.next(3), 20))
  let o = observable(); setTimeout(() => o(4), 30)
  let c = 1

  let log = []
  let unsub = v([p, O, c, o])(([p, O, c, o]) => {
    log.push(c, p, O, o)
  })

  await tick(8)
  t.is(log, [1, undefined, undefined, undefined])
  log = []
  await time(10)
  t.is(log, [1, 2, undefined, undefined])
  log = []
  await time(10)
  t.is(log, [1, 2, 3, undefined])
  log = []
  await time(10)
  t.is(log, [1, 2, 3, 4])

  unsub()
})
t.skip('v: fx thenable', async t => {
  const s = state(0), log = []
  const sx = fx(s => {
    log.push(s)
  }, [s])
  await tick(10)
  t.is(log, [0])

  sx.then(x => log.push('aw', ...x))
  s(1)
  // await tick(6)
  // t.is(log, [0, 1])
  await tick(8)
  t.any(log, [[0, 'aw', 1, 1], [0, 1, 'aw', 1]])
})
t('v: fx simple values', async t => {
  const o = {x:1}, log = []
  let unsub = v([o, o.x])(([o, x]) => {
    log.push(o, x)
  })
  await tick(8)
  t.is(log, [{x: 1}, 1])
  unsub()
})
t.skip('v: deps updated to new length', async t => {
  let deps = v([v(1)])
  let log = []
  v(deps, (args) => {
    log.push(args)
  })
  t.is(log, [[1]])

  // this apparently sets values
  // deps([...deps, v(2)])
  // instead we should modify directly observable
  deps.push(v(2))
  t.is(log, [[1], [1,2]])
})
t('v: fx sync must not call twice init const', async t => {
  let log = []
  v('x')((v) => {
    log.push(v)
  })

  t.is(log, ['x'])
  await tick(28)
  t.is(log, ['x'])
})
t('v: fx aync callback', async t => {
  let log = []
  v(1)(async () => {
    await time(10)
    log.push(10)
  })
  t.is(log, [])
  await time(10)
  t.is(log, [10])
})

// calc
t('v: calc core', async t => {

  const f = v(32), c = v(0)
  const celsius = v(f, f => (f - 32) / 1.8)
  const fahren = v(c, c => (c * 9) / 5 + 32)

  await tick(8)

  t.is(celsius(), 0) // 0
  t.is(fahren(), 32) // 32

  c(20)
  await tick(8)
  t.is(fahren(), 68)
})
t('v: calc must be sync', async t => {
  const x = v(0)
  const x2 = v(x, x => x * 2)
  t.is(x2(), 0)

  x(1)
  await tick(8)
  t.is(x2(), 2)
})
t('v: async calculator', async t => {
  // NOTE: for async effects use subscriptions, mapper can only be sync - but why? wb uses async calculator... it can even be generator.
  const x = v(1, async () => {
    await time(10)
    return 10
  })
  t.is(x(), undefined)
  await time(10)
  t.is(x(), 10)
})
t.todo('v: async generator calculator', async t => {
  const x = v(1, async function* () {
    yield 1
    await time(10)
    yield 2
  })
  await tick()
  t.is(x(), 1)
  await time(10)
  t.is(x(), 2)
})
t('v: calc promises/changeables must return undefined', async t => {
  const p = Promise.resolve(1)
  const log = []
  v(p, x => log.push(x))
  await tick(8)
  t.is(log, [1])
})
t('v: calc async generator is fine', async t => {
  const ag = async function* () {
    yield 1
    await tick()
    yield 2
  }
  let log = []
  v(ag(), x => {
    log.push(x)
  })
  await tick(12)
  t.is(log, [1, 2])
})
t('v: calc empty-deps case calls calc once', async t => {
  let v1 = v(null, () => 1)
  t.is(v1(), 1)
  let v2 = v([], () => 1)
  t.is(v2(), 1)
})
t('v: calc reading recalcs value', async t => {
  let x = v(1)
  let y = v(x, (x) => x * 2)
  t.is(y(), 2)
  x(2)
  t.is(x(), 2)
  t.is(y(), 4)
})
t('v: calc promises must be resolved fine', async t => {
  let p = new Promise(ok => setTimeout(() => ok(2)))
  let x = v(p, value => value)
  t.is(x(), undefined)
  await time()
  t.is(x(), 2)
})

// input
t('v: input text', async t => {
  let el = document.createElement('input')
  document.body.appendChild(el)
  let text = v(el)
  text(v => console.log(v.value))

  let cb = document.createElement('input')
  cb.setAttribute('type', 'checkbox')
  document.body.appendChild(cb)
  let bool = v(cb)
  bool(v => console.log(v.value))

  let sel = document.createElement('select')
  sel.innerHTML = `<option value=1>A</option><option value=2>B</option>`
  document.body.appendChild(sel)
  let enm = v(sel)
  enm(v => console.log(v.value))
})
t('v: input updates by changing value directly', async t => {
  let el = document.createElement('input')
  el.value = 0
  let value = v(el)
  t.is(value(), {value:'0'})

  // observer 1
  let log = []
  value(v => log.push(v.value))

  await tick(2)
  t.is(log, ['0'], 'initial value notification')

  el.focus()
  el.dispatchEvent(new Event('focus'))
  el.value = 1
  el.dispatchEvent(new Event('change'))
  await tick()
  el.value = 2
  el.dispatchEvent(new Event('change'))
  await tick()
  el.value = 3
  el.dispatchEvent(new Event('change'))
  el.value = 4
  el.dispatchEvent(new Event('change'))
  el.value = 5
  el.dispatchEvent(new Event('change'))
  await tick(8)
  t.is(log.slice(-1), ['5'], 'updates to latest value')

  el.value = 6
  el.dispatchEvent(new Event('change'))
  t.is(el.value, '6', 'reading value')
  await tick(8)
  t.is(log.slice(-1), ['6'], 'reading has no side-effects')

  value[Symbol.dispose]()
  el.value = 7
  el.dispatchEvent(new Event('change'))
  t.is(el.value, '7', 'end destructs inputerty')
  await tick(10)
  t.is(log.slice(-1), ['6'], 'end destructs inputerty')
})
t('v: input get/set', async t => {
  let el = document.createElement('input')
  let value = v(el)
  value({value:0})
  t.is(el.value, '0', 'set is ok')
  t.is(value(), {value:'0'}, 'get is ok')
  await tick(8)
  t.is(el.value, '0', 'set is ok')
  t.is(value(), {value:'0'}, 'get is ok')
})
t('v: input checkbox', async t => {
  let el = document.createElement('input')
  el.type = 'checkbox'
  document.body.appendChild(el)
  let bool = v(el)
  t.is(bool(), {value:false})
  t.is(el.checked, false)
  t.is(el.value, '')

  el.checked = true
  el.dispatchEvent(new Event('change'))
  t.is(bool(), {value:true})
  t.is(el.checked, true)
  t.is(el.value, 'on')

  bool({value:false})
  t.is(bool(), {value:false})
  t.is(el.checked, false)
  t.is(el.value, '')

  bool[Symbol.dispose]()
  // t.throws(() => bool(true))
  bool({value:true})
  t.is(bool(), undefined)
  t.is(el.checked, false)
  t.is(el.value, '')
})
t('v: input select', async t => {
  let el = document.createElement('select')
  el.innerHTML = '<option value=1 selected>A</option><option value=2>B</option>'
  // document.body.appendChild(el)
  let value = v(el)
  t.is(value().value, '1')
  t.is(el.value, '1')

  el.value = '2'
  el.dispatchEvent(new Event('change'))
  t.is(value().value, '2')
  t.is(el.value, '2')
  t.is(el.innerHTML, '<option value="1">A</option><option value="2" selected="">B</option>')

  value({value:'1'})
  t.is(value().value, '1')
  t.is(el.innerHTML, '<option value="1" selected="">A</option><option value="2">B</option>')
  t.is(el.value, '1')

  value[Symbol.dispose]()
  // t.throws(() => value('2'))
  value('2')
  t.any(value(), [null, undefined, '1'])
  t.is(el.innerHTML, '<option value="1" selected="">A</option><option value="2">B</option>')
  t.is(el.value, '1')
})
t.todo('v: input radio')
t.todo('v: input range')
t.todo('v: input date')
t.todo('v: input multiselect')
t.todo('v: input form')

// error
t.skip('v: error in mapper', async t => {
  let x = v(1, x => {throw Error('123')})
})
t.skip('v: error in subscription', async t => {
  let x = v(1)
  x(() => {throw new Error('x')})
})
t('v: error in object source', async t => {
  let log = []
  let ex = new Error('x')
  let o = new Observable(obs => setTimeout(() => obs.error(ex)))
  let v1 = v({o})
  v1(null, e => log.push(e))
  await time()
  t.is(log, [ex])
})
t('v: error in input v', async t => {
  let log = []
  let ex = new Error('x')
  let o = new Observable(obs => setTimeout(() => obs.error(ex)))
  let v1 = v(o)
  let v2 = v(v1)
  v1(null, e => log.push(e))
  v2(null, e => log.push(e))
  await time()
  t.is(log, [ex, ex])
})
t('v: error in proxy', async t => {
  let log = []
  let e = new Error('x')
  let p = new Promise((y, n) => setTimeout(() => n(e)))
  let vp = v(p)
  vp(null, e => log.push(e))
  await time()
  t.is(log, [e])
  t.is(vp(), undefined)
})
t('v: error in async iterator', async t => {
  let log = []
  let ex = new Error('x')
  async function* x() {
    yield 1
    await time()
    throw ex
  }
  let vp = v(x())
  vp(null, e => log.push(e))
  await tick()
  t.is(vp(), 1)
  await time(10)
  t.is(log, [ex])
  t.is(vp(), 1)
})
t('v: error in observable', async t => {
  let log = []
  let ex = new Error('x')
  let o = new Observable(obs => setTimeout(() => obs.error(ex)))
  let vp = v(o)
  vp(null, e => log.push(e))
  await tick()
  t.is(vp(), undefined)
  await time()
  t.is(log, [ex])
})


// object
t.skip('v: object init', t => {
  let b = v({})
  t.is(b, {})

  let c = v({x:true, y:1, z: 'foo', w: []})
  t.is(c, {x: true, y: 1, z: 'foo', w: []})

  let d = v([])
  t.is(d, [])

  let e = v([1, 2, 3])
  t.is(e, [1, 2, 3])

  let el = document.createElement('div')
  Object.assign(el, c)
  let f = v(el)
  t.is({...f}, c)
})
t.todo('v: readme', t => {
  // object
  const obj = v({ foo: null })

  // set
  obj.foo = 'bar'

  // subscribe to changes
  let log = []
  v(({ foo }) => log.push(foo))
  // > 'bar'
  t.is(log, ['bar'])


  // array
  let arr = v([1, 2, 3])

  // set
  arr[3] = 4

  // mutate
  arr.push(5, 6)
  arr.unshift(0)

  // subscribe
  log = []
  arr(arr => log.push(...arr))
  // > [0, 1, 2, 3, 4, 5, 6]
  t.is(log, [0,1,2,3,4,5,6])


  // element
  let el = document.createElement('x')
  let props = v(el)

  // set
  props.loading = true

  // get
  t.is(props.loading, true)

  // subscribe
  log = []
  props(({loading}) => log.push(loading))
  t.is(log, [true])
})
t.todo('o: hidden proptypes unhide props', t => {
  let x = {[Symbol.for('x')]: 1}
  let ox = o(x, {[Symbol.for('x')]: null})
  t.is(ox, {[Symbol.for('x')]: 1})
  let log = []
  v(ox, ox => log.push(ox[Symbol.for('x')]))
  x[Symbol.for('x')] = 2
  t.is(log, [1, 2])
})
t.todo('o: store core', async t => {
  let s = o({x: 1})
  let log = []
  v(s, s => {
    // console.log('sub', {...s})
    log.push({...s})
  })

  await tick(8)
  t.is(log, [{x: 1}], 'init state')
  // console.log('set 2')
  s.x = 2
  await tick(8)
  t.is(log, [{x: 1}, {x: 2}], 'change prop')

  // s.x = 2
  // await tick(8)
  // t.is(log, [{x: 1}, {x: 2}], 'unchanged prop')


  log = []
  s.y = 'foo'
  await tick(8)
  t.is(log, [{ x:2, y:'foo' }], 'add new prop')

  log = []
  delete s.x
  await tick(8)
  t.is(log, [{y: 'foo'}], 'delete props')
})
t.todo('o: store must not expose internal props', async t => {
  let s = o({x: 1})
  let log  =[]
  for (let p in s) {
    log.push(p)
  }
  t.is(log, ['x'])
})
t.todo('o: list core', async t => {
  let s = o([1])
  let l
  v(s)(s => (l = s))

  await tick(8)
  t.is(l, [1], 'init state')

  s[0] = 2
  await tick(8)
  t.is(l, [2], 'change item')

  s[1] = 3
  await tick(8)
  t.is(l, [2, 3], 'add item directly')

  s.y = 'foo'
  await tick(8)
  t.is(l, [2, 3], 'set prop')
  t.is(l.y, 'foo', 'set prop')

  delete s.y
  await tick(8)
  t.is(l, [2, 3], 'delete prop')

  s.push(4)
  await tick(8)
  t.is(l, [2,3,4], 'push')

  s.unshift(0)
  await tick(8)
  t.is(l, [0, 2,3,4], 'unshift')

  s.reverse()
  await tick(8)
  t.is(l, [4,3,2,0], 'reverse')

  s.sort()
  await tick(8)
  t.is(l, [0,2,3,4], 'sort')

  s.splice(1,0,1)
  await tick(8)
  t.is(l, [0,1,2,3,4], 'splice')

  s.pop()
  await tick(8)
  t.is(l, [0,1,2,3], 'pop')

  s.shift()
  await tick(8)
  t.is(l, [1,2,3], 'shift')
})
t.todo('o: list must not expose internal props', async t => {
  let s = o([])
  let log = []
  for (let p in []) {
    log.push(p)
  }
  t.is(log, [])
})
t.todo('o: list fx sync init', async t => {
  let l = o([])
  let log = []
  v(l, item => log.push(item.slice()))

  t.is(log, [[]])
  await tick(8)
  t.is(log, [[]])

  l.push(1)
  await tick(8)
  t.any(log, [[[], [1]], [[], [1], [1]]])
})
t.todo('o: prop subscription', async t => {
  let obj = { x: 0 }
  let oobj = o(obj)
  t.is(oobj.x, 0)

  // observer 1
  let log = []
  // for await (const item of oobj) {
  //   log.push(item)
  // }
  v(oobj)(item => log.push(item.x))

  await tick(2)
  t.is(log, [0], 'initial value notification')

  obj.x = 1
  await tick(1)
  obj.x = 2
  await tick(8)
  t.is(log, [0, 1, 2], 'updates to latest value')
  obj.x = 3
  obj.x = 4
  obj.x = 5
  await tick(8)
  t.is(log.slice(-1), [5], 'updates to latest value')

  obj.x = 6
  t.is(obj.x, 6, 'reading value')
  await tick(8)
  t.is(log.slice(-1), [6], 'reading has no side-effects')

  obj.x = 7
  obj.x = 6
  await tick(8)
  t.is(log.slice(-1), [6], 'changing and back does not trigger too many times')

  oobj[Symbol.observable]()[Symbol.dispose]()
  // xs(null)
  obj.x = 7
  obj.x = 8
  t.is(obj.x, 8, 'end destructs property')
  await tick(10)
  t.is(log.slice(-1), [6], 'end destructs property')
})
t.todo('o: prop get/set', async t => {
  let ob = { x: () => { t.fail('Should not be called') } }
  let ox = o(ob)
  ox.x = 0
  t.is(ob, {x:0}, 'set is ok')
  t.is(ox, {x:0}, 'get is ok')
})
t.todo('o: prop multiple instances', async t => {
  let x = { x: 1 }
  let xs1 = o(x)
  let xs2 = o(x)

  xs2.x = 2

  t.is(xs1.x, xs2.x, 'same value')
  t.is(x.x, xs1.x, 'same value')
})
t.todo('o: prop minimize get/set invocations', async t => {
  let log = []
  let obj = {
    _x: 0,
    get x() {
      log.push('get', this._x); return this._x
    },
    set x(x) {
      log.push('set', x);
      this._x = x
    }
  }

  let xs = o(obj)
  log = [] // skip init calls
  ;(async () => {
    // for await (let value of xs) {
      xs[Symbol.observable]()(value => {
        log.push('changed', value.x)
      })
    // }
  })();

  await tick(8)
  t.is(log, ['get', 0, 'changed', 0])

  obj.x
  await tick(8)
  t.is(log, ['get', 0, 'changed', 0, 'get', 0])

  // console.log('setx')
  obj.x = 1
  await tick(12)
  t.is(log, ['get', 0, 'changed', 0, 'get', 0, 'set', 1, 'get', 1, 'changed', 1])

  log = []
  xs[Symbol.observable]()[Symbol.dispose](null)
  t.is(log, [])

  obj.x
  t.is(log, ['get', 1])

  obj.x = 0
  await tick(8)
  t.is(log, ['get', 1, 'set', 0])
})
t.todo('o: prop observe store property')
t.skip('o: attr core', async t => {
  let el = document.createElement('div')
  let attrs = o(el, {x: Number})
  let log = []
  ;(async () => {
    attrs[Symbol.observable]().subscribe(el => log.push(el.x, el.getAttribute('x')))
  })()
  await tick(8)
  t.is(log, [undefined, null], 'init')
  el.setAttribute('x', 0, '0')
  el.setAttribute('x', 1, '1')
  el.setAttribute('x', 2, '2')
  await tick(12)
  t.is(log, [undefined, null, 2, '2'], 'basic')
  el.setAttribute('x', '3')
  el.setAttribute('x', '4')
  el.setAttribute('x', '5')
  await tick(8)
  t.is(log, [undefined, null, 2, '2', 5, '5'], 'updates to latest value')
  el.setAttribute('x', '5')
  el.setAttribute('x', '5')
  el.setAttribute('x', '5')
  await tick(8)
  t.is(log, [undefined, null, 2, '2', 5, '5'], 'ignores unchanged value')
  el.setAttribute('x', '6')
  // t.is(el.x, 6, 'reading applies value')
  await tick(8)
  // t.is(log, [null, '2', '5', '5', '6'], 'reading applies value')
  attrs[Symbol.observable]()[Symbol.dispose]()
  el.setAttribute('x', '7')
  await tick(8)
  t.is(el.getAttribute('x'), '7', 'end destroys property')
  t.is(log, [undefined, null, 2, '2', 5, '5', 6, '6'], 'end destroys property')
})
t.skip('o: attr get/set', async t => {
  let el = document.createElement('x')

  let ox = o(el)

  await tick(8)
  t.is(el.x, undefined)

  ox.x = true
  await tick(8)
  t.is(el.x , true)

  ox.x = 'abc'
  await tick(8)
  t.is(el.x, 'abc')

  ox.x = null
  await tick(8)
  t.is(el.x, null)

  ox[Symbol.observable]()[Symbol.dispose]()
  ox.x = 123
  await tick(8)
  t.is(el.x, null)
})
t.skip('o: attr correct cleanup', async t => {
  // nope: user may clean up himself if needed. Not always resetting to orig value is required, mb temporary setter.
  let el = document.createElement('div')
  el.setAttribute('x', 1)
  let xs = attr(el, 'x')
  t.is(xs(), '1')
  xs(2)
  t.is(el.getAttribute('x'), '2')
  xs(null)
  t.is(el.getAttribute('x'), '1')
})
t.skip('o: attr stream to attribute', async t => {
  let x = store([]), el = document.createElement('div')
  const a = attr(el, 'hidden')
  from(x, x => !x.length)(a)
  t.is(el.getAttribute('hidden'), '')
  x.push(1)
  t.is(el.getAttribute('hidden'), null)
  x.length = 0
  t.is(el.getAttribute('hidden'), '')
})
t.skip('o: attr must set for new props', async t => {
  let el = document.createElement('div')
  let props = o(el)
  props.x = 1
  t.is(el.getAttribute('x'), '1')
})
