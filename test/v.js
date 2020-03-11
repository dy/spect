import t from 'tst'
import { v } from '../index.js'
import { tick, frame, time } from 'wait-please'
import Observable from 'zen-observable/esm'
import observable from './observable.js'

t('v: core', async t => {
  let s = v(0)

  // observer 1
  let log = []
  // ;(async () => { for await (let value of s) log.push(value) })()
  s(value => log.push(value))

  // t.equal(+s, 0, 'toPrimitive')
  // t.equal(s.valueOf(), 0, 'valueOf')
  // t.equal(s.toString(), 0, 'toString')
  t.equal(s(), 0, 's()')

  await tick()
  t.deepEqual(log, [0], 'should publish the initial state')

  // s(1)
  // t.equal(+s, 1, 'state.current = value')

  s(2)
  // t.equal(+s, 2, 'state(value)')
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

t.skip('v: function/other state gets subscribed', async t => {
  let s = v(1)
  let s2 = v(s)
  console.log(s2())

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

t.todo('v: multiple subscriptions should not inter-trigger', async t => {
  let value = v(0)
  let log1 = [], log2 = [], log3 = []
  value(v => log1.push(v))
  value(v => log2.push(v))
  t.is(log1, [0])
  t.is(log2, [0])
  v(1)
  t.is(log1, [0, 1])
  t.is(log2, [0, 1])
  value(v => log3.push(v))
  t.is(log1, [0, 1])
  t.is(log2, [0, 1])
  t.is(log3, [1])
  v(2)
  t.is(log1, [0, 1, 2])
  t.is(log2, [0, 1, 2])
  t.is(log3, [1, 2])
})

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
  v([x(), x()], (x1, x2) => {
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

t('v: stream to value', async t => {
  let x = v(0)
  const y = v()
  v(x)(y)
  t.is(y(), 0)
})
