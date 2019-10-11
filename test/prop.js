import t from 'tst'
import { prop } from '..'


t.only('prop: basics', async t => {
  let o = {}
  let p = prop(o, 'x')
  let log = []
  ;(async () => {
  for await (const item of p) {
    log.push(item)
  }
  })()
  o.x = 1
  o.x = 2
  await Promise.resolve().then()
  t.is(log, [2], 'basic')
  o.x = 3
  o.x = 4
  o.x = 5
  await Promise.resolve().then()
  t.is(log, [2, 5], 'updates to latest value')
  o.x = 5
  o.x = 5
  await Promise.resolve().then()
  t.is(log, [2, 5], 'ignores unchanged value')
  o.x = 6
  t.is(o.x, 6, 'reading applies value')
  await Promise.resolve()
  t.is(log, [2, 5, 6], 'reading applies value')
  p()
  o.x = 7
  await Promise.resolve().then()
  t.is(o.x, 7, 'end destructures property')
  t.is(log, [2, 5, 6], 'end destructures property')
})

t('prop: invoke callback, if passed')
t('prop: reconfigure descriptors')
t('prop: ignore reconfiguring sealed objects')
t('prop: keep initial property value')
t('prop: does not initialize two times')
t('prop: awaitable - waits the next update')
