import t from 'tst'
// import { $, state, fx, prop, store, calc, attr, on } from '../dist/spect.min.js'
import { $, state, fx, prop, store, calc, attr, on } from '../index.js'
import { tick, frame, idle, time } from 'wait-please'
import { augmentor, useState, useEffect, useMemo } from 'augmentor'
import Observable from 'zen-observable/esm'
import observable from './observable.js'

t('$: tag selector', async t => {
  let ellog = []
  let proplog = []
  let container = document.body.appendChild(document.createElement('div'))

  let x1 = $('x', el => {
    ellog.push(el.tagName.toLowerCase())
  })

  container.appendChild(document.createElement('x'))
  await Promise.resolve()
  t.deepEqual(ellog, ['x'], 'simple creation')

  container.appendChild(document.createElement('x'))
  container.appendChild(document.createElement('x'))
  await Promise.resolve()
  t.deepEqual(ellog, ['x', 'x', 'x'], 'create multiple')

  let x2 = $('x', el => {
    proplog.push(1)
  })
  container.appendChild(document.createElement('x'))
  await Promise.resolve()
  t.deepEqual(ellog, ['x', 'x', 'x', 'x'], 'additional aspect')
  t.deepEqual(proplog, [1, 1, 1, 1], 'additional aspect')

  document.body.removeChild(container)
  x1.cancel()
  x2.cancel()

  t.end()
})
t('$: init existing elements', async t => {
  let log = []
  let container = document.body.appendChild(document.createElement('div'))
  container.appendChild(document.createElement('x'))
  container.appendChild(document.createElement('x'))

  let xs = $('x', el => {
    log.push(el.tagName.toLowerCase())
  })

  await Promise.resolve()
  t.is(log, ['x', 'x'], 'simple creation')

  xs.cancel()
  document.body.removeChild(container)
})
t('$: dynamically assigned selector', async t => {
  let log = []

  let xs = $('.x', el => {
    log.push(el)
  })

  let el = document.createElement('div')
  document.body.appendChild(el)

  await idle()
  t.is(log, [])

  el.classList.add('x')
  await tick()

  t.is(log, [el])

  xs.cancel()
  document.body.removeChild(el)

})
t('$: simple hooks', async t => {
  let el = document.createElement('div')

  const hx = $(el, augmentor(el => {
    let [count, setCount] = useState(0)
    el.count = count
    useEffect(() => {
      setCount(1)
    }, [])
  }))

  t.is(el.count, 0)
  await frame()
  t.is(el.count, 1)

  hx.cancel()
})
t('$: aspects must be called in order', async t => {
  let log = []
  let a = document.createElement('a')

  let as = $(a, [() => (log.push(1)), () => log.push(2), () => log.push(3)])

  document.body.appendChild(a)

  await tick()

  t.deepEqual(log, [1, 2, 3])

  document.body.removeChild(a)
  as.cancel()
})
t('$: throwing error must not create recursion', async t => {
  let a = document.createElement('a')
  document.body.appendChild(a)
  console.groupCollapsed('error here')
  let as = $('a', el => {
    throw Error('That error is planned')
  })
  console.groupEnd()
  await tick()

  document.body.removeChild(a)
  as.cancel()
  t.end()
})
t('$: remove/add should not retrigger element', async t => {
  let a = document.createElement('a')
  let b = document.createElement('b')
  document.body.appendChild(b.appendChild(a))

  let log = []
  let as = $('a', el => log.push('a'))
  setTimeout(() => document.body.appendChild(a))

  await time(10)
  t.deepEqual(log, ['a'])

  document.body.removeChild(a)
  as.cancel()
  await frame()
  t.end()
})
t('$: remove/add internal should not retrigger element', async t => {
  let a = document.createElement('a')
  let b = document.createElement('b')
  a.appendChild(b)

  let log = []
  let abs = $('a b', el => log.push('b'))
  setTimeout(() => document.body.appendChild(a))

  await time(10)
  t.deepEqual(log, ['b'])

  document.body.removeChild(a)
  abs.cancel()
  await frame()
  t.end()
})
t('$: destructor is called on unmount', async t => {
  let el = document.createElement('div')
  let log = []
  let all = $(el, '*', el => {
    log.push(1)
    return () => log.push(2)
  })
  t.deepEqual(log, [])
  el.innerHTML = 'x<a></a><a></a>x'
  await tick()
  t.deepEqual(log, [1, 1])
  el.innerHTML = ''
  await frame(2)
  t.deepEqual(log, [1, 1, 2, 2], 'clear up')
  all.cancel()
  el.innerHTML = 'x<a></a><a></a>x'
  await tick()
  t.deepEqual(log, [1, 1, 2, 2])
  t.end()
})
t('$: changed attribute matches new nodes', async t => {
  let el = document.createElement('div')
  el.innerHTML = '<a><b><c></c></b></a>'

  let log = []
  const abb = $(el, 'a b.b', e => {
    log.push('+2')
    return () => log.push('-2')
  })
  const abbc = $(el, 'a b.b c', e => {
    log.push('+3')
    return () => log.push('-3')
  })
  await frame(2)

  t.is(log, [])
  await frame(2)
  t.is(log, [])

  el.querySelector('b').classList.add('b')
  await frame(2)
  t.is(log, ['+2', '+3'])

  el.querySelector('b').classList.remove('b')
  await frame(2)
  t.is(log, ['+2', '+3', '-2', '-3'])


  log = []
  el.querySelector('b').classList.add('b')
  await frame(2)
  t.is(log, ['+2', '+3'])

  el.querySelector('b').classList.remove('b')
  await frame(2)
  t.is(log, ['+2', '+3', '-2', '-3'])

  abb.cancel()
  abbc.cancel()
})
t('$: contextual query with self-matching', async t => {
  let el = document.createElement('x')
  let log = []
  $(el, '.x y', y => {
    log.push('y')
  })
  $(el, '.x', el => {
    log.push('x')
  })
  $(el, () => {
    log.push('-')
  })
  $(el, ' y', el => {
    log.push(' y')
  })
  el.innerHTML = '<y></y>'
  el.classList.add('x')
  await tick(8)
  t.same(log, ['y', 'x', '-', ' y'])
})
t('$: adding/removing attribute with attribute selector, mixed with direct selector', async t => {
  let el = document.createElement('div')
  const log = []
  el.innerHTML = '<x></x>'
  const x = el.firstChild
  $(el, 'x', e => {})
  $(el, 'x[y]', e => {
    log.push(1)
    return () => log.push(2)
  })
  await tick(8)
  t.is(log, [])
  x.setAttribute('y', true)
  await tick(8)
  t.is(log, [1])
  x.removeAttribute('y')
  await frame(2)
  t.is(log, [1, 2])
})
t('$: matching nodes in added subtrees', async t => {
  let el = document.createElement('div')
  let log = []
  $(el, 'a b c d', el => {
    log.push('+')
    return () => {
      log.push('-')
    }
  })
  el.innerHTML = '<a><b><c><d></d></c></b></a>'
  await tick(8)
  t.is(log, ['+'])
  el.innerHTML = ''
  await frame(2)
  t.is(log, ['+', '-'])
})
t.todo('subaspects', async t => {
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
t.todo('new custom element', t => {
  $('custom-element', () => {

  })
})
t.todo('aspects must be called in order', async t => {
  let log = []
  let a = {}
  await spect(a).use([() => log.push(1), () => log.push(2), () => log.push(3)])
  t.deepEqual(log, [1, 2, 3])
})
t.todo('duplicates are ignored', async t => {
  let log = []

  await spect({}).use([fn, fn, fn])

  function fn() {
    log.push(1)
  }

  t.is(log, [1])

  await spect({}).use([fn, fn, fn])

  t.is(log, [1, 1])
})
t.skip('same aspect different targets', t => {
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
t.todo('same target different aspects', async t => {
  let log = []

  let a = {}

  let afx, bfx
  await spect(a).use([afx = () => (log.push('a'), () => log.push('de a'))])
  t.deepEqual(log, ['a'])
  await spect(a).use([bfx = () => (log.push('b'), () => log.push('de b'))])
  t.deepEqual(log, ['a', 'b'])
})
t.todo('same aspect same target', async t => {
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
t.todo('async aspects', t => {
  let a = document.createElement('a')

  $(a, async function a() {
    t.is(a, current.fn)
    await Promise.resolve().then()
    t.is(a, current.fn)
  })

})
t.todo('rebinding to other document', async t => {
  let { document } = await import('dom-lite')

  // FIXME: w
  let _$ = $.bind(document)

  var div = document.createElement("div")
  div.className = "foo bar"

  _$(div).use(el => {
    t.is(el.tagName, 'DIV')
  })
})
t.skip('empty selectors', t => {
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
t.todo('selecting forms', t => {
  let $f = $`<form><input name="a"/><input name="b"/></form>`

  let $form = $($f)

  t.is($f, $form)
  t.is($form[0].childNodes.length, 2)
  t.is($form[0], $f[0])

  t.end()
})
t('$: init on list of elements', async t => {
  let log = []
  let el = document.createElement('div')
  el.innerHTML = '<a>1</a><a>2</a>'
  let chldrn = $(el.childNodes, el => {
    log.push(el.textContent)
    return () => log.push('un' + el.textContent)
  })
  t.deepEqual(log, ['1', '2'])
  el.innerHTML = ''
  chldrn.cancel()
  await frame(2)
  t.deepEqual(log, ['1', '2', 'un1', 'un2'])
})
t('$: init/destroy in body of web-component')

t('$: await $(target, fn) should not block')
