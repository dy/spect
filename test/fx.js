import t from 'tst'
import $ from '..'
import 'setimmediate'

t('fx: global effect is triggered after current callstack', async t => {
  let log = []
  $(document.createElement('a')).fx(() => log.push('a'))

  t.is(log, [])

  await Promise.resolve()

  t.is(log, ['a'])
})

t('fx: runs destructor', async t => {
  let log = []
  let $a = $(document.createElement('a'))

  let id = 0
  let fn = () => {
    // called each time
    $a.fx(() => {
      log.push('init 1')
      return () => log.push('destroy 1')
    })

    // called once
    $a.fx(() => {
      log.push('init 2')
      return () => log.push('destroy 2')
    }, [])

    // called any time deps change
    $a.fx(() => {
      log.push('init 3')
      return () => log.push('destroy 3')
    }, [id])
  }

  $a.use(fn)
  await Promise.resolve()
  t.is(log, ['init 1', 'init 2', 'init 3'])

  log = []
  $a._update()
  await Promise.resolve()
  t.is(log, ['destroy 1', 'init 1'])

  log = [], id = 1
  $a._update()
  await Promise.resolve()
  t.is(log, ['destroy 1', 'destroy 3', 'init 1', 'init 3'])
})

t.only('fx: toggle deps', async t => {
  let log = []
  let $a = $`<a/>`

  $a.use(el => {
    $a.fx(() => {
      log.push('on')
      return () => log.push('off')
    }, $a.attr('on'))
  })

  t.is(log, [])

  console.log('set on')
  $a.attr('on', true)

  t.is(log, ['on'])
})

t.todo('fx: readme case', t => {
  $(document.createElement('div'), el => {
    fx(async () => {
      html`Loading...`

      t.equal(el.innerHTML, 'Loading...')
      console.log(currentState)

      html`Loaded ${await (() => 123)}`
      console.log(currentState)

      t.equal(el.innerHTML, 'Loaded 123')
    }, [])
  })
})

t.todo('fx: sync fx', t => {
  let log = []
  let target = document.createElement('div')
  let count = 0

  const aspect = el => {
    log.push('before')

    // unchanged dep
    fx(() => {
      log.push('foo')
      html`<foo/>`
      t.equal(el.innerHTML, '<foo></foo>', 'html aftereffect')

      return () => log.push('un-foo')
    }, [])

    // direct dep
    fx(() => {
      html`<bar/>`
      t.equal(el.innerHTML, '<bar></bar>')
      log.push('bar')

      return () => log.push('un-bar')
    }, count)

    // no deps
    fx(() => {
      html`<baz/>`
      t.equal(el.innerHTML, '<baz></baz>')
      log.push('baz')

      return () => log.push('un-baz')
    })

    log.push('after')
  }

  $(target, aspect)
  t.deepEqual(log, ['before', 'after', 'foo', 'bar', 'baz'], 'correct sequence of calls')

  // console.log('---update')
  count++
  log = []
  $.update(target, aspect)
  t.deepEqual(log, ['before', 'after', 'un-bar', 'un-baz', 'bar', 'baz'], 'correct repeated call')

  // console.log('---destroy')
  log = []
  $.destroy(target, aspect)
  t.deepEqual(log, ['un-foo', 'un-bar', 'un-baz'], 'correct destroyal')

})

t.todo('fx: async fx', t => {
  let log = []

  $(document.createElement('div'), el => {
    fx(async () => {
      await null
      log.push('foo')
      html`<foo/>`
      t.equal(el.innerHTML, '<foo></foo>', 'html aftereffect')

      return () => {
        log.push('un-foo')
      }
    }, [])

    // fx(async () => {
    //   t.equal(el.innerHTML, '<foo></foo>')
    //   html`<bar/>`
    //   t.equal(el.innerHTML, '<bar></bar>')
    // }, [])
  })

  // t.deepEqual(log, ['before', 'between', 'after', 'foo', 'bar'], 'correct sequence of calls')
})

t('fx: generator fx')

t('fx: promise')

t('fx: dep cases')

t('fx: no-deps call')

t('fx: varying number of effects')

t('fx: removes all effects on aspect removal')
