import t from 'tst'
import $, { state } from '../src/index.js'

t.skip('state: read', async t => {
  let log = []
  $(document.createElement('div'), el => {
    // init/get state
    let { foo = 1, bar } = state()

    log.push('get foo,bar', foo, bar)

    // set registered listener updates element
    state({ foo: 'a', bar: 'b' })

    log.push('set foo,bar')

    // set unregistered listener - ignores element
    if (foo === 'a') {
      state({ baz: c })
      log.push('set baz')
    }
  })

  t.deepEqual(log, ['get foo,bar', 1, undefined, 'set foo,bar', 'get foo,bar', 'a', 'b', 'set baz'])
})

t('state: write')

t('state: not shared')
