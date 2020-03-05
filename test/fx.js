import t from 'tst'
import { $, state, fx, prop, on } from '../index.js'
import { tick, frame, idle, time } from 'wait-please'
import Observable from 'zen-observable/esm'
import observable from './observable.js'


t('fx: core', async t => {
  let a = state(0)
  let o = { b: 1 }
  let b = prop(o, 'b')

  let log = []
  fx((a, b) => {
    log.push(a, b)
  }, [a, b])

  await tick(8)
  t.is(log, [0, 1], 'initial state')
  a(1)
  a(2)
  await tick(8)
  t.any(log, [[0, 1, 2, 1], [0, 1, 1, 1, 2, 1]], 'changed state')
  o.b = 2
  await tick(8)
  t.any(log, [[0, 1, 2, 1, 2, 2], [0, 1, 1,1, 2,1, 2,2]], 'changed prop')
  o.b = 2
  a(2)
  await tick(8)
  t.any(log, [[0,1, 2,1, 2,2, 2,2], [0,1, 1,1, 2,1, 2,2, 2,2]], 'unchanged prop')
})
t('fx: destructor', async t => {
  let log = []
  let a = state(0), b = state(0)
  fx((a, b) => {
    log.push('in', a, b)
    return () => {
      log.push('out', a, b)
    }
  }, [a, b])

  await tick(8)
  t.is(log, ['in', 0, 0])

  log = []
  a(1)
  b(1)
  await tick(8)
  t.is(log.slice(0, 3), ['out', 0, 0], 'destructor is ok')
  t.is(log.slice(-3), ['in', 1, 1], 'destructor is ok')
})
t.todo('fx: disposed by unmounted element automatically')
t('fx: runs unchanged', async t => {
  let a = state(0)
  let log = []
  fx(a => {
    log.push(a)
  }, [a])

  await tick(8)
  t.is(log, [0])
  a(1)
  a(0)
  await tick(8)
  t.is(log, [0, 1, 0], 'runs unchanged')
})
t('fx: no-deps/empty deps runs once after deps', async t => {
  let log = []
  const c = state(0)
  fx(() => {
    log.push(c())
  }, [c])
  fx(() => {
    log.push(1)
  }, [])
  fx(() => {
    log.push(2)
  })
  fx(() => {
    log.push(c())
  }, [c])

  await tick(8)
  t.is(log, [0, 0])
})
t('fx: async fx', async t => {
  let count = state(0)
  let log = []
  fx(async c => {
    log.push(c)
    if (c > 3) return
    await tick()
    count(c + 1)
  }, [count])

  await tick(70)
  t.is(log, [0, 1, 2, 3, 4])
})
t.skip('fx: promise / observable / direct dep', async t => {
  let p = new Promise(r => setTimeout(() => r(2), 10))
  let O = new Observable(obs => setTimeout(() => obs.next(3), 20))
  let o = observable(); setTimeout(() => o(4), 30)
  let v = 1

  let log = []
  fx((p, O, v, o) => {
    log.push(v, p, O, o)
  }, [p, O, v, o])

  await tick(8)
  t.is(log, [1, undefined, undefined, undefined])
  log = []
  await time(10)
  t.is(log, [1, 2, undefined, undefined])
  log = []
  await time(10)
  t.is(log, [1, 2, 3, undefined])
  log = []
  await time(10)
  t.is(log, [1, 2, 3, 4])
})
t('fx: on must not create initial tick', async t => {
  let ex = on(document.createElement('x'), 'click')
  let log = []
  fx(e => {
    log.push(1)
  }, [ex])

  await tick(20)
  t.is(log, [])
})
t.skip('fx: thenable', async t => {
  const s = state(0), log = []
  const sx = fx(s => {
    log.push(s)
  }, [s])
  await tick(10)
  t.is(log, [0])

  sx.then(x => log.push('aw', ...x))
  s(1)
  // await tick(6)
  // t.is(log, [0, 1])
  await tick(8)
  t.any(log, [[0, 'aw', 1, 1], [0, 1, 'aw', 1]])
})
t.skip('fx: simple values', async t => {
  const o = {x:1}, log = []
  fx((o, x) => {
    log.push(o, x)
  }, [o, o.x])
  await tick(8)
  t.is(log, [{x: 1}, 1])
})
t.skip('fx: async generator', async t => {
  async function* x () {
    yield 1
    await tick(3)
    yield 2
  }
  const log = []
  fx((x1, x2) => {
    log.push(x1, x2)
  }, [x(), x()])

  await tick(12)
  t.is(log, [1,1,2,2])
})
t.skip('fx: function deps', async t => {
  const log = []
  let i = 0
  const a = state(0)
  fx((a, b) => {
    log.push(a, b)
  }, [a, () => i++])

  await tick(8)
  t.is(log, [0, 0])

  a(1)
  await tick(8)
  t.is(log, [0, 0, 1, 1])
})
t.skip('fx: deps length change', async t => {
  let deps = [state(1)]
  let log = []
  fx((...args) => {
    log.push(args)
  }, deps)
  await tick(8)
  t.is(log, [[1]])

  deps.push(state(2))
  await tick(8)
  t.is(log, [[1], [1,2]])
})

t.skip('fx: sync must not call twice init const', async t => {
  let log = []
  fx((v) => {
    log.push(v)
  }, ['x'], true)

  t.is(log, ['x'])
  await tick(28)
  t.is(log, ['x'])
})

t('fx: sync must not call twice init state', async t => {
  let log = [],
  s = state('x')
  fx((v) => {
    log.push(v)
  }, [s], true)

  t.is(log, ['x'])
  await tick(28)
  t.is(log, ['x'])
})

t.todo('fx: streams', async t => {

})
