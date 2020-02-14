import t from 'tst'
import { $, state, fx, prop, store, calc, ref, attr, on } from '../index.js'
import { tick, frame, idle, time } from 'wait-please'
import { augmentor, useState, useEffect, useMemo } from 'augmentor'
import Observable from 'zen-observable/esm'
import observable from './observable.js'


t('store: core', async t => {
  let s = store({x: 1})
  let log = []
  fx(s => {
    log.push(s)
  }, [s])

  await tick(8)
  t.is(log, [{x: 1}], 'init state')

  s.x = 2
  await tick(8)
  t.is(log, [{x: 1}, {x: 2}], 'change prop')

  s.x = 2
  await tick(8)
  t.is(log, [{x: 1}, {x: 2}], 'unchanged prop')


  log = []
  s.y = 'foo'
  await tick(8)
  t.is(log, [{ x:2, y:'foo' }], 'add new prop')

  log = []
  delete s.x
  await tick(8)
  t.is(log, [{y: 'foo'}], 'delete props')
})

t('store: must not expose internal props', async t => {
  let s = store({x: 1})
  let log  =[]
  for (let p in s) {
    log.push(p)
  }
  t.is(log, ['x'])
})