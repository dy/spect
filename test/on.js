import t from 'tst'
import { $, on, html } from '..'

t('on: async gen', async t => {
  let el = document.createElement('div')
  let clicks = on(el, 'click', e => cblog.push(e.type))
  let log = []
  let cblog = []
  ;(async () => {
    for await (const e of clicks) {
      log.push(e.type)
    }
  })()
  el.click()
  await Promise.resolve()
  t.is(log, ['click'], 'basic')
  t.is(cblog, ['click'], 'basic')
  el.click()
  el.click()
  await Promise.resolve().then().then().then().then()
  t.is(log, ['click', 'click', 'click'], 'does not skip events')
  t.is(cblog, ['click', 'click', 'click'], 'does not skip events')
  el.click()
  el.click()
  el.click()
  await Promise.resolve().then().then().then().then().then().then().then().then() // unfortunately-ish needs an extra await step for every missed event
  t.is(log, ['click', 'click', 'click', 'click', 'click', 'click'], 'updates to latest value')
  t.is(cblog, ['click', 'click', 'click', 'click', 'click', 'click'], 'updates to latest value')
  clicks.cancel()
  el.click()
  el.click()
  await Promise.resolve().then().then()
  t.is(log, ['click', 'click', 'click', 'click', 'click', 'click'], 'end stops event stream')
  t.is(cblog, ['click', 'click', 'click', 'click', 'click', 'click'], 'end stops event stream')
})
t('on: awaits for the event')

t('on: delegate', async t => {
  let el = document.createElement('x')
  document.body.appendChild(el)
  let log = []
  on('x', 'click', e => {
    log.push(e.type)
  })
  el.click()
  t.is(log, ['click'])
})

t.todo('on: oldschool', async t => {
  let log = []
  let el = html`<a.foo/>`

  let off = on(el, 'click', () => log.push('click'))
  el.click()
  t.is(log, ['click'])

  off()
  el.click()
  await Promise.resolve().then().then()
  t.is(log, ['click'])
  // el.use(fn => {
  //   el.on('b', () => log.push('b'))
  //   el.emit('b')
  //   t.is(log, ['b'])
  // })
})

t.todo('on: await', async t => {
  let log = []
  let el = html`<div/>`

  let off

  ;(async () => {
    while (true) {
      off = on(el, 'click')
      let e = await off
      log.push(e.type)
    }
  })()

  t.is(log, [])
  el.click()
  // FIXME: why two ticks here?
  await Promise.resolve().then().then()
  t.is(log, ['click'])

  off()

  el.click()
  // FIXME: why two ticks here?
  await Promise.resolve().then().then()
  t.is(log, ['click'])
})

t.todo('on: multiple events', t => {
  let log = []
  let el = document.createElement('div')
  let off = on(el, 'touchstart click', e => log.push(e.type))

  el.click()
  t.is(log, ['click'])
  fire(el, 'touchstart')
  t.is(log, ['click', 'touchstart'])
  el.click()
  t.is(log, ['click', 'touchstart', 'click'])

  off()

  el.click()
  t.is(log, ['click', 'touchstart', 'click'])
  fire(el, 'touchstart')
  t.is(log, ['click', 'touchstart', 'click'])
})

t.todo('on: await multiple', async t => {
  let log = []
  let el = document.createElement('div')
  document.body.appendChild(el)

  let off

  ;(async () => {
    while(true) {
      off = on(el, 'touchstart focus click')
      let e = await off
      log.push(e.type)
    }
  })()

  t.is(log, [])
  fire(el, 'focus')
  // FIXME: what the heck?
  await Promise.resolve().then().then().then().then().then()
  t.is(log, ['focus'])

  fire(el, 'click')
  await Promise.resolve().then().then().then().then().then()
  t.is(log, ['focus', 'click'])

  off()

  fire(el, 'touchstart')
  await Promise.resolve().then().then().then().then().then()
  t.is(log, ['focus', 'click'])

  document.body.removeChild(el)
})

t.todo('on: sequences handled as return result', async t => {
  let log = []
  let el = html`<div/>`

  let off = on(el, 'in > out', e => {
    log.push('in')
    return () => log.push('out')
  })

  fire(el, 'in')
  await off

  t.is(log, ['in'])
  fire(el, 'out')
  await off
  t.is(log, ['in', 'out'])
  fire(el, 'in')
  await off
  t.is(log, ['in', 'out', 'in'])
  fire(el, 'in')
  fire(el, 'out')
  await off
  t.is(log, ['in', 'out', 'in', 'out'], 'duplicate is ignored')
  fire(el, 'out')
  fire(el, 'in')
  await off
  t.is(log, ['in', 'out', 'in', 'out', 'in'])
})

t.todo('on: nodelist/htmlcollection as target')

t.skip('on: sequences unbind themselves', t => {
  let log = []

  let $el = $`<a.foo/>`

  $el.on('mousedown', e => {
    log.push(1)
    $(e.currentTarget).on('mouseup', e => (log.push(2), () => log.push(4)))
  })

  $el.emit(new MouseEvent('mouseup'))
  t.is(log, [])

  $el.emit(new MouseEvent('mousedown'))
  t.is(log, [1])

  $el.emit(new MouseEvent('mouseup'))
  t.is(log, [1, 2])

  $el.emit(new MouseEvent('mousedown'))
  t.is(log, [1, 2, 1])
})
