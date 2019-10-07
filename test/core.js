import t from 'tst'
import { run, state, fx, prop } from '..'


t.skip('counter', t => {
  state(t).count = 0
  run(() => {
    console.log(state(t).count)
    setTimeout(() => {
      state(t).count++
    }, 1000)
  })
})

t('legacy readme: use', async t => {
  let log = []

  let foo = state('foo', {})
  let bar = state('bar', {y: 0})

  foo.x = 0

  run(() => {
    // subscribe to updates
    let x = foo.x
    let y = bar.y

    log.push(x, y)

    setTimeout(() => {
      if (!foo.x) foo.x++
    }, 1)
  })

  t.is(log, [0, 0])

  await new Promise((ok) => {
    setTimeout(() => {
      ok()
    }, 2)
  })

  t.is(log, [0, 0, 1, 0])

  // // update foo
  // bar.y = 1
  // await '';
  // t.is(log, [0, 0, 1, 0, 1, 1])
})

t('legacy readme: update', async t => {
  let log = []

  let foo = state(null, {})

  function a () { log.push('a') }
  run(a)
  run(() => log.push('b'))

  // t.is(log, [])
  // await ''

  t.is(log, ['a', 'b'])

  // update only a
  await run(a)
  t.is(log, ['a', 'b', 'a'])

  // update all
  // await run()

  // t.is(log, ['a', 'b', 'a', 'a', 'b'])
})

t.todo('legacy readme: fx', async t => {
  let log = []

  const a = () => {
    // called each time
    fx(() => log.push(1));

    // called on init only
    fx([], () => log.push(2));

    // destructor is called any time deps change
    fx([log[3]], (v) => (log.push(3), () => log.push(4)));

    // called when value changes to non-false
    fx(log.length, () => { log.push(5); return () => log.push(6); });
  }

  run(a)
  t.is(log, [1, 2, 3, 5])

  run(a)

  t.is(log, [1, 2, 3, 5, 1, 4, 3, 6, 5])
})

t('legacy readme: standalone effects', async t => {
  let foo = { x: 1 }

  state(foo).y = 2
  prop(foo).x = 3

  fx(() => {
    t.is(state(foo).y, 2)
    t.is(prop(foo).x, 3)
  })
})


t('core: awaiting doesn\'t cause recursion', async t => {
  let log = []

  run(async () => {await ''; log.push(2)})
  log.push(1)
  t.is(log, [1])
  await ''
  t.is(log, [1,2])
})

t.skip('core: await returns promise', async t => {
  let x = await spect()
  console.log(x.then)
  t.is(!!x.then, true)
})


