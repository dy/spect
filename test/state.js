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

t.only('state: render from another tick from another scope', t => {
  let log = [],
    el = document.createElement('div'),
    el2 = document.createElement('div')


  function aspect(el) {
    log.push(state().x)

    $(el2, el2 => {});

    (
      () => {
        $(el2, el2 => {});
        setTimeout(() => {
          $(el2, el2 => {});

          (() => state({ x: 1 }))()
        })
      }
    )()
  }

  $(el, aspect)

  t.deepEqual(log, [undefined])

  setTimeout(() => {
    t.deepEqual(log, [undefined, 1])
  }, 10)
})
