import t from 'tst'
import { v } from '../index.js'
import { tick, frame } from 'wait-please'

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
