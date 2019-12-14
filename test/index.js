import $ from '../src/index.js'
import t from 'tst'
import { tick, frame, idle, time } from 'wait-please'
import setHooks, { useState, useEffect, useMemo } from 'unihooks'


t('tag selector', async t => {
  let ellog = []
  let proplog = []
  let container = document.body.appendChild(document.createElement('div'))

  $('x', el => {
    ellog.push(el.tagName.toLowerCase())
  })

  container.appendChild(document.createElement('x'))
  await Promise.resolve()
  t.is(ellog, ['x'], 'simple creation')

  container.appendChild(document.createElement('x'))
  container.appendChild(document.createElement('x'))
  await Promise.resolve()
  t.is(ellog, ['x', 'x', 'x'], 'create multiple')

  $('x', el => {
    proplog.push(1)
  })
  container.appendChild(document.createElement('x'))
  await Promise.resolve()
  t.is(ellog, ['x', 'x', 'x', 'x'], 'additional aspect')
  t.is(proplog, [1, 1, 1, 1], 'additional aspect')

  document.body.removeChild(container)
})

t('init existing elements', async t => {
  let log = []
  let container = document.body.appendChild(document.createElement('div'))
  container.appendChild(document.createElement('x'))
  container.appendChild(document.createElement('x'))

  $('x', el => {
    log.push(el.tagName.toLowerCase())
  })

  await Promise.resolve()
  t.is(log, ['x', 'x'], 'simple creation')

  document.body.removeChild(container)
})

t.skip('removing $ disables internal effects', async t => {
  let container = document.createElement('div')
  document.body.appendChild(container)

  let obj = {}

  $('x', e => {
    fx(props(), x => {

    })
  })

  document.body.removeChild(container)
})


t.skip('defined props must be available', async t => {
  let log = []

  let el = document.createElement('div')
  el.setAttribute('x', 1)
  $(el, (el) => {
    log.push(el.x)
  })

  t.is(log, [1])
})

t('dynamically assigned selector', async t => {
  let log = []

  $('.x', el => {
    log.push(el)
  })

  let el = document.createElement('div')
  document.body.appendChild(el)

  await idle()
  t.is(log, [])

  el.classList.add('x')
  await tick()

  t.is(log, [el])

  document.body.removeChild(el)
})

t.todo('returned result replaces the target', async t => {
  let container = document.createElement('div')
  container.innerHTML = '<div class="foo"></div>'
  document.body.appendChild(container)

  let unuse = use('.foo', el => {
    return [html`<foo/>`, 'bar']
  })
  let els = await unuse

  t.is(container.innerHTML, '<foo></foo>bar')

  els.forEach(el => el.remove())
  unuse()
})

t('simple hooks', async t => {
  let el = document.createElement('div')

  $(el, el => {
    let [count, setCount] = useState(0)
    el.count = count
    useEffect(() => {
      setCount(1)
    }, [])
  })

  t.is(el.count, 0)
  await tick()
  t.is(el.count, 1)
})


t.todo('aspects, assigned through parent wrapper', async t => {
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
  await $a3.use(([el]) => {
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

t('aspects must be called in order', async t => {
  let log = []
  let a = document.createElement('a')

  let unspect = $(a, [() => (log.push(1)), () => log.push(2), () => log.push(3)])

  document.body.appendChild(a)

  await tick()

  t.deepEqual(log, [1, 2, 3])

  document.body.removeChild(a)
  unspect()
})

t('each aspect must have own hooks scope', async t => {
  let log = []

  let a1 = document.createElement('a')
  a1.x = 1
  document.documentElement.appendChild(a1)

  let off = $('a', (el) => {
    useEffect(() => {
      log.push(el.x)
    }, [])
  })

  let a2 = document.createElement('a')
  a2.x = 2
  document.documentElement.appendChild(a2)

  await tick(2)

  t.deepEqual(log, [1, 2])

  document.documentElement.removeChild(a1)
  document.documentElement.removeChild(a2)
  off()
})

t('returned function disposes all internal aspects', async t => {
  let log = []

  let una = $('a', (el) => {
    log.push('a1')
    useEffect(() => {
      log.push('effect-a1')
      return () => {
        log.push('uneffect-a1')
      }
    })
    return () => log.push('una1')
  })
  let una2 = $('a', (el) => {
    log.push('a2')
    useEffect(() => {
      log.push('effect-a2')
      return () => log.push('uneffect-a2')
    })
    return () => log.push('una2')
  })

  let a = document.body.appendChild(document.createElement('a'))

  await frame(2)
  t.deepEqual(log, ['a1', 'a2', 'effect-a1', 'effect-a2'])

  una()
  await frame(3)
  t.deepEqual(log, ['a1', 'a2', 'effect-a1', 'effect-a2', 'una1', 'uneffect-a1'])

  una2()
  await frame(3)
  t.deepEqual(log, ['a1', 'a2', 'effect-a1', 'effect-a2', 'una1', 'uneffect-a1', 'una2', 'uneffect-a2'])

  document.body.removeChild(a)
  await frame(2)
  t.deepEqual(log, ['a1', 'a2', 'effect-a1', 'effect-a2', 'una1', 'uneffect-a1', 'una2', 'uneffect-a2'])

  t.end()
})

t('throwing error must not create recursion', async t => {
  let a = document.createElement('a')
  document.body.appendChild(a)
  let unspect = $('a', el => {
    useMemo(() => {}, [])
    useEffect(() => {
      a.classList.add('x')
    }, [])
    throw Error('That error is planned')
  })
  await tick()

  unspect()
  document.body.removeChild(a)
  t.end()
})

t.todo('duplicates are ignored', async t => {
  let log = []

  await $(document.createElement('a')).use([fn, fn, fn])

  function fn() {
    log.push(1)
  }

  t.is(log, [1])

  await $(document.createElement('a')).use([fn, fn, fn])

  t.is(log, [1, 1])
})

t.todo('aspects must not be called multiple times, unless target state changes', async t => {
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

  function fn(el) { log.push('x') }
})

t.todo('same aspect different targets', async t => {
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

t.todo('Same target different aspects', async t => {
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

t.todo('same aspect same target', async t => {
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

t.todo('subaspects init themselves independent of parent aspects', async t => {
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

t.todo('generators aspects')

t.todo('async aspects')


t.todo('promise (suspense)', t => {
  $('div', import('url'))
})

t.todo('hyperscript case', t => {
  $('div', () => {

  })
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

t.todo('aspects must not be called multiple times, unless target state changes', async t => {
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

t.todo('Same target different aspects', async t => {
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

t.todo('subaspects init themselves independent of parent aspects', async t => {
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

t.todo('generators aspects')

t.todo('async aspects', t => {
  let a = spect({})

  a.use(async function a() {
    t.is(a, current.fn)
    await Promise.resolve().then()
    t.is(a, current.fn)
  })

})

t.skip('promise', async t => {
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


t.todo('simple selector', t => {
  let $b = $('body')
  t.is($b.length, 1)

  let $b1 = $(document.body)
  t.is($b1[0], $b[0])
})

t.todo('create from nodes', t => {
  let el = document.createElement('div')

  let $node = $(el)
  t.ok($node.length, 1)
  t.is($node[0], el)

  let $sameNodes = $([el, el])
  t.is($sameNodes.length, 1)
  t.is($sameNodes[0], el)

  let $difNodes = $([el, document.createElement('div')])
  t.is($difNodes.length, 2)
  t.is($difNodes[0], el)
})

t.todo('create new', t => {
  let $new = $('<div/>')
  t.equal($new[0].tagName, 'DIV')

  let $newList = $('<div/><div/>')
  t.equal($newList.length, 2)

  let $tpl = $`<div/><div/>`
  t.equal($tpl.length, 2)
})

t.todo('create components', t => {
  let $el = $`<${C}/>`

  function C($el) {
    console.log($el[0])
  }
  console.log($el)
})

t.todo('subselect nodes', t => {
  let $foo = $`<foo><bar/></foo>`

  console.log('bar')
  let $bar = $foo.$(`bar`)

  t.is($bar[0], $foo[0].firstChild)
})

t.skip('live nodes list as reference under the hood', t => {
  // FIXME: that's insustainable for now: we have to extend Spect class from Proxy-ed prototype,
  // providing numeric access to underneath store, like NodeList etc.
  // The proxy prototype looks
  let el = document.createElement('div')

  el.appendChild(document.createElement`div`)

  let $children = $(el.childNodes)
  t.is($children.length, 1)

  el.appendChild(document.createElement`div`)
  t.is($children.length, 2)
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

t.todo('ignore wrapping collections', t => {
  let $a = $`<a/>`

  t.equal($($a), $a)
})

t.todo('wrapped subsets are fine', t => {
  let $a = $`<a/>`

  t.equal($($a[0]), $a)
})

t.todo('fragments', t => {
  let [foo, bar, baz] = $`<>foo <bar/> baz</>`
  // t.equal(el.innerHTML, 'foo <bar></bar> baz')
  t.ok(foo instanceof Node)

  let [foo1, bar1, baz1] = $`foo <bar/> baz`
  // t.equal(el.innerHTML, 'foo <bar></bar> baz')
  t.ok(foo1 instanceof Node)

  // let [foo2, bar2, baz2] = $(['foo ', $`<bar/>`, ' baz'])
  // t.equal(el.innerHTML, 'foo <bar></bar> baz')
  // t.ok(foo2 instanceof Node)
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
})

t.skip('array map should work fine', t => {
  let $a = $`<a/>`
  let $b = $a.map(x => x.html`<span/>`)
  t.is($a, $b)
})

t.skip('negative, positive indices')
t.skip('Set methods')
t.skip('call subfilters elements')

t.todo('promise postpones properly / effects are bound', async t => {
  let $a = $`<a use=${({ html }) => html`<span.x/>`}/>`

  await $a

  t.is($a[0].innerHTML, '<span class="x"></span>')
})

t.todo('create document fragment is ok', t => {
  let $d = $(document.createDocumentFragment())

  t.is($d.length, 0)
})

t.todo('select within multiple', t => {

})
