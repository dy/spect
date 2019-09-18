import t from 'tst'
import spect, { current } from '../src/core'
import state from '../src/state'
import prop from '../src/prop'
import fx from '../src/fx'

spect.fn(fx, prop, state)

t.skip('counter', t => {
  let $n = spect({
    x: 1
  })

  $n.use(({ state }) => {
    state({ count: 0 }, [])

    console.log(state('count'))
    setTimeout(() => {
      state(s => ++s.count)
    }, 1000)
  })
})

t('readme: spect(target)', async t => {
  let log = []
  let target = spect({ foo: 'bar' })

  // properties are transparent
  t.is(target.foo, 'bar')

  // registered effects shade properies
  target.use(() => {
    log.push(0)
  })

  // effects are awaitable
  let x = await spect({}).fx(() => { log.push(1) }, [])

  t.is(log, [0, 1])
})

t('readme: use', async t => {
  let log = []

  let foo = spect({})
  let bar = spect({y: 0})

  foo.state('x', 0)

  await foo.use(foo => {
    // subscribe to updates
    let x = foo.state('x')
    let y = bar.prop('y')

    log.push(x, y)

    setTimeout(() => foo.state(state => state.x++), 1)
  })

  t.is(log, [0, 0])

  await new Promise((ok) => {
    setTimeout(() => {
      ok()
    }, 2)
  })

  t.is(log, [0, 0, 1, 0])

  // update foo
  bar.prop('y', 1)

  t.is(log, [0, 0, 1, 0])
  await ''

  t.is(log, [0, 0, 1, 0, 1, 1])
})

t('readme: update', async t => {
  let log = []

  let foo = spect({})

  function a () { log.push('a') }
  foo.use([a, () => log.push('b')])

  t.is(log, [])

  await foo

  t.is(log, ['a', 'b'])

  // update only a
  await foo.update(a)

  t.is(log, ['a', 'b', 'a'])

  // update all
  await foo.update()

  t.is(log, ['a', 'b', 'a', 'a', 'b'])
})

t('readme: fx', async t => {
  let log = []

  let foo = spect()

  await foo.use((el) => {
    // called each time
    foo.fx(() => log.push(1));

    // called on init only
    foo.fx(() => log.push(2), []);

    // destructor is called any time deps change
    foo.fx(() => (log.push(3), () => log.push(4)), [log[3]]);

    // called when value changes to non-false
    foo.fx(() => { log.push(5); return () => log.push(6); }, log.length === 0);
  })

  t.is(log, [1, 2, 3, 5])

  await foo.update()

  t.is(log, [1, 2, 3, 5, 4, 6, 1, 3])
})

t('readme: state', async t => {
  let foo = spect()

  await foo.use(() => {
    // write state
    foo.state('a', 1)
    foo.state({ b: 2 })

    // mutate/reduce
    foo.state(s => s.c = 3)
    foo.state(s => ({...s, d: 4}))

    // init
    foo.state({ e: 5 }, [])
  })

  t.is(foo.state('a'), 1)
  t.is(foo.state('b'), 2)
  t.is(foo.state('c'), 3)
  t.is(foo.state('d'), 4)
  t.is(foo.state('e'), 5)
  t.is(foo.state(), {a: 1, b: 2, c: 3, d: 4, e: 5})
})

t('readme: prop', async t => {
  let foo = spect()

  await foo.use(() => {
    // write prop
    foo.prop('a', 1)
    foo.prop({ b: 2 })

    // mutate/reduce
    foo.prop(s => s.c = 3)
    foo.prop(s => ({ ...s, d: 4 }))

    // init
    foo.prop({ e: 5 }, [])
  })

  t.is(foo.prop('a'), 1)
  t.is(foo.prop('b'), 2)
  t.is(foo.prop('c'), 3)
  t.is(foo.prop('d'), 4)
  t.is(foo.prop('e'), 5)
  t.is(foo.prop(), { a: 1, b: 2, c: 3, d: 4, e: 5 })
})

t('readme: destroy', async t => {
  let log = []

  let foo = spect({})

  foo.state('x', 0)

  await foo.use(foo => {
    log.push(foo.state('x'))
    return () => log.push(1)
  })

  t.is(log, [0])

  await foo.update()

  t.is(log, [0, 0])

  await foo.dispose().update()

  t.is(log, [0, 0, 1])
})

t('readme: standalone effects', async t => {
  let foo = { x: 1 }

  state.call(foo, 'y', 2)
  prop.call(foo, 'x', 3)

  fx.call(foo, () => {
    t.is(state.call(foo, 'y'), 2)
    t.is(prop.call(foo, 'x'), 3)
  })
})

t('core: empty / primitive selectors', t => {
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
  await spect(a).use([() => log.push(1), () => log.push(2), () => log.push(3)])
  t.deepEqual(log, [1, 2, 3])
})

t('use: duplicates are ignored', async t => {
  let log = []

  await spect({}).use([fn, fn, fn])

  function fn() {
    log.push(1)
  }

  t.is(log, [1])

  await spect({}).use([fn, fn, fn])

  t.is(log, [1, 1])
})

t('use: aspects must not be called multiple times, unless target state changes', async t => {
  let log = []

  let $a = spect({})
  await $a.use(fn)
  t.is(log, ['x'])
  await $a.use(fn)
  t.is(log, ['x'])
  await $a.use([fn, fn])
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

t('use: Same target different aspects', async t => {
  let log = []

  let a = {}

  let afx, bfx
  await spect(a).use([afx = () => (log.push('a'), () => log.push('de a'))])
  t.deepEqual(log, ['a'])
  await spect(a).use([bfx = () => (log.push('b'), () => log.push('de b'))])
  t.deepEqual(log, ['a', 'b'])
})

t('use: same aspect same target', async t => {
  let log = []
  let a = {}

  let fx = () => (log.push('a'), () => log.push('z'))
  await spect(a).use(fx)
  t.deepEqual(log, ['a'])
  await spect(a).use(fx)
  t.deepEqual(log, ['a'])
  await spect(a).use(fx)
  t.deepEqual(log, ['a'])
})

t('use: subaspects init themselves independent of parent aspects', async t => {
  let log = []

  let a = {b:{c:{}}}
  let b = a.b
  let c = b.c

  await spect(a).use(el => {
    log.push('a')
    spect(b).use(el => {
      log.push('b')
      spect(c).use(el => {
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
})

t.todo('use: generators aspects')

t('use: async aspects', t => {
  let a = spect({})

  a.use(async function a() {
    t.is(a, current.fn)
    await Promise.resolve().then()
    t.is(a, current.fn)
  })

})

t.skip('use: promise', async t => {
  let to = new Promise(ok => setTimeout(ok, 100))

  to.then()

  spect({}).use(to)
})


t('fx: global effect is triggered after current callstack', async t => {
  let log = []
  spect({}).fx(() => log.push('a'))

  t.is(log, [])

  await 0

  t.is(log, ['a'])
})

t('fx: runs destructor', async t => {
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

t('fx: toggle deps', async t => {
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

t('fx: async fx chain', async t => {
  let log = []
  let a = spect().fx(() => log.push(1)).fx(() => log.push(2))
  t.is(log, [])
  await a.fx(() => log.push(3))
  t.is(log, [1, 2, 3])
})

t('fx: async fx', async t => {
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

t.todo('fx: generator fx')

t.todo('fx: promise')

t.todo('fx: varying number of effects')

t.todo('fx: remove all effects on aspect removal')

t('state: direct get/set', t => {
  spect().use(el => {
    el.state('c', 1)

    t.is(el.state('c'), 1)
  })
})

t('state: object set', t => {
  spect().use(el => {
    el.state({ c: 1, d: 2 })

    t.is(el.state('c'), 1)
  })
})

t('state: functional get/set', t => {
  let a = spect()

  a.state(s => s.count = 0)

  t.is(a.state(), { count: 0 })

  a.state(s => s.count++)
  t.is(a.state`count`, 1)
})

t('state: init gate', async t => {
  let log = [], x = 1
  let $a = spect()

  await $a.use(fn)

  t.is($a.state`x`, 1)

  x++
  $a.update()
  t.is($a.state`x`, 1)

  function fn($a) {
    $a.state({ x }, [])
  }
})

t('state: reducer', t => {
  let $a = spect({})

  $a.state({ x: 1 })

  let log = []
  $a.state(s => {
    log.push(s.x)
  })

  t.is(log, [1])
})

t.todo('state: get/set path', t => {
  let $a = spect()

  t.is($a.state('x.y.z'), undefined)

  $a.state('x.y.z', 1)
  t.is($a.state(), { x: { y: { z: 1 } } })
  t.is($a.state('x.y.z'), 1)
})

t('state: reading state registers any-change listener', async t => {
  let log = []
  let $a = spect()

  await $a.use($el => {
    let s = $el.state()

    log.push(s.x)
  })
  t.is(log, [undefined])

  await $a.state({ x: 1 })

  t.is(log, [undefined, 1])
})

t('state: recursion on both reading/setting state', async t => {
  let log = []
  await spect().use($el => {
    log.push($el.state('x'))
    // alert($el.state('x'))
    $el.state({ x: 1 })
  })

  t.is(log, [undefined, 1])
})

t('state: same-effect different paths dont trigger update', async t => {
  let log = []
  await spect().use($el => {
    log.push($el.state('x'))
    $el.state('x')
    $el.state({y: 1})
  })
  t.is(log, [undefined])
})

t('core: awaiting doesn\'t cause recursion', async t => {
  let log = []

  let $a = spect()
  await $a

  let $a2 = $a.use(() => {log.push(2)})
  log.push(1)
  t.is($a2, $a)
  t.is(log, [1])
  await ''
  t.is(log, [1,2])
})

t.skip('core: await returns promise', async t => {
  let x = await spect()
  console.log(x.then)
  t.is(!!x.then, true)
})

t('state: reading state from async stack doesnt register listener', async t => {
  let log = []
  let $a = spect().use($el => {
    log.push(1)
    setTimeout(() => {
      $el.state('x')
    })
  })
  $a.state('x', 1)

  await $a

  // console.log($a, $a.fx(()=>{}))
  t.is(log, [1])

  await new Promise((ok, nok) => setTimeout(() => {
    t.is(log, [1])
    ok()
  }, 10))
})

t('state: deps cases', async t => {
  let el = spect({})

  let x, y, z, w

  x=y=z=w=1
  await el.use(() => {
    el.state('x', x, [])

    el.state('y', y)

    el.state('z', z, [el.state('x')])

    el.state('w', w, !!(el.state('y') - 1))
  })

  t.is(el.state('x'), 1)
  t.is(el.state('y'), 1)
  t.is(el.state('z'), 1)
  t.is(el.state('w'), undefined)

  x=y=z=w=2
  await el.update()

  t.is(el.state('x'), 1)
  t.is(el.state('y'), 2)
  t.is(el.state('z'), 1)
  t.is(el.state('w'), 2)
})

t('state: destructuring', async t => {
  let log = []
  await spect().use(({state}) => {
    // init/get state
    let { foo = 1, bar } = state()

    log.push('get foo,bar', foo, bar)

    // set registered listener updates element
    state({ foo: 'a', bar: 'b' })

    log.push('set foo,bar')
  })

  t.deepEqual(log, ['get foo,bar', 1, undefined, 'set foo,bar', 'get foo,bar', 'a', 'b', 'set foo,bar'])
})

t('state: direct get/set', async t => {
  let log = []
  await spect().use(({state}) => {
    let s = state()

    log.push('get foo,bar', s.foo, s.bar)

    Object.assign(s, { foo: 'a', bar: 'b' })

    log.push('set foo,bar')
  })

  t.deepEqual(log, ['get foo,bar', undefined, undefined, 'set foo,bar'])
})

t('state: shared between aspects', async t => {
  let log = []
  let el = spect()

  el.use(({state}) => {
    log.push('a')
    state({ foo: 'bar' })
  })

  await el.use(({state}) => {
    let { foo } = state()
    log.push('b', foo)
  })

  t.deepEqual(log, ['a', 'b', 'bar'])
})

t('prop: direct get/set', t => {
  spect().use(el => {
    el.prop('c', 1)
    t.is(el.c, 1)
  })
})

t('prop: object set', t => {
  spect().use(el => {
    el.prop({ c: 1, d: 2 })

    t.is(el.prop`c`, 1)
  })
})

t('prop: functional get/set', t => {
  let $a = spect()

  $a.prop(s => s.count = 0)

  t.is($a.prop(), $a)

  $a.prop(s => {
    s.count++
  })
  t.is($a.count, 1)
})

t.skip('prop: counter', t => {
  let stop = 0
  spect().use($a => {
    $a.prop({ count: 0 }, [])

    console.log($a.prop('count'))
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
