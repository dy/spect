import t from 'tst'
import { attr, on } from '../index.js'
import { tick, frame, idle, time } from 'wait-please'

t('attr: core', async t => {
  let el = document.createElement('div')
  let xattrs = attr(el, 'x')
  let log = []
    ; (async () => {
      // for await (const value of xattrs) {
      //   log.push(value)
      // }
      xattrs(value => log.push(value))
    })()
  await tick(8)
  t.is(log, [null], 'init')
  el.setAttribute('x', '0')
  el.setAttribute('x', '1')
  el.setAttribute('x', '2')
  await tick(12)
  t.is(log, [null, '2'], 'basic')
  el.setAttribute('x', '3')
  el.setAttribute('x', '4')
  el.setAttribute('x', '5')
  await tick(8)
  t.is(log, [null, '2', '5'], 'updates to latest value')
  el.setAttribute('x', '5')
  el.setAttribute('x', '5')
  el.setAttribute('x', '5')
  await tick(8)
  t.is(log, [null, '2', '5', '5'], 'ignores unchanged value')
  el.setAttribute('x', '6')
  t.is(el.getAttribute('x'), '6', 'reading applies value')
  await tick(8)
  t.is(log, [null, '2', '5', '5', '6'], 'reading applies value')
  // xattrs.cancel()
  xattrs(null)
  el.setAttribute('x', '7')
  await tick(8)
  t.is(el.getAttribute('x'), '7', 'end destroys property')
  t.is(log, [null, '2', '5', '5', '6'], 'end destroys property')
})

t('attr: get/set', async t => {
  let el = document.createElement('x')

  let xs = attr(el, 'x')

  await tick(8)
  t.is(xs(), null)

  xs(true)
  await tick(8)
  t.is(xs(), true)

  xs('abc')
  await tick(8)
  t.is(xs(), 'abc')

  xs(null)
  await tick(8)
  t.is(xs(), null)

  // xs.cancel()
  xs(123)
  await tick(8)
  t.is(xs(), null)
})

t.skip('attr: correct cleanup', async t => {
  // nope: user may clean up himself if needed. Not always resetting to orig value is required, mb temporary setter.
  let el = document.createElement('div')
  el.setAttribute('x', 1)
  let xs = attr(el, 'x')
  t.is(xs(), '1')
  xs(2)
  t.is(el.getAttribute('x'), '2')
  xs(null)
  t.is(el.getAttribute('x'), '1')
})
