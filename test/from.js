import t from 'tst'
import { $, state, fx, prop, on, from, value } from '../index.js'
import { tick, frame, idle, time } from 'wait-please'
import { augmentor, useState, useEffect, useMemo } from 'augmentor'
import Observable from 'zen-observable/esm'
import observable from './observable.js'


t('from: promise / observable / direct dep', async t => {
  let p = new Promise(r => setTimeout(() => r(2), 10))
  let O = new Observable(obs => setTimeout(() => obs.next(3), 20))
  let o = observable(0); setTimeout(() => o(4), 30)
  let v = 1

  let log = []

  let op = from(p), oO = from(O), ov = from(v), oo = from(o)
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
t('from: async generator', async t => {
  async function* x () {
    yield 1
    await tick(3)
    yield 2
  }
  const log = []
  fx((x1, x2) => {
    log.push(x1, x2)
  }, [from(x()), from(x())])

  await tick(12)
  t.is(log, [1,undefined,1,1,2,1,2,2])
})

t('from: constant to value', async t => {
  let v = state()
  from(0, x => x + 1)(v)
  t.is(v(), 1)
})

t('from: stream to value', async t => {
  let x = value(0)
  const v = value()
  from(x)(v)
  x(v)
  t.is(v(), 0)
})
