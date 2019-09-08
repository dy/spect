import t from 'tst'
import $ from '..'
import spect from '../src/core';

t.skip('$: rebinding to other document', async t => {
  let { document } = await import('dom-lite')

  // FIXME: w
  let _$ = $.bind(document)

  var div = document.createElement("div")
  div.className = "foo bar"

  _$(div).use(el => {
    t.is(el.tagName, 'DIV')
  })
})

t('counter', t => {
  let $n = spect({})

  $n.use(({state}) => {
    state({count: 0}, [])

    console.log(state('count'))

    setTimeout(() => {
      state(s => ++s.count)
    }, 1000)
  })
})


t('$: empty selectors', t => {
  let $x = $()
  t.is($x.length, 0)

  let $y = $('xyz')
  t.is($y.length, 0)

  let $z = $(null)
  t.is($z.length, 0)

  // NOTE: this one creates content
  // let $w = $`div`
  // t.is($w.length, 0)

  t.notEqual($x, $y)
  t.notEqual($x, $z)
  // t.notEqual($x, $w)
})


t('use: aspects, assigned through parent wrapper', t => {
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
  $a3.use(([el]) => {
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

t('use: aspects must be called in order', t => {
  let log = []
  let a = document.createElement('a')
  $(a).use(() => log.push(1), () => log.push(2), () => log.push(3))
  t.deepEqual(log, [1, 2, 3])
})

t('use: duplicates are ignored', t => {
  let log = []

  $(document.createElement('a')).use(fn, fn, fn)

  function fn() {
    log.push(1)
  }

  t.is(log, [1])

  $(document.createElement('a')).use(fn, fn, fn)

  t.is(log, [1, 1])
})

t('use: aspects must not be called multiple times, unless target state changes', t => {
  let log = []

  let $a = $`<a/>`
  $a.use(fn)
  t.is(log, ['x'])
  $a.use(fn)
  t.is(log, ['x'])
  $a.use(fn, fn)
  t.is(log, ['x'])
  $a.update()
  t.is(log, ['x', 'x'])

  function fn(el) { log.push('x') }
})

t('use: same aspect different targets', t => {
  let log = []
  function fx([el]) {
    log.push(el.tagName)
    // return () => log.push('destroy ' + el.tagName)
  }

  let $el = $(document.createElement('a')).use(fx)

  t.is($el[0].tagName, log[0])
  t.is(log, ['A'])

  $el[0].innerHTML = '<span></span>'
  $($el[0].firstChild).use(fx)

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

