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
