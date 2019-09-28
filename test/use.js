import t from 'tst'
import { use } from '..'

t('use: observe selector', async t => {
  let log = []

  use('.item', el => {
    log.push(el)
    // return () => {
    //   log.push(el)
    // }
  })

  let el = document.createElement('a')
  el.classList.add('item')
  document.body.appendChild(el)

  await ''

  t.is(log, [el])

  document.body.removeChild(el)

  await ''

  // t.is(log, [el, el])
})

t.todo('use: aspects, assigned through parent wrapper', async t => {
  // some wrappers over same elements can be created in different ways
  // but effects must be bound to final elements
  let a = document.createElement('a')
  let frag = document.createDocumentFragment()
  frag.appendChild(a)

  let $a1 = $(a)
  let $a2 = $([a])
  let $a3 = $(frag)
  let $a4 = $(frag.childNodes)
  let $a5 = $(frag.querySelector('*'))

  let log = []
  await $a3.use(([ el ]) => {
    t.is(el, a)
    log.push('a3')
  })

  t.is(log, ['a3'])
  t.is($a1[0], a)
  t.is($a2[0], a)
  t.is($a3[0], a)
  t.is($a4[0], a)
  t.is($a5[0], a)
})

t.todo('use: aspects must be called in order', async t => {
  let log = []
  let a = document.createElement('a')
  await $(a).use([() => log.push(1), () => log.push(2), () => log.push(3)])

  t.deepEqual(log, [1,2,3])
})

t.todo('use: duplicates are ignored', async t => {
  let log = []

  await $(document.createElement('a')).use([fn, fn, fn])

  function fn () {
    log.push(1)
  }

  t.is(log, [1])

  await $(document.createElement('a')).use([fn, fn, fn])

  t.is(log, [1, 1])
})

t.todo('use: aspects must not be called multiple times, unless target state changes', async t => {
  let log = []

  let $a = $`<a/>`
  await $a.use(fn)
  t.is(log, ['x'])
  await $a.use(fn)
  t.is(log, ['x'])
  await $a.use(fn, fn)
  t.is(log, ['x'])
  await $a.update()
  t.is(log, ['x', 'x'])

  function fn(el) {log.push('x')}
})

t.todo('use: same aspect different targets', async t => {
  let log = []
  function fx(el) {
    log.push(el.tagName)
    return () => log.push('destroy ' + el.tagName)
  }

  let $el = $(document.createElement('a')).use(fx)

  await $el

  t.is($el[0].tagName, log[0])
  t.is(log, ['A'])

  $el[0].innerHTML = '<span></span>'
  await $($el[0].firstChild).use(fx)

  t.deepEqual(log, ['A', 'SPAN'])
})

t.todo('use: Same target different aspects', async t => {
  let log = []

  let a = document.createElement('a')
  document.body.appendChild(a)

  let afx, bfx
  await $('a').use(afx = () => (log.push('a'), () => log.push('de a')))
  t.deepEqual(log, ['a'])
  await $('a').use(bfx = () => (log.push('b'), () => log.push('de b')))
  t.deepEqual(log, ['a', 'b'])

  document.body.removeChild(a)
})

t.todo('use: same aspect same target', async t => {
  let log = []
  let a = document.createElement('a')
  document.body.appendChild(a)

  let fx = () => (log.push('a'), () => log.push('z'))
  await $(a).use(fx)
  t.deepEqual(log, ['a'])
  await $(a).use(fx)
  t.deepEqual(log, ['a'])
  await $('a').use(fx)
  t.deepEqual(log, ['a'])

  document.body.removeChild(a)
})

t.todo('use: subaspects init themselves independent of parent aspects', async t => {
  let log = []

  let a = document.body.appendChild(document.createElement('a'))
  let b = a.appendChild(document.createElement('b'))
  let c = b.appendChild(document.createElement('c'))

  await $('a').use(el => {
    log.push('a')
    $('b').use(el => {
      log.push('b')
      $('c').use(el => {
        log.push('c')
        return () => log.push('-c')
      })
      return () => log.push('-b')
    })
    return () => log.push('-a')
  })

  t.deepEqual(log, ['a', 'b', 'c'])

  $(a).dispose()

  t.deepEqual(log, ['a', 'b', 'c', '-c', '-b', '-a'])

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



t.todo('use: aspects must be called in order', async t => {
  let log = []
  let a = {}
  await spect(a).use([() => log.push(1), () => log.push(2), () => log.push(3)])
  t.deepEqual(log, [1, 2, 3])
})

t.todo('use: duplicates are ignored', async t => {
  let log = []

  await spect({}).use([fn, fn, fn])

  function fn() {
    log.push(1)
  }

  t.is(log, [1])

  await spect({}).use([fn, fn, fn])

  t.is(log, [1, 1])
})

t.todo('use: aspects must not be called multiple times, unless target state changes', async t => {
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

  let $el = spect({ tagName: 'A' }).use(fx)

  t.is($el.target.tagName, log[0])
  t.is(log, ['A'])

  $el.target.innerHTML = '<span></span>'
  $($el.target.firstChild).use(fx)

  t.deepEqual(log, ['A', 'SPAN'])
})

t.todo('use: Same target different aspects', async t => {
  let log = []

  let a = {}

  let afx, bfx
  await spect(a).use([afx = () => (log.push('a'), () => log.push('de a'))])
  t.deepEqual(log, ['a'])
  await spect(a).use([bfx = () => (log.push('b'), () => log.push('de b'))])
  t.deepEqual(log, ['a', 'b'])
})

t.todo('use: same aspect same target', async t => {
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

t.todo('use: subaspects init themselves independent of parent aspects', async t => {
  let log = []

  let a = { b: { c: {} } }
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

t.todo('use: async aspects', t => {
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


t.todo('fx: global effect is triggered after current callstack', async t => {
  let log = []
  spect({}).fx(() => log.push('a'))

  t.is(log, [])

  await 0

  t.is(log, ['a'])
})
