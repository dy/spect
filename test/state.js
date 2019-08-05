import t from 'tst'
import $ from '../index';


t.todo('state: direct props set', t => {
  $a.fx($a => {
    if (!$a.state.count) $a.state.count = 0

    $a.text = $a.state.count

    setTimeout(() => {
      $a.state.count++
    })
  })
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

t.todo('state: reading state registers any-change listener', t => {
  $a.fx($el => {
    let s = $el.state

    setTimeout(() => {
      $el.html`${s.x}`
    })
  })

  $a.state.x = 1
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
