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
  v1(value => {
    log.push(value)
    return () => {
      log.push('-')
    }
  })

  // set
  v1(1)
  t.is(v1(), 1)
  t.is(log, [0, '-', 1])


  // from value
  let v2 = v(v1, v1 => v1 * 2)
  t.is(v2(), 2) // > 2

  // from multiple values
  let v3 = v([v1, v2], ([v1, v2]) => v1 + v2)
  t.is(v3(), 3) // > 3

  // run effect on every change
  log = []
  v([v1, v2, v3])(([v1, v2, v3]) => {
    log.push(v1, v2, v3)
    return () => log.push('-')
  })
  t.is(log, [1, 2, 3])
  // > 1, 2, 3

  // from input
  // let v4 = v($('#field')[0])
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
  let a = v([])
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
  }
  const log = []
  v([x(), x()], ([x1, x2]) => {
    log.push(x1, x2)
  })
  await tick(12)
  t.is(log, [1,undefined,1,1,2,1,2,2])
})
t('v: mapper', async t => {
  let v0 = v()
  v(0, x => x + 1)(v0)
  t.is(v0(), 1)
})
t('v: to value', async t => {
  let x = v(0)
  const y = v()
  v(x)(y)
  t.is(y(), 0)
})
t('v: another observer setter should work', async t => {
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

// fx
t.todo('v: fx core', async t => {
  let a = v(0)
  let o = { b: 1 }
  let b = prop(o, 'b')

  let log = []
  fx((a, b) => {
    log.push(a, b)
  }, [a, b])

  await tick(8)
  t.is(log, [0, 1], 'initial state')
  a(1)
  a(2)
  await tick(8)
  t.any(log, [[0, 1, 2, 1], [0, 1, 1, 1, 2, 1]], 'changed state')
  o.b = 2
  await tick(8)
  t.any(log, [[0, 1, 2, 1, 2, 2], [0, 1, 1,1, 2,1, 2,2]], 'changed prop')
  o.b = 2
  a(2)
  await tick(8)
  t.any(log, [[0,1, 2,1, 2,2, 2,2], [0,1, 1,1, 2,1, 2,2, 2,2]], 'unchanged prop')
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
  v([p, O, c, o])(([p, O, c, o]) => {
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
})
t.todo('v: fx on must not create initial tick', async t => {
  let ex = on(document.createElement('x'), 'click')
  let log = []
  v(ex)(e => {
    log.push(1)
  })

  await tick(20)
  t.is(log, [])
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
  v([o, o.x])(([o, x]) => {
    log.push(o, x)
  })
  await tick(8)
  t.is(log, [{x: 1}, 1])
})
t.skip('v: fx deps length change', async t => {
  let deps = [state(1)]
  let log = []
  fx((...args) => {
    log.push(args)
  }, deps)
  await tick(8)
  t.is(log, [[1]])

  deps.push(state(2))
  await tick(8)
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
t('v: calc async calculator', async t => {
  const x = v(1, async () => {
    await time(10)
    return 10
  })
  t.is(x(), undefined)
  await time(10)
  t.is(x(), 10)
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
  text(v => console.log(v))

  let cb = document.createElement('input')
  cb.setAttribute('type', 'checkbox')
  document.body.appendChild(cb)
  let bool = v(cb)
  bool(v => console.log(v))

  let sel = document.createElement('select')
  sel.innerHTML = `<option value=1>A</option><option value=2>B</option>`
  document.body.appendChild(sel)
  let enm = v(sel)
  enm(v => console.log(v))
})
t('v: input updates by changing value directly', async t => {
  let el = document.createElement('input')
  el.value = 0
  let value = v(el)
  t.is(value(), '0')

  // observer 1
  let log = []
  value(v => log.push(v))

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

  value.cancel()
  el.value = 7
  el.dispatchEvent(new Event('change'))
  t.is(el.value, '7', 'end destructs inputerty')
  await tick(10)
  t.is(log.slice(-1), ['6'], 'end destructs inputerty')
})
t('v: input get/set', async t => {
  let el = document.createElement('input')
  let value = v(el)
  value(0)
  t.is(el.value, '0', 'set is ok')
  t.is(value(), '0', 'get is ok')
  await tick(8)
  t.is(el.value, '0', 'set is ok')
  t.is(value(), '0', 'get is ok')
})
t.skip('v: input should register on simple selectors', async t => {
  let el = document.createElement('input')
  document.body.appendChild(el)
  let value = input('input')
  await frame(2)
  value(0)
  t.is(el.value, '0', 'set is ok')
  t.is(value(), '0', 'get is ok')
})
t.skip('v: input multiple instances same? ref', async t => {
  const el = document.createElement('input')
  let xs1 = input(el)
  let xs2 = input(el)

  t.is(xs1, xs2, 'same ref')
})
t.skip('v: input direct value set off-focus emits event', async t => {
  // NS: not sure we have to track direct `el.value = 1` when not focused. Looks like deciding for the user. Dispatching an event is not a big deal.
  let el = document.createElement('input')
  let i = input(el)
  let log = []
  fx(v => {
    log.push(v)
  }, [i])
  await tick(8)
  t.is(log, [''])

  el.value = 1
  await tick(8)
  t.is(log, ['', '1'])
  t.is(i(), '1')
})
t('v: input checkbox', async t => {
  let el = document.createElement('input')
  el.type = 'checkbox'
  document.body.appendChild(el)
  let bool = v(el)
  t.is(bool(), false)
  t.is(el.checked, false)
  t.is(el.value, '')

  el.checked = true
  el.dispatchEvent(new Event('change'))
  t.is(bool(), true)
  t.is(el.checked, true)
  t.is(el.value, 'on')

  bool(false)
  t.is(bool(), false)
  t.is(el.checked, false)
  t.is(el.value, '')

  bool.cancel()
  bool(true)
  t.is(bool(), false)
  t.is(el.checked, false)
  t.is(el.value, '')
})
t('v: input select', async t => {
  let el = document.createElement('select')
  el.innerHTML = '<option value=1 selected>A</option><option value=2>B</option>'
  // document.body.appendChild(el)
  let value = v(el)
  t.is(value(), '1')
  t.is(el.value, '1')

  el.value = '2'
  el.dispatchEvent(new Event('change'))
  t.is(value(), '2')
  t.is(el.value, '2')
  t.is(el.innerHTML, '<option value="1">A</option><option value="2" selected="">B</option>')

  value('1')
  t.is(value(), '1')
  t.is(el.innerHTML, '<option value="1" selected="">A</option><option value="2">B</option>')
  t.is(el.value, '1')

  value.cancel()
  value('2')
  t.is(value(), '1')
  t.is(el.innerHTML, '<option value="1" selected="">A</option><option value="2">B</option>')
  t.is(el.value, '1')
})
t.todo('v: input radio')
t.todo('v: input range')
t.todo('v: input date')
t.todo('v: input multiselect')
