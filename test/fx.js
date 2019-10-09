import t from 'tst'
import { $, fx, store } from '..'



t.todo('fx: basic API', async t => {
  let log = []
  let state = store()
  let state2 = store()
  t.is(state === state2, false)

  let disable = fx(() => {
    log.push('in')
    state.x
    return () => log.push('out')
  })

  t.is(log, ['in'])

  state.x = 1
  state2.y = 1

  await Promise.resolve().then()
  t.is(log, ['in', 'out', 'in'])

  // TODO
  // disable()
  // state.x = 2
  // await Promise.resolve().then()
  // t.is(log, ['in', 'out', 'in'])
})

t.todo('fx: global effect is triggered after current callstack', async t => {
  let log = []
  $(document.createElement('a')).fx(() => log.push('a'))

  t.is(log, [])

  await ''

  t.is(log, ['a'])
})

t.todo('fx: runs destructor', async t => {
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

  await $a.use(fn)
  t.is(log, ['init 1', 'init 2', 'init 3'])

  log = []
  await $a.update()
  t.is(log, ['destroy 1', 'init 1'])

  log = [], id = 1
  await $a.update()
  t.is(log, ['destroy 1', 'destroy 3', 'init 1', 'init 3'])
})

t.todo('fx: toggle deps', async t => {
  let log = []
  let $a = $`<a/>`

  await $a.use(() => {
    $a.fx(() => {
      log.push('on')
      return () => log.push('off')
    }, !!$a.prop('on'))
  })

  t.is(log, [])

  await $a.prop('on', false)
  t.is(log, [])

  await $a.prop('on', true)
  t.is(log, ['on'])

  await $a.prop('on', true)
  t.is(log, ['on'])

  await $a.prop('on', false)
  t.is(log, ['on', 'off'])

  await $a.prop('on', false)
  t.is(log, ['on', 'off'])

  await $a.prop('on', true)
  t.is(log, ['on', 'off', 'on'])

  await $a.prop('on', true)
  t.is(log, ['on', 'off', 'on'])

  await $a.prop('on', false)
  t.is(log, ['on', 'off', 'on', 'off'])
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

t.todo('fx: async fx', async t => {
  let log = []

  await $(document.createElement('div')).use(el => {
    el.fx(async () => {
      await null
      log.push('foo')
      el.html`<foo/>`
      t.equal(el.innerHTML, '<foo></foo>', 'html aftereffect')

      return () => {
        log.push('un-foo')
      }
    }, [])

    el.fx(async () => {
      await null
      t.equal(el.innerHTML, '<foo></foo>')
      el.html`<bar/>`
      t.equal(el.innerHTML, '<bar></bar>')
    }, [])
  })

  // t.deepEqual(log, ['before', 'between', 'after', 'foo', 'bar'], 'correct sequence of calls')
})

t.todo('fx: generator fx')

t.todo('fx: promise')

t.todo('fx: dep cases')

t.todo('fx: no-deps call')

t.todo('fx: varying number of effects')

t.todo('fx: removes all effects on aspect removal')



t.todo('fx: runs destructor', async t => {
  let log = []
  let $a = spect({})

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
  await Promise.resolve().then()
  t.is(log, ['init 1', 'init 2', 'init 3'])

  log = []
  $a.update()
  await Promise.resolve().then()
  t.is(log, ['destroy 1', 'init 1'])

  log = [], id = 1
  $a.update()
  await Promise.resolve().then()
  t.is(log, ['destroy 1', 'destroy 3', 'init 1', 'init 3'])
})

t.todo('fx: toggle deps', async t => {
  let log = []
  let $a = spect()

  $a.use(() => {
    $a.fx(() => {
      log.push('on')
      return () => log.push('off')
    }, !!$a.prop('on'))
  })

  t.is(log, [])
  await Promise.resolve().then()

  $a.prop('on', false)
  await Promise.resolve().then()
  t.is(log, [])

  $a.prop('on', true)
  await Promise.resolve().then()
  t.is(log, ['on'])

  $a.prop('on', true)
  await Promise.resolve().then()
  t.is(log, ['on'])

  $a.prop('on', false)
  await Promise.resolve().then()
  t.is(log, ['on', 'off'])

  $a.prop('on', false)
  await Promise.resolve().then()
  t.is(log, ['on', 'off'])

  $a.prop('on', true)
  await Promise.resolve().then()
  t.is(log, ['on', 'off', 'on'])

  $a.prop('on', true)
  await Promise.resolve().then()
  t.is(log, ['on', 'off', 'on'])

  $a.prop('on', false)
  await Promise.resolve().then()
  t.is(log, ['on', 'off', 'on', 'off'])
})

t.todo('fx: async fx chain', async t => {
  let log = []
  let a = spect().fx(() => log.push(1)).fx(() => log.push(2))
  t.is(log, [])
  await a.fx(() => log.push(3))
  t.is(log, [1, 2, 3])
})

t.todo('fx: async fx', async t => {
  let log = []

  let el = spect().use(async () => {
    await el.fx(async () => {
      await null
      log.push('foo')
      return () => {
        log.push('unfoo')
      }
    })
  })
  await el

  t.is(log, ['foo'])

  await el.update()

  t.is(log, ['foo', 'unfoo', 'foo'])
})
