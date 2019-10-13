import t from 'tst'
import { prop } from '..'


t('prop: basics', async t => {
  let o = {x: 0}
  let xs = prop(o, 'x')
  let log = []
  ;(async () => {
  for await (const item of xs) {
    log.push(item)
  }
  })()
  await Promise.resolve().then()
  t.is(log, [0], 'basic')
  o.x = 1
  o.x = 2
  await Promise.resolve().then()
  t.is(log, [0, 2], 'basic')
  o.x = 3
  o.x = 4
  o.x = 5
  await Promise.resolve().then()
  t.is(log, [0, 2, 5], 'updates to latest value')
  o.x = 5
  o.x = 5
  await Promise.resolve().then()
  t.is(log, [0, 2, 5], 'ignores unchanged value')
  o.x = 6
  t.is(o.x, 6, 'reading applies value')
  await Promise.resolve()
  t.is(log, [0, 2, 5, 6], 'reading applies value')
  o.x = 7
  o.x = 6
  await Promise.resolve()
  t.is(log, [0, 2, 5, 6], 'changing and back does not cause trigger')
  xs.end()
  o.x = 7
  await Promise.resolve().then()
  t.is(o.x, 7, 'end destructures property')
  t.is(log, [0, 2, 5, 6], 'end destructures property')
})

t('prop: should run initial value', async t => {
    let log = [], obj = { x: 0, y: 0 }

    prop(obj, 'x', (x) => {
      log.push(x)
    })
    await Promise.resolve()

    t.is(log, [0])
    obj.x = 1
    await Promise.resolve().then().then()
    t.is(log, [0, 1])
    // obj.y = 2
    // await Promise.resolve().then()
    // t.is(log, [1, undefined, 1,2])
})
t('prop: invoke callback, if passed')
t('prop: reconfigure descriptors')
t('prop: ignore reconfiguring sealed objects')
t('prop: keep initial property value')
t('prop: does not initialize two times')
t('prop: awaitable - waits the next update')
t.only('prop: observe array methods', async t => {
  let obj = {arr: []}
  let log = []

  await prop(obj, 'arr', arr => {
    log.push(...arr)
  })

  obj.arr.push(1)

  await Promise.resolve()

  t.is(log, [1])
})
