import t from 'tst'
import $ from '..';

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

    $el.state({c: 1, d: 2})

    t.is($el.state`c`, 1)
  })
})

t('state: functional get/set', t => {
  let $a = $`<a/>`

  $a.state(s => s.count = 0)

  t.is($a.state(), {count: 0})

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

  function fn (el) {
    $a = $(el)

    $a.state({ x }, [])
  }
})

t('state: reducer must be called for each element in a set', t => {
  let $a = $([
    document.createElement('a'),
    document.createElement('a')
  ])

  $($a[0]).state({x: 1})
  $($a[1]).state({x: 2})

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

t.todo('state: trigger rerendering', t => {
  let stop = 0
  let $els = $`<div.a/><div.b/><div.c/>`.use(a => {
    let $a = $(a)

    $a.state({count: 0}, [])
    if ($a[0].class.a) $a.state({ count: 1}, [])
    else if ($a[0].class.b) $a.state({ count: 2}, [])

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

  $a.state({x: 1})

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
