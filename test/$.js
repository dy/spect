import t from 'tst'
import { $, h } from '../index.js'
// import $ from '../$.js'
import { tick, frame, idle, time } from 'wait-please'
import { augmentor, useState, useEffect, useMemo } from 'augmentor'
import v from '../v.js'

t('$: tag selector', async t => {
  let ellog = []
  let proplog = []
  let container = document.body.appendChild(document.createElement('div'))


  let x1 = $('x', el => {
    ellog.push(el.tagName.toLowerCase())
  })

  let el = document.createElement('x')
  container.appendChild(el)
  await tick()
  t.deepEqual(ellog, ['x'], 'simple creation')

  container.appendChild(document.createElement('x'))
  container.appendChild(document.createElement('x'))
  await tick()
  t.deepEqual(ellog, ['x', 'x', 'x'], 'create multiple')

  let x2 = $('x', el => {
    proplog.push(1)
  })
  container.appendChild(document.createElement('x'))
  await tick()
  t.deepEqual(ellog, ['x', 'x', 'x', 'x'], 'additional aspect')
  t.deepEqual(proplog, [1, 1, 1, 1], 'additional aspect')

  document.body.removeChild(container)
  x1[Symbol.dispose]()
  x2[Symbol.dispose]()

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

  xs[Symbol.dispose]()
  document.body.removeChild(container)
})
t.browser('$: dynamically assigned selector', async t => {
  let log = []

  let xs = $('.x', el => {
    log.push(el)
  })

  let el = document.createElement('div')
  document.body.appendChild(el)

  await idle()
  t.is(log, [])

  el.classList.add('x')
  await frame(2)

  t.is(log, [el])

  el.remove()
  xs[Symbol.dispose]()

  await frame(2)
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
  await frame(2)
  t.is(el.count, 1)

  hx[Symbol.dispose]()
})
t('$: throwing error must not create recursion', async t => {
  let a = document.createElement('a')
  document.body.appendChild(a)
  console.groupCollapsed('error here')
  t.throws(() => $('a', el => {
    throw Error('That error is planned')
  }), 'That error is planned')
  console.groupEnd()
  await tick()

  document.body.removeChild(a)
  // as[Symbol.dispose]()
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
  t.is(log, ['a'])

  b.remove()
  a.remove()
  as[Symbol.dispose]()

  await frame(2)
  t.end()
})
t.browser('$: remove/add internal should not retrigger element', async t => {
  let a = document.createElement('a')
  let b = document.createElement('b')
  a.appendChild(b)

  let log = []
  let abs = $('a b', el => log.push('b'))
  setTimeout(() => document.body.appendChild(a))
  await time(5)
  await frame(2)
  t.deepEqual(log, ['b'])

  a.remove()
  abs[Symbol.dispose]()
  await frame(2)
  t.end()
})
t.browser('$: scoped asterisk selector', async t => {
  let log = [], el = document.body.appendChild(document.createElement('div'))
  let list = $(el, '*', el => log.push(el))
  let x, y, z
  el.appendChild(x = document.createElement('x'))
  el.appendChild(y = document.createElement('y'))
  await frame(2)
  t.is(log, [x, y])

  list[Symbol.dispose]()
  el.appendChild(z = document.createElement('y'))
  t.is(log, [x, y])

  document.body.removeChild(el)
})
t.browser('$: destructor is called on unmount', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  let log = []
  let all = $(el, '*', el => {
    log.push(1)
    return () => log.push(2)
  })
  t.deepEqual(log, [])
  el.innerHTML = 'x<a></a><a></a>x'
  await frame(4)
  t.deepEqual(log, [1, 1])

  el.innerHTML = ''
  await frame(4)
  t.deepEqual(log, [1, 1, 2, 2], 'clear up')
  all[Symbol.dispose]()

  el.innerHTML = 'x<a></a><a></a>x'
  await frame(2)
  t.deepEqual(log, [1, 1, 2, 2])
  el.innerHTML = ''
  t.end()
})
t.browser('$: changed attribute matches new nodes', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  el.innerHTML = '<a><b><c></c></b></a>'

  let log = []
  const abb = $(el, 'a b.b', e => {
    log.push('+2')
    return () => log.push('-2')
  })
  const abb2 = $(el, 'a b.b', e => { log.push('+2a')})
  const abbc = $(el, 'a b.b c', e => {
    log.push('+3')
    return () => log.push('-3')
  })
  await frame(2)

  t.is(log, [])
  await frame(2)
  t.is(log, [])

  console.log('add .b')
  el.querySelector('b').classList.add('b')
  await frame(2)
  t.is(log, ['+2', '+2a', '+3'])

  console.log('remove .b')
  el.querySelector('b').classList.remove('b')
  await frame(2)
  t.is(log, ['+2', '+2a', '+3', '-2', '-3'])


  console.log('add .b again')
  log = []
  el.querySelector('b').classList.add('b')
  await frame(2)
  t.is(log, ['+2', '+2a', '+3'])

  console.log('remove .b again')
  el.querySelector('b').classList.remove('b')
  await frame(2)
  t.is(log, ['+2', '+2a', '+3', '-2', '-3'])

  abb[Symbol.dispose]()
  abb2[Symbol.dispose]()
  abbc[Symbol.dispose]()

  console.log('destructed')
  log = []
  el.querySelector('b').classList.add('b')
  await frame(2)
  t.is(log, [])

  el.remove()
})
t.browser('$: contextual query', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  let log = []
  $(el, '.x y', y => {
    log.push('.x y')
  })
  $(el, '.x', el => {
    log.push('.x')
  })
  $(el, () => {
    log.push('-')
  })
  $(el, 'y', el => {
    log.push(' y')
  })
  el.innerHTML = '<x class="x"><y></y></x>'
  await frame(3)
  t.same(log, ['.x y', '.x', '-', ' y'])
})
t.browser('$: adding/removing attribute with attribute selector, mixed with direct selector', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  const log = []
  el.innerHTML = '<x></x>'
  const x = el.firstChild
  $(el, 'x', e => {})
  $(el, 'x[y]', e => {
    log.push(1)
    return () => log.push(2)
  })
  await frame(2)
  t.is(log, [])
  x.setAttribute('y', true)
  await frame(2)
  t.is(log, [1])
  x.removeAttribute('y')
  await frame(2)
  t.is(log, [1, 2])
  el.remove()
})
t.browser('$: matching nodes in added subtrees', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  let log = []
  $(el, 'a b c d', el => {
    log.push('+')
    return () => {
      log.push('-')
    }
  })
  el.innerHTML = '<a><b><c><d></d></c></b></a>'
  await frame(2)
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
t('async aspects', async t => {
  let a = document.createElement('a')
  document.body.appendChild(a)

  let log = []
  $('a', async el => {
    log.push(1)
    await tick()
    log.push(2)
    return () => log.push(3)
  })
  await frame(2)
  document.body.removeChild(a)
  await frame(2)
  t.is(log, [1, 2, 3])
})
t('rebinding to other document', async t => {
  let all = await import('nodom')
  let document = new Document()

  var div = document.createElement("div")
  div.className = "foo bar"

  $(div, el => {
    t.is(el.nodeName.toUpperCase(), 'DIV')
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
t('$: returned result is live collection', async t => {
  let scope = document.body.appendChild(document.createElement('div'))
  let els = $(scope, '.x')
  t.is([...els], [])
  scope.innerHTML = '<a class="x"></a>'
  await frame(2)
  t.is(els.length, 1)
  scope.innerHTML = '<a class="x"><b class="x"/></a>'
  await frame(4)
  t.is(els.length, 2)
  scope.innerHTML = ''
  await frame(2)
  t.is(els.length, 0)
  scope.remove()
})
t.todo('$: handles passed live collections like HTMLCollection')
t.todo('$: selecting by name', t => {
  let $f = $(h`<form><input name="a"/><input name="b"/></form>`)

  t.is($f[0].childNodes.length, 2)
  t.is($f.a, $f[0].childNodes[0])
  t.is($f.b, $f[0].childNodes[1])

  t.end()
})
t('$: init on list of elements', async t => {
  let log = []
  let el = document.body.appendChild(document.createElement('div'))
  el.innerHTML = '<a>1</a><a>2</a>'
  let chldrn = $(el.childNodes, el => {
    log.push(el.textContent)
    return () => log.push('un' + el.textContent)
  })
  t.is(log, ['1', '2'])
  el.innerHTML = ''
  chldrn[Symbol.dispose]()

  await frame(2)
  t.is(log, ['1', '2', 'un1', 'un2'])

  el.remove()
})
t.todo('$: init/destroy in body of web-component')
t('$: template literal', async t => {
  let el = document.createElement('div')
  document.body.appendChild(el)
  el.innerHTML = '<div class="x"></div><div class="x"></div>'

  let els = $`div.${'x'}`
  t.is([...els], [...el.childNodes])
})
t('$: v($)', async t => {
  let $l = $()
  let vl = v($l)
  let log = []
  vl(list => log.push([...list]))
  t.is(log, [[]])

  let x
  $l.add(x = document.createElement('div'))
  t.is(log, [[], [x]])
})
t.todo('$: changed attribute name', async t => {

})
t.skip('$: complex sync selector cases', async t => {
  $('a b c', e => {

  })
  $('')
})
t.demo('$: debugger cases', async t => {
  console.log('*', $('*'))
  console.log('empty', $())
  console.log('list', $([h`<a/>`, h`<b/>`, h`<c/>`]))
})
