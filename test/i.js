import t from 'tst'
import { i } from '../index.js'
import { tick, frame, time } from 'wait-please'

// input
t('i: input text', async t => {
  let el = document.createElement('input')
  document.body.appendChild(el)
  let text = i(el)
  text(v => console.log(v))

  let cb = document.createElement('input')
  cb.setAttribute('type', 'checkbox')
  document.body.appendChild(cb)
  let bool = i(cb)
  bool(v => console.log(v))

  let sel = document.createElement('select')
  sel.innerHTML = `<option value=1>A</option><option value=2>B</option>`
  document.body.appendChild(sel)
  let enm = i(sel)
  enm(v => console.log(v))
})
t('i: input updates by changing value directly', async t => {
  let el = document.createElement('input')
  el.value = 0
  let value = i(el)
  t.is(value(), '0')

  // observer 1
  let log = []
  value(v => log.push(v))

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
  t.is(log.slice(-1), ['5'], 'updates to latest value')

  el.value = 6
  el.dispatchEvent(new Event('change'))
  t.is(el.value, '6', 'reading value')
  await tick(8)
  t.is(log.slice(-1), ['6'], 'reading has no side-effects')

  value[Symbol.dispose]()
  el.value = 7
  el.dispatchEvent(new Event('change'))
  t.is(el.value, '7', 'end destructs inputerty')
  await tick(10)
  t.is(log.slice(-1), ['6'], 'end destructs inputerty')
})
t('i: input get/set', async t => {
  let el = document.createElement('input')
  let value = i(el)
  value(0)
  t.is(el.value, '0', 'set is ok')
  t.is(value(), '0', 'get is ok')
  await tick(8)
  t.is(el.value, '0', 'set is ok')
  t.is(value(), '0', 'get is ok')
})
t('i: template literal', async t => {
  let el = document.createElement('input')
  document.body.appendChild(el).id = 'itpl'
  let value = i`#itpl`
  value(0)
  t.is(el.value, '0', 'set is ok')
  t.is(value(), '0', 'get is ok')
  await tick(8)
  t.is(el.value, '0', 'set is ok')
  t.is(value(), '0', 'get is ok')
  document.body.removeChild(el)
})
t('i: input checkbox', async t => {
  let el = document.createElement('input')
  el.type = 'checkbox'
  document.body.appendChild(el)
  let bool = i(el)
  t.is(bool(), false)
  t.is(el.checked, false)
  t.is(el.value, '')

  el.checked = true
  el.dispatchEvent(new Event('change'))
  t.is(bool(), true)
  t.is(el.checked, true)
  t.is(el.value, 'on')

  bool(false)
  t.is(bool(), false)
  t.is(el.checked, false)
  t.is(el.value, '')

  bool[Symbol.dispose]()
  // t.throws(() => bool(true))
  bool(true)
  t.is(bool(), undefined)
  t.is(el.checked, false)
  t.is(el.value, '')
})
t('i: input select', async t => {
  let el = document.createElement('select')
  el.innerHTML = '<option value=1 selected>A</option><option value=2>B</option>'
  // document.body.appendChild(el)
  let value = i(el)
  t.is(value(), '1')
  t.is(el.value, '1')

  el.value = '2'
  el.dispatchEvent(new Event('change'))
  t.is(value(), '2')
  t.is(el.value, '2')
  t.is(el.innerHTML, '<option value="1">A</option><option value="2" selected="">B</option>')

  value('1')
  t.is(value(), '1')
  t.is(el.innerHTML, '<option value="1" selected="">A</option><option value="2">B</option>')
  t.is(el.value, '1')

  value[Symbol.dispose]()
  // t.throws(() => value('2'))
  value('2')
  t.any(value(), [null, undefined, '1'])
  t.is(el.innerHTML, '<option value="1" selected="">A</option><option value="2">B</option>')
  t.is(el.value, '1')
})
t.todo('i: input radio')
t.todo('i: input range')
t.todo('i: input date')
t.todo('i: input multiselect')
t.todo('i: input form')
