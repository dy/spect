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
  await Promise.resolve().then().then()
  t.is(log, [0], 'basic')
  o.x = 1
  o.x = 2
  await Promise.resolve().then().then().then().then().then().then().then()
  t.is(log, [0, 2], 'basic')
  o.x = 3
  o.x = 4
  o.x = 5
  await Promise.resolve().then().then()
  t.is(log, [0, 2, 5], 'updates to latest value')
  o.x = 5
  o.x = 5
  await Promise.resolve().then().then()
  t.is(log, [0, 2, 5], 'ignores unchanged value')
  o.x = 6
  t.is(o.x, 6, 'reading value')
  await Promise.resolve().then()
  t.is(log, [0, 2, 5, 6], 'reading applies value')
  await Promise.resolve().then()
  t.is(log, [0, 2, 5, 6], 'reading has no side-effects')
  o.x = 7
  o.x = 6
  await Promise.resolve().then().then()
  t.is(log, [0, 2, 5, 6], 'changing and back does not cause trigger')
  xs.cancel()
  o.x = 7
  await Promise.resolve().then().then().then()
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
t('prop: multiple props to observe as array')
t('prop: keeps prev setter/getter', async t => {
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

  let xs = prop(obj, 'x', value => {
    log.push('changed', value)
  })

  obj.x
  await Promise.resolve().then()
  t.is(log, ['get', 0, 'changed', 0, 'get', 0])

  obj.x = 1
  await Promise.resolve().then().then().then().then()
  t.is(log, ['get', 0, 'changed', 0, 'get', 0, 'set', 1, 'changed', 1])

  log = []
  xs.cancel()
  t.is(log, [])

  obj.x
  t.is(log, ['get', 1])

  obj.x = 0
  await Promise.resolve().then().then()
  t.is(log, ['get', 1, 'set', 0])
})
t.skip('prop: observe array methods', async t => {
  let obj = {arr: []}
  let log = []

  await prop(obj, 'arr', arr => {
    log.push(...arr)
  })

  obj.arr.push(1)

  await Promise.resolve()

  t.is(log, [1])
})

t('prop: observe element props', async t => {
  let log = []
  let el = document.createElement('input')
  prop(el, 'value', v => {
    log.push(v)
  })
  document.body.appendChild(el)
  el.focus()
  el.value = '1'
  el.dispatchEvent(new Event('change'))
  el.dispatchEvent(new Event('blur'))
  // el.blur()

  await Promise.resolve().then().then().then()

  t.is(log, ['', '1'])

  document.body.removeChild(el)
})

t('prop: multiple listeners', async t => {
  let log1 = []
  let log2 = []
  let obj = {items: []}
  await Promise.resolve().then().then()
  prop(obj, 'items', list => {
    log1.push(list)
  })
  await Promise.resolve().then().then()
  t.is(log1, [[]])
  prop(obj, 'items', list => {
    log2.push(list)
  })
  await Promise.resolve().then().then()
  t.is(log1, [[]])
  t.is(log2, [[]])
  obj.items = [1,2,3]
  await Promise.resolve().then().then()
  t.is(log1, [[], [1,2,3]])
  t.is(log2, [[], [1,2,3]])
})

t('prop: must return stream', t => {
  t.is(!!prop({}, 'x'), true)
})

t('prop: separate props', async t => {
  let log = []
  let obj = {x: 0, y: 0}
  prop(obj, 'x', x => log.push('x' + x))
  prop(obj, 'y', y => log.push('y' + y))

  await Promise.resolve().then().then()
  t.is(log, ['x0', 'y0'])

  obj.x = 1
  await Promise.resolve().then().then()
  t.is(log, ['x0', 'y0', 'x1'])
})
