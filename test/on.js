import t from 'tst'
import $ from '../index.js'

t.only('on: should assign event', t => {
  let log = []
  let $el = $`<a.foo/>`

  $el.on('click', () => log.push('foo'))

  t.is(log, [])

  $el[0].click()

  t.is(log, ['foo'])
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
