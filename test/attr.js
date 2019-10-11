import t from 'tst'
import { attr } from '..'



t('attr: walk generator', async t => {
  let el = document.createElement('div')
  let end = attr(el, 'x')
  let log = []
    ; (async () => {
      for await (const value of end) {
        log.push(value)
      }
    })()
  el.setAttribute('x', '1')
  el.setAttribute('x', '2')
  await Promise.resolve().then()
  t.is(log, ['2'], 'basic')
  el.setAttribute('x', '3')
  el.setAttribute('x', '4')
  el.setAttribute('x', '5')
  await Promise.resolve().then()
  t.is(log, ['2', '5'], 'updates to latest value')
  el.setAttribute('x', '5')
  el.setAttribute('x', '5')
  await Promise.resolve().then()
  t.is(log, ['2', '5'], 'ignores unchanged value')
  el.setAttribute('x', '6')
  t.is(el.getAttribute('x'), '6', 'reading applies value')
  await Promise.resolve().then()
  t.is(log, ['2', '5', '6'], 'reading applies value')
  end()
  el.setAttribute('x', '7')
  await Promise.resolve().then()
  t.is(el.getAttribute('x'), '7', 'end destructures property')
  t.is(log, ['2', '5', '6'], 'end destructures property')
})
