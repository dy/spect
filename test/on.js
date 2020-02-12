import t from 'tst'
import { $, state, fx, prop, store, calc, ref, attr, on } from '../index.js'
import { tick, frame, idle, time } from 'wait-please'
import { augmentor, useState, useEffect, useMemo } from 'augmentor'
import Observable from 'zen-observable/esm'
import observable from './observable.js'


t('on: core', async t => {
  let el = document.createElement('div')
  let clicks = on(el, 'click')
  let log = []
  ;(async () => {
    for await (const e of clicks) {
      log.push(e.type)
    }
  })()
  el.click()
  await tick(6)
  t.is(log, ['click'], 'basic')
  el.click()
  el.click()
  await tick(8)
  t.is(log, ['click', 'click'], 'skips events within same tick')
  el.click()
  el.click()
  el.click()
  await tick(8)
  t.is(log, ['click', 'click', 'click'], 'updates to latest value')

  clicks.cancel()
  await tick(8)
  await tick(8)
  el.click()
  await tick(8)
  el.click()
  await tick(8)
  t.is(log, ['click', 'click', 'click'], 'end stops event stream')
})
t.todo('on: next-tick event should be discarded', async t => {
  let el = document.createElement('click')
  let resolve, p = new Promise(r => {resolve = r})
  let log = []

  fx((e) => {
    log.push(e ? true : false)
  }, [on(el, 'click'), p])

  el.click()
  await tick(12)
  t.is(log, [true])
  resolve()
  await tick(12)
  t.is(log, [true, false])
})
