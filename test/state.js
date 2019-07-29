import t from 'tst'
import $, { state } from '../src/index.js'

t('state: destructuring', async t => {
  let log = []
  $(document.createElement('div'), el => {
    // init/get state
    let { foo = 1, bar } = state()

    log.push('get foo,bar', foo, bar)

    // set registered listener updates element
    state({ foo: 'a', bar: 'b' })

    log.push('set foo,bar')
  })

  t.deepEqual(log, ['get foo,bar', 1, undefined, 'set foo,bar', 'get foo,bar', 'a', 'b', 'set foo,bar'])
})

t('state: direct state', t => {
  let log = []
  $(document.createElement('div'), el => {
    let s = state()

    log.push('get foo,bar', s.foo, s.bar)

    Object.assign(s, { foo: 'a', bar: 'b' })

    log.push('set foo,bar')
  })

  t.deepEqual(log, ['get foo,bar', undefined, undefined, 'set foo,bar', 'get foo,bar', 'a', 'b', 'set foo,bar'])
})

t('state: not shared between aspects', t => {
  let log = [], el = document.createElement('div')

  $(el, el => {
    log.push('a')
    state({foo: 'bar'})
  })

  $(el, el => {
    let { foo } = state()
    log.push('b', foo)
  })

  t.deepEqual(log, ['a', 'a', 'b', undefined])
})
