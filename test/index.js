import t from 'tst'
import spect from '..'

t.only('counter', t => {
  let $n = spect({
    x: 1, [Symbol.toStringTag]() {
      return 'Validator';
    }})

  $n.use(({state}) => {
    state({count: 0}, [])

    console.log(state('count'))

    setTimeout(() => {
      state(s => ++s.count)
    }, 1000)
  })
})

t('$: empty / primitive selectors', t => {
  let $x = spect()
  let $x1 = spect()
  t.is($x !== $x1, true)

  $x.state('x', 1)
  t.is($x.state('x'), 1)

  let $y = spect('xyz')
  let $y1 = spect('xyz')
  t.is($y !== $y1, true)

  $y.state('y', 1)
  t.is($y.state('y'), 1)

  let $z = spect(null)
  let $z1 = spect(null)
  t.is($z !== $z1, true)

  $z.state('y', 1)
  t.is($z.state('y'), 1)
})

t.todo('registering effects', t => {

})

t('use: aspects must be called in order', async t => {
  let log = []
  let a = {}
  await spect(a).use(() => log.push(1), () => log.push(2), () => log.push(3))
  t.deepEqual(log, [1, 2, 3])
})

t('use: duplicates are ignored', async t => {
  let log = []

  await spect({}).use(fn, fn, fn)

  function fn() {
    log.push(1)
  }

  t.is(log, [1])

  await spect({}).use(fn, fn, fn)

  t.is(log, [1, 1])
})

t('use: aspects must not be called multiple times, unless target state changes', async t => {
  let log = []

  let $a = spect({})
  await $a.use(fn)
  t.is(log, ['x'])
  await $a.use(fn)
  t.is(log, ['x'])
  await $a.use(fn, fn)
  t.is(log, ['x'])
  await $a.update()
  t.is(log, ['x', 'x'])

  function fn(el) { log.push('x') }
})

t.skip('use: same aspect different targets', t => {
  let log = []
  function fx([el]) {
    log.push(el.tagName)
    // return () => log.push('destroy ' + el.tagName)
  }

  let $el = spect({tagName: 'A'}).use(fx)

  t.is($el.target.tagName, log[0])
  t.is(log, ['A'])

  $el.target.innerHTML = '<span></span>'
  $($el.target.firstChild).use(fx)

  t.deepEqual(log, ['A', 'SPAN'])
})

t('use: Same target different aspects', t => {
  let log = []

  let a = document.createElement('a')
  document.body.appendChild(a)

  let afx, bfx
  $('a').use(afx = () => (log.push('a'), () => log.push('de a')))
  t.deepEqual(log, ['a'])
  $('a').use(bfx = () => (log.push('b'), () => log.push('de b')))
  t.deepEqual(log, ['a', 'b'])

  document.body.removeChild(a)
})

t('use: same aspect same target', t => {
  let log = []
  let a = document.createElement('a')
  document.body.appendChild(a)

  let fx = () => (log.push('a'), () => log.push('z'))
  $(a).use(fx)
  t.deepEqual(log, ['a'])
  $(a).use(fx)
  t.deepEqual(log, ['a'])
  $('a').use(fx)
  t.deepEqual(log, ['a'])

  document.body.removeChild(a)
})

t('use: subaspects init themselves independent of parent aspects', t => {
  let log = []

  let a = document.body.appendChild(document.createElement('a'))
  let b = a.appendChild(document.createElement('b'))
  let c = b.appendChild(document.createElement('c'))

  $('a').use(el => {
    log.push('a')
    $('b').use(el => {
      log.push('b')
      $('c').use(el => {
        log.push('c')
        // return () => log.push('-c')
      })
      // return () => log.push('-b')
    })
    // return () => log.push('-a')
  })

  t.deepEqual(log, ['a', 'b', 'c'])

  // $.destroy(a)

  // t.deepEqual(log, ['a', 'b', 'c', '-c', '-b', '-a'])

  document.body.removeChild(a)
})

t.todo('use: generators aspects')

t.todo('use: async aspects')


t.todo('use: promise (suspense)', t => {
  $('div', import('url'))
})

t.todo('use: hyperscript case', t => {
  $('div', () => {

  })
})

t.todo('use: new custom element', t => {
  $('custom-element', () => {

  })
})


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
  $a.update()
  await Promise.resolve()
  t.is(log, ['destroy 1', 'init 1'])

  log = [], id = 1
  $a.update()
  await Promise.resolve()
  t.is(log, ['destroy 1', 'destroy 3', 'init 1', 'init 3'])
})

t('fx: toggle deps', async t => {
  let log = []
  let $a = $`<a/>`

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


t('state: direct get/set', t => {
  $`<div.a/>`.use(el => {
    let $el = $(el)

    $el.state('c', 1)

    t.is($el.state`c`, 1)
  })
})

t('state: object set', t => {
  $`<div.a/>`.use(el => {
    let $el = $(el)

    $el.state({ c: 1, d: 2 })

    t.is($el.state`c`, 1)
  })
})

t('state: functional get/set', t => {
  let $a = $`<a/>`

  $a.state(s => s.count = 0)

  t.is($a.state(), { count: 0 })

  $a.state(s => s.count++)
  t.is($a.state`count`, 1)
})

t('state: init gate', t => {
  let log = [], x = 1
  let $a = $`<a/>`

  $a.use(fn)
  t.is($a.state`x`, 1)

  x++
  $a.use(fn)
  t.is($a.state`x`, 1)

  function fn(el) {
    $a = $(el)

    $a.state({ x }, [])
  }
})

t('state: reducer must be called for each element in a set', t => {
  let $a = $([
    document.createElement('a'),
    document.createElement('a')
  ])

  $($a[0]).state({ x: 1 })
  $($a[1]).state({ x: 2 })

  let log = []
  $a.state(s => {
    log.push(s.x)
  })

  t.is(log, [1, 2])
})

t.skip('state: counter', t => {
  let stop = 0
  let $els = $`<div.a/>`.use(a => {
    let $a = $(a)
    $a.init(() => {
      $a.state({ count: 0 })
    })

    console.log($a.state`count`)
    $a.fx(s => {
      if (stop < 6) {
        setTimeout(() => {
          $a.state(s => s.count++)
          stop++
        }, 1000)
      }
    }, [$a.state`count`])
  })
})

t('state: get/set path', t => {
  let $a = $`<a/>`

  t.is($a.state('x.y.z'), undefined)

  $a.state('x.y.z', 1)
  t.is($a.state(), { x: { y: { z: 1 } } })
  t.is($a.state('x.y.z'), 1)
})

t.todo('state: trigger rerendering', t => {
  let stop = 0
  let $els = $`<div.a/><div.b/><div.c/>`.use(a => {
    let $a = $(a)

    $a.state({ count: 0 }, [])
    if ($a[0].class.a) $a.state({ count: 1 }, [])
    else if ($a[0].class.b) $a.state({ count: 2 }, [])

    // $a.html = $a.state.count
    console.log($a.state`count`)
    $a.fx(s => {
      if (stop < 6) {
        // console.log('fx---')
        // console.log($a.state(s => s.count++))
        // console.log($a.state`count`)
        setTimeout(() => {
          $a.state(s => s.count++)
          stop++
        }, 1000)
      }
    }, [$a.state`count`])
  })

  // t.is($($els[0]).state.count, 1)
  // t.is($($els[1]).state.count, 2)
  // t.is($($els[2]).state.count, 0)
})

t.todo('state: functional setter/getter', t => {
  $a.fx($a => {
    let { count = 0 } = $a.state()

    $a.text = count

    setTimeout(() => {
      $a.state({ count: count++ })
    })
  })
})

t('state: reading state registers any-change listener', async t => {
  let log = []
  let $a = $`<a/>`

  $a.use(el => {
    let $el = $(el)
    let s = $el.state()

    setTimeout(() => {
      log.push(s.x)
    })
  })

  $a.state({ x: 1 })

  await new Promise(ok => setTimeout(() => {
    t.is(log, [1])
    ok()
  }))
})

t.todo('state: reading state from async stack doesnt register listener', t => {
  $a.fx($el => setTimeout(() => {
    $el.html`${$el.state.x}`
  }))
  $a.state.x = 1
})

t.todo('state: reading external component state from asynchronous tick', t => {
  $a.fx($a => {
    // NOTE: reading state is limited to the same scope as fx
    // reading from another scope doesn't register listener
    // FIXME: should we ever register external state listeners?
    // we can trigger direct element rerendering, and trigger external updates via fx desp
    // that will get us rid of that problem, that isn't going to be very smart
    setTimeout(() => {
      $b.state.x
    })
  })

  $b.state.x = 1
})


t.todo('state: multiple selectors state', t => {
  let $ab = $([a, b])
  let $a = $($ab[0])

  $ab.state.x = 1
  $a.state.x = 2

  // state is bound per-element
  // but setting state broadcasts it to all elements in the selector

  $ab.state.x //jquery returns $a.state.x
})

t.todo('state: safe access to props')

t.todo('state: deps cases')

t.todo('state: nested props access')



t.todo('state: destructuring', async t => {
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

t.todo('state: direct state', t => {
  let log = []
  $(document.createElement('div'), el => {
    let s = state()

    log.push('get foo,bar', s.foo, s.bar)

    Object.assign(s, { foo: 'a', bar: 'b' })

    log.push('set foo,bar')
  })

  t.deepEqual(log, ['get foo,bar', undefined, undefined, 'set foo,bar', 'get foo,bar', 'a', 'b', 'set foo,bar'])
})

t.todo('state: not shared between aspects', t => {
  let log = [], el = document.createElement('div')

  $(el, el => {
    log.push('a')
    state({ foo: 'bar' })
  })

  $(el, el => {
    let { foo } = state()
    log.push('b', foo)
  })

  t.deepEqual(log, ['a', 'a', 'b', undefined])
})

t.todo('state: render from another tick from another scope', t => {
  let log = [],
    el = document.createElement('div'),
    el2 = document.createElement('div')


  function aspect(el) {
    log.push(state().x)

    $(el2, el2 => { });

    (
      () => {
        $(el2, el2 => { });
        setTimeout(() => {
          $(el2, el2 => { });

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

t('prop: direct get/set', t => {
  $`<div.a/>`.use(el => {
    let $el = $(el)

    $el.prop('c', 1)
    t.is($el.prop`c`, 1)
  })
})

t('prop: object set', t => {
  $`<div.a/>`.use(el => {
    let $el = $(el)

    $el.prop({ c: 1, d: 2 })

    t.is($el.prop`c`, 1)
  })
})

t('prop: functional get/set', t => {
  let $a = $`<a/>`

  $a.prop(s => s.count = 0)

  t.is($a.prop(), $a[0])

  $a.prop(s => {
    s.count++
  })
  t.is($a.prop`count`, 1)
})

t.skip('prop: counter', t => {
  let stop = 0
  let $els = $`<div.a/>`.use(a => {
    let $a = $(a)
    $a.init(() => {
      $a.prop({ count: 0 })
    })

    console.log($a.prop`count`)
    $a.fx(s => {
      if (stop < 6) {
        setTimeout(() => {
          $a.prop(s => s.count++)
          stop++
        }, 1000)
      }
    }, [$a.prop`count`])
  })
})
