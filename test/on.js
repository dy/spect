import t from 'tst'
import $ from '..'

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

t.todo('on: should be available via html', t => {
  let foo = []

  let el = $`<a.foo on=${{ foo: () => log.push('bar') }}`
})

