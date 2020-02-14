import t from 'tst'
import { $, state, fx, input, store, calc, ref, attr, on } from '../index.js'
import { tick, frame, idle, time } from 'wait-please'
import { augmentor, useState, useEffect, useMemo } from 'augmentor'
import Observable from 'zen-observable/esm'
import observable from './observable.js'

t.browser('input: core', async t => {
  let el = document.createElement('input')
  document.body.appendChild(el)
  let value = input(el)

  ;(async () => { for await (const v of value) {
    console.log(v)
  }})();

  document.body.removeChild(el)
})

t('input: updates by changing value directly', async t => {
  let el = document.createElement('input')
  el.value = 0
  let value = input(el)
  t.is(value(), '0')

  // observer 1
  let log = []
  ;(async () => { for await (const v of value) {
    log.push(v)
  }})();

  await tick(2)
  t.is(log, ['0'], 'initial value notification')

  el.focus()
  el.dispatchEvent(new Event('focus'))
  el.value = 1
  el.dispatchEvent(new Event('change'))
  await tick()
  el.value = 2
  el.dispatchEvent(new Event('change'))
  await tick()
  el.value = 3
  el.dispatchEvent(new Event('change'))
  el.value = 4
  el.dispatchEvent(new Event('change'))
  el.value = 5
  el.dispatchEvent(new Event('change'))
  await tick(8)
  t.is(log, ['0', '2', '5'], 'updates to latest value')

  el.value = 6
  el.dispatchEvent(new Event('change'))
  t.is(el.value, '6', 'reading value')
  await tick(8)
  t.is(log, ['0', '2', '5', '6'], 'reading has no side-effects')

  value.cancel()
  el.value = 7
  el.dispatchEvent(new Event('change'))
  t.is(el.value, '7', 'end destructs inputerty')
  await tick(10)
  t.is(log, ['0', '2', '5', '6'], 'end destructs inputerty')
})
t('input: get/set', async t => {
  let el = document.createElement('input')
  let value = input(el)
  value(0)
  t.is(el.value, '0', 'set is ok')
  t.is(value(), '0', 'get is ok')
})
t.skip('input: multiple instances same? ref', async t => {
  const el = document.createElement('input')
  let xs1 = input(el)
  let xs2 = input(el)

  t.is(xs1, xs2, 'same ref')
})
t.skip('input: direct value set off-focus emits event', async t => {
  // NS: not sure we have to track direct `el.value = 1` when not focused. Looks like deciding for user. Dispatching an event is not a big deal.
  let el = document.createElement('input')
  let i = input(el)
  let log = []
  fx(v => {
    log.push(v)
  }, [i])
  await tick(8)
  t.is(log, [''])

  el.value = 1
  await tick(8)
  t.is(log, ['', '1'])
  t.is(i(), '1')
})
