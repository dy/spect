import t from 'tst'
import { $, state, fx, prop, store, calc, attr, on } from '../index.js'
import { tick, frame, idle, time } from 'wait-please'
import { augmentor, useState, useEffect, useMemo } from 'augmentor'
import Observable from 'zen-observable/esm'
import observable from './observable.js'


t('prop: subscription', async t => {
  let o = { x: 0 }
  let xs = prop(o, 'x')
  t.is(xs(), 0)

  // observer 1
  let log = []
  ;(async () => {
    // for await (const item of xs) {
    //   log.push(item)
    // }
    xs(item => log.push(item))
  })();

  await tick(2)
  t.is(log, [0], 'initial value notification')

  o.x = 1
  await tick(1)
  o.x = 2
  await tick(8)
  t.is(log, [0, 1, 2], 'updates to latest value')
  o.x = 3
  o.x = 4
  o.x = 5
  await tick(8)
  t.is(log.slice(-1), [5], 'updates to latest value')

  o.x = 6
  t.is(o.x, 6, 'reading value')
  await tick(8)
  t.is(log.slice(-1), [6], 'reading has no side-effects')

  o.x = 7
  o.x = 6
  await tick(8)
  t.is(log.slice(-1), [6], 'changing and back does not trigger too many times')

  xs.cancel()
  // xs(null)
  o.x = 7
  o.x = 8
  t.is(o.x, 8, 'end destructs property')
  await tick(10)
  t.is(log.slice(-1), [6], 'end destructs property')
})
t('prop: get/set', async t => {
  let o = { x: () => { t.fail('Should not be called') } }
  let xs = prop(o, 'x')
  xs(0)
  t.is(o.x, 0, 'set is ok')
  t.is(xs(), 0, 'get is ok')
})
t('prop: keep initial property value if applied/unapplied', async t => {
  let o = { foo: 'bar' }
  let foos = prop(o, 'foo')
  foos(null)
  t.is(o, {foo: 'bar'}, 'initial object is unchanged')
})
t('prop: multiple instances', async t => {
  let x = { x: 1}
  let xs1 = prop(x, 'x')
  let xs2 = prop(x, 'x')

  t.is(xs1, xs2, 'same ref')
})
t('prop: minimize get/set invocations', async t => {
  let log = []
  let obj = {
    _x: 0,
    get x() {
      log.push('get', this._x); return this._x
    },
    set x(x) {
      log.push('set', x);
      this._x = x
    }
  }

  let xs = prop(obj, 'x')
  ;(async () => {
    // for await (let value of xs) {
      xs(value => {
        log.push('changed', value)
      })
    // }
  })();

  await tick(8)
  t.is(log, ['get', 0, 'changed', 0])

  obj.x
  await tick(8)
  t.is(log, ['get', 0, 'changed', 0, 'get', 0])

  obj.x = 1
  await tick(12)
  t.is(log, ['get', 0, 'changed', 0, 'get', 0, 'set', 1, 'get', 1, 'changed', 1])

  log = []
  xs(null)
  t.is(log, [])

  obj.x
  t.is(log, ['get', 1])

  obj.x = 0
  await tick(8)
  t.is(log, ['get', 1, 'set', 0])
})

t.todo('prop: observe store property')
