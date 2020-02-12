import t from 'tst'
import { $, state, fx, prop, store, calc, ref, attr, on } from '../index.js'
import { tick, frame, idle, time } from 'wait-please'
import { augmentor, useState, useEffect, useMemo } from 'augmentor'
import Observable from 'zen-observable/esm'
import observable from './observable.js'


t('fx: core', async t => {
  let a = state(0)
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
  await tick(7)
  t.is(log, [0, 1, 2, 1], 'changed state')
  o.b = 2
  await tick(7)
  t.is(log, [0, 1, 2, 1, 2, 2], 'changed prop')
  o.b = 2
  a(2)
  await tick(7)
  t.is(log, [0, 1, 2, 1, 2, 2], 'unchanged prop')
})
t('fx: destructor', async t => {
  let log = []
  let a = state(0), b = state(0)
  fx((a, b) => {
    log.push('in', a, b)
    return () => {
      log.push('out', a, b)
    }
  }, [a, b])

  await tick(8)
  t.is(log, ['in', 0, 0])

  log = []
  a(1)
  b(1)
  await tick(8)
  t.is(log, ['out', 0, 0, 'in', 1, 1], 'destructor is ok')
})
t.todo('fx: disposed by unmounted element automatically')
t('fx: doesn\'t run unchanged', async t => {
  let a = ref(0)
  let log = []
  fx(a => {
    log.push(a)
  }, [a])

  await tick(8)
  t.is(log, [0])
  a(1)
  a(0)
  await tick(8)
  t.is(log, [0], 'does not run unchanged')
})
t('fx: no-deps/empty deps runs once after deps', async t => {
  let log = []
  const c = state(0)
  fx(() => {
    log.push(c())
  }, [c])
  fx(() => {
    log.push(1)
  }, [])
  fx(() => {
    log.push(2)
  })
  fx(() => {
    log.push(c())
  }, [c])

  await tick(8)
  t.is(log, [0, 2, 0])
})
t('fx: async fx', async t => {
  let count = state(0)
  let log = []
  fx(async c => {
    log.push(c)
    if (c > 3) return
    await tick()
    count(c + 1)
  }, [count])

  await tick(70)
  t.is(log, [0, 1, 2, 3, 4])
})
t('fx: promise / observable / direct dep', async t => {
  let p = new Promise(r => setTimeout(() => r(2), 10))
  let O = new Observable(obs => setTimeout(() => obs.next(3), 20))
  let o = observable(); setTimeout(() => o(4), 30)
  let v = 1

  let log = []
  fx((p, O, v, o) => {
    log.push(v, p, O, o)
  }, [p, O, v, o])

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
t('fx: on must not create initial tick', async t => {
  let ex = on(document.createElement('x'), 'click')
  let log = []
  fx(e => {
    log.push(1)
  }, [ex])

  await tick(20)
  t.is(log, [])
})
