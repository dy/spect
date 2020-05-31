import t from 'tst'
import { v } from '../index.js'
import { tick, frame, time } from 'wait-please'

// value
t('v: readme', async t => {
  let log = []
  let v1 = v(0)

  // get
  t.is(v1(), 0)

  // subscribe
  let unsub = v1.subscribe(value => {
    log.push(value)
    return () => log.push('-')
  })

  // set
  v1(1)
  t.is(v1(), 1)
  t.is(log, [0, '-', 1])
  unsub()

  // from value
  let v2 = v1.map(v1 => v1 * 2)
  log = []
  v2.subscribe(v2 => log.push(v2))
  t.is(v2(), 2) // > 2
  t.is(v1(), 1)
  t.is(log, [2])
  v1(1)
  t.is(log, [2, 2])

  // initialize value
  let v3 = v(() => v1)
  t.is(v3(), v1) // v5

  // dispose
  ;[v3, v2, v1].map(v => v[Symbol.dispose]())
})
t('v: core API', async t => {
  let s = v(0)

  // observer 1
  let log = []
  // ;(async () => { for await (let value of s) log.push(value) })()
  s.subscribe(value => log.push(value))

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
  s.subscribe(value => log2.push(value))

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
t('v: v to v', t => {
  const a = v(0), b = v()
  a.subscribe(b)
  t.is(a(), 0)
  t.is(b(), 0)
})
t('v: subscribe teardown', t => {
  const a = v()
  const log = []
  a.subscribe(value => {
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
  value.subscribe(v => log1.push(v))
  value.subscribe(v => log2.push(v))
  t.is(log1, [0])
  t.is(log2, [0])
  value(1)
  t.is(log1, [0, 1])
  t.is(log2, [0, 1])
  value.subscribe(v => log3.push(v))
  t.is(log1, [0, 1])
  t.is(log2, [0, 1])
  t.is(log3, [1])
  value(2)
  t.is(log1, [0, 1, 2])
  t.is(log2, [0, 1, 2])
  t.is(log3, [1, 2])
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
  t.is(a(), [b])
  b(1)
  t.is(a(), [b])
  a([b()])
  t.is(a(), [1])
})
t.skip('v: stringify', async t => {
  // TODO: can't fix :()
  let v1 = v(1), v2 = v({x:1})
  t.is(JSON.stringify(v1), '1')
  t.is(JSON.stringify(v2), `{"x":1}`)
})
t('v: multiple values', async t => {
  let x = v()
  let log = []
  x.subscribe((a,b,c) => log.push(a,b,c))
  t.is(log, [])
  x(1,2,3)
  t.is(log, [1,2,3])
  t.is(x(), [1,2,3])
})

// error
t.skip('v: error in mapper', async t => {
  // NOTE: actually mb useful to have blocking error in mapper
  let x = v(1)
  let y = x.map(x => {throw Error('123')})
  t.ok(y.error)
})
t.skip('v: error in subscription', async t => {
  let x = v(1)
  x.subscribe(() => {throw new Error('x')})
})
t.skip('v: error in init', async t => {
  let x = v(() => {throw Error(123)})
})
t.skip('v: error in set', async t => {
  let x = v(1)
  x(x => {throw Error(123)})
})
// Observable methods
t('v: o.map', async t => {
  let v1 = v(1), v2 = v1.map(x => x + 1)
  t.is(v2(), 2)
  v1(2)
  t.is(v2(), 3)
})
