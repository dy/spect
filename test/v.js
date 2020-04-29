import t from 'tst'
import { v } from '../index.js'
import { tick, frame, time } from 'wait-please'
import Observable from 'zen-observable/esm.js'
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
  let item = { done: v(false) }
  let v5 = v(item)
  log = []
  v5(v => log.push({...v}))
  t.is(v5.done(), false, 'internal props') // false
  t.is(log, [{done: false}], 'emit props')

  // set property, notify
  item.done(true)
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

  t.is(+s, 0, 'toPrimitive')
  t.is(s.valueOf(), 0, 'valueOf')
  t.is(s.toString(), 0, 'toString')

  t.is(s(), 0, 's()')

  await tick()
  t.is(log, [0], 'should publish the initial state')

  s(1)
  t.is(+s, 1, 'state.current = value')

  s(2)
  t.is(+s, 2, 'state(value)')
  t.is(s(), 2, 'state(value)')

  s(s() + 1)
  t.is(s(), 3, 'state(state + value)')

  // observer 2
  let log2 = []
  // ;(async () => { for await (let value of s) log2.push(value) })()
  s(value => log2.push(value))

  await tick(8)
  t.is(log.slice(-1), [3], 'should track and notify first tick changes')
  await tick(8)
  t.is(log2, [3], 'should properly init set')
  s(4)
  await tick(8) // why 4 ticks delay?
  t.is(log.slice(-1), [4], 'arbitrary change 1')
  s(5)
  await tick(8)
  t.is(log.slice(-1), [5], 'arbitrary change 2')

  t.is(log2.slice(-1), [5], 'secondary observer is fine')

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
  let x = {a: v(1)}
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

  b.x(2)
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
  let x = v({x: v(1), y: v(2)})
  let log = []
  x((vals, diff) => log.push(diff))
  t.is(log, [{x:1, y:2}])
  x({x: 2})
  t.is(x(), {x:2, y:2})
  t.is(log.slice(-1), [{x: 2}])
})
t('v: diff array', async t => {
  let x = v([v(1), v(2)])
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
  o1.x(2)
  t.is(log, [{x:2}, {x:2}])

  log = []
  o2[Symbol.dispose]()
  o1.x(3)
  t.is(log, [{x: 3}])

  log = []
  o1[Symbol.dispose]()
  o1.x(4)
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
t('v: extend object', async t => {
  let o = {x:1}, log = []
  v(o)(o => log.push({...o}))
  t.is(log, [{x:1}])
  o.y = 2
  t.is(log, [{x:1}])
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
t('v: async iterator', async t => {
  const s = v(0), log = []

  ;(async () => {
    for await (let value of s) {
      log.push(value)
    }
  })();

  await tick(4)
  t.is(log, [0])

  s(1)
  await tick(4)
  t.is(log, [0, 1])

  s(2)
  s(3)
  await tick(4)
  t.is(log, [0, 1, 2, 3])
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
