import t from 'tst'
import $ from '..'
import on from '../src/on-delegated'

$.fn(on)

t('on: instant trigger must be handled', t => {
  let log = []
  let $el = $`<a.foo/>`

  $el.on('click', () => log.push('click'))
  $el[0].click()
  t.is(log, ['click'])

  // el.use(fn => {
  //   el.on('b', () => log.push('b'))
  //   el.emit('b')
  //   t.is(log, ['b'])
  // })
})

t.skip('on: should be available via html', t => {
  let log = []

  let el = $`<a.foo on=${{ foo: () => log.push('bar') }}`
})

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
