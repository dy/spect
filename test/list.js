import t from 'tst'
import { $, state, fx, list, prop, store, calc, ref, attr, on } from '../index.js'
import { tick, frame, idle, time } from 'wait-please'
import { augmentor, useState, useEffect, useMemo } from 'augmentor'
import Observable from 'zen-observable/esm'
import observable from './observable.js'


t('list: core', async t => {
  let s = list([1])
  let l
  fx(s => {
    l = s
  }, [s])

  await tick(8)
  t.is(l, [1], 'init state')

  s[0] = 2
  await tick(8)
  t.is(l, [2], 'change item')

  s[1] = 3
  await tick(8)
  t.is(l, [2, 3], 'add item directly')

  s.y = 'foo'
  await tick(8)
  t.is(l, [2, 3], 'set prop')
  t.is(l.y, 'foo', 'set prop')

  delete s.y
  await tick(8)
  t.is(l, [2, 3], 'delete prop')

  s.push(4)
  await tick(8)
  t.is(l, [2,3,4], 'push')

  s.unshift(0)
  await tick(8)
  t.is(l, [0, 2,3,4], 'unshift')

  s.reverse()
  await tick(8)
  t.is(l, [4,3,2,0], 'reverse')

  s.sort()
  await tick(8)
  t.is(l, [0,2,3,4], 'sort')

  s.splice(1,0,1)
  await tick(8)
  t.is(l, [0,1,2,3,4], 'splice')

  s.pop()
  await tick(8)
  t.is(l, [0,1,2,3], 'pop')

  s.shift()
  await tick(8)
  t.is(l, [1,2,3], 'shift')
})

t('list: must not expose internal props', async t => {
  let s = list([])
  let log = []
  for (let p in []) {
    log.push(p)
  }
  t.is(log, [])
})
