import t from 'tst'
import $ from '../index.js'

t('on: instant trigger must be handled', t => {
  let log = []
  let el = $`<a.foo/>`

  el.on('a', () => log.push('a'))
  el.emit('a')
  t.is(log, ['a'])

  // el.use(fn => {
  //   el.on('b', () => log.push('b'))
  //   el.emit('b')
  //   t.is(log, ['b'])
  // })
})

t('on: should be available via html', t => {
  let foo = []

  let el = $`<a.foo on=${{ foo: () => log.push('bar') }}`
})

t('on: assign / destruct listeners, basic ', t => {
  let $els = $`<div />`

  $els.use($el => {
    $el.on('click', () => {

    })
  })
})
