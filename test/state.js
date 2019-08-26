import t from 'tst'
import $ from '../index';

t('state: simple get/set', t => {
  let $els = $`<div.a/>`.use(el => {
    let $el = $(el)

    $el.state('c', 1)

    t.is($el.state`c`, 1)
  })
})

t.only('state: init gate', t => {
  let log = [], x = 1
  let $a = $`<a/>`

  $a.use(fn)
  t.is($a.state`x`, 1)

  x++
  $a.use(fn)
  t.is($a.state`x`, 1)

  function fn (el) {
    $a = $(el)

    $a.init(() => $a.state({ x }))
  }
})

t.only('state: trigger rerendering', t => {
  // let $els = $`<div.a/><div.b/><div.c/>`.use(a => {
  let $els = $`<div.a/>`.use(a => {
    let $a = $(a)
    $a.state({count: 0}, [])
    // $a.fx(() => {
    //   $a.state.count = 0
    //   if ($a[0].classList.contains('a')) $a.state.count = 1
    //   else if ($a[0].classList.contains('b')) $a.state.count = 2
    // }, [])


    // $a.html = $a.state.count
    console.log($a.state`count`)
    // $a.state(s =>
    //   setTimeout(() => {
    //     $a.state(s => s.count++)
    //   }, 1000)
    // , $a.state`count`)
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

  $a.use($el => {
    let s = $el.state

    setTimeout(() => {
      log.push(s.x)
    })
  })

  $a.state.x = 1

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
