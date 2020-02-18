import t from 'tst'
import { $, state, fx, prop, store, calc, ref, attr, on } from '../index.js'
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
  t.is(x2.current, 0)

  x(1)
  await tick(8)
  t.is(x2.current, 2)
})

t('calc: promises/changeables must return undefined', async t => {
  const p = Promise.resolve(1)
  const log = []
  calc(x => log.push(x), [p])
  await tick()
  t.is(log, [undefined, 1])
})
