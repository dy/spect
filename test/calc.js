import t from 'tst'
import { $, state, fx, prop, store, calc, attr, on } from '../index.js'
import { tick, frame, idle, time } from 'wait-please'
import { augmentor, useState, useEffect, useMemo } from 'augmentor'
import Observable from 'zen-observable/esm'
import observable from './observable.js'


t('calc: core', async t => {

  const f = state(32), c = state(0)
  const celsius = calc(f => (f - 32) / 1.8, [f])
  const fahren = calc(c => (c * 9) / 5 + 32, [c])

  await tick(8)

  t.is(celsius(), 0) // 0
  t.is(fahren(), 32) // 32

  c(20)
  await tick(8)
  t.is(fahren(), 68)
})

t('calc: must be sync', async t => {
  const x = state(0)
  const x2 = calc(x => x * 2, [x])
  t.is(x2(), 0)

  x(1)
  await tick(8)
  t.is(x2(), 2)
})

t('calc: promises/changeables must return undefined', async t => {
  const p = Promise.resolve(1)
  const log = []
  calc(x => log.push(x), [p])
  await tick(8)
  t.is(log, [1])
})

t('calc: async generator is fine', async t => {
  const ag = async function* () {
    yield 1
    await tick()
    yield 2
  }
  let log = []
  calc(x => {
    log.push(x)
  }, [ag()])
  await tick(12)
  t.is(log, [1, 2])
})

t('calc: empty-deps case calls calc once', async t => {
  let v = calc(() => 1, [])
  t.is(v(), 1)
})

t('calc: reading recalcs value', async t => {
  let x = state(1)
  let v = calc((x) => x * 2, [x])
  t.is(v(), 2)
  x(2)
  t.is(x(), 2)
  t.is(v(), 4)
})

t('calc: promises must be resolved fine', async t => {
  let p = new Promise(ok => setTimeout(() => ok(2)))
  let x = calc(value => {
    return value
  }, [p])
  t.is(x(), undefined)
  await time()
  t.is(x(), 2)
})
