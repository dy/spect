import t from './libs/tst.js'
import { $, h } from '../index.js'
import { tick, frame, idle, time } from './libs/wait-please.js'
// import { augmentor, useState, useEffect, useMemo } from 'augmentor/esm/index.js'
import v from '../v.js'
import {_match} from '../src/sym.js'

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
  t.is(ellog, ['x'], 'simple creation')

  container.appendChild(document.createElement('x'))
  container.appendChild(document.createElement('x'))
  await tick()
  t.is(ellog, ['x', 'x', 'x'], 'create multiple')

  let x2 = $('x', el => {
    proplog.push(1)
  })
  t.is(proplog, [1,1,1])
  container.appendChild(document.createElement('x'))
  await tick()
  t.is(ellog, ['x', 'x', 'x', 'x'], 'additional aspect')
  t.is(proplog, [1, 1, 1, 1], 'additional aspect')

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
t('$: dynamically assigned selector', async t => {
  let log = []

  let xs = $('.x', el => {
    log.push(el)
  })

  let el = document.createElement('div')
  document.body.appendChild(el)

  await frame(2)
  t.is(log, [])

  console.log('add class')
  el.classList.add('x')
  await frame(3)

  t.is(log, [el])

  el.remove()
  xs[Symbol.dispose]()

  await frame(2)
})
t.skip('$: simple hooks', async t => {
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
t('$: remove/add internal should not retrigger element', async t => {
  let a = document.createElement('a')
  let b = document.createElement('b')
  a.appendChild(b)

  let log = []
  let abs = $('a b', el => log.push('b'))
  setTimeout(() => document.body.appendChild(a))
  await time(5)
  await frame(2)
  t.is(log, ['b'])

  a.remove()
  abs[Symbol.dispose]()
  await frame(2)
  t.end()
})
t('$: scoped asterisk selector', async t => {
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
t('$: destructor is called on unmount', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  let log = []
  let all = $(el, '*', el => {
    log.push(1)
    return () => {
      log.push(2)
    }
  })
  t.is(log, [])
  el.innerHTML = 'x<a></a><a></a>x'
  await frame(2)
  t.is(log, [1, 1])

  el.innerHTML = ''
  await frame(4)
  t.is(log, [1, 1, 2, 2], 'clear up')
  all[Symbol.dispose]()

  el.innerHTML = 'x<a></a><a></a>x'
  await frame(2)
  t.is(log, [1, 1, 2, 2])
  el.innerHTML = ''
  t.end()
})
t('$: changed attribute matches new nodes', async t => {
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
  await frame(3)

  t.is(log, [])
  await frame(3)
  t.is(log, [])

  console.log('add .b')
  el.querySelector('b').classList.add('b')
  await frame(3)
  t.is(log, ['+2', '+2a', '+3'])

  console.log('remove .b')
  el.querySelector('b').classList.remove('b')
  await frame(3)
  t.is(log, ['+2', '+2a', '+3', '-2', '-3'])


  console.log('add .b again')
  log = []
  el.querySelector('b').classList.add('b')
  await frame(3)
  t.is(log, ['+2', '+2a', '+3'])

  console.log('remove .b again')
  el.querySelector('b').classList.remove('b')
  await frame(3)
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
t('$: contextual query', async t => {
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
t('$: adding/removing attribute with attribute selector, mixed with direct selector', async t => {
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
t('$: matching nodes in added subtrees', async t => {
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

  t.is(log, ['a', 'b', 'c'])

  $(a).dispose()

  t.is(log, ['a', 'b', 'c', '-c', '-b', '-a'])

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

  t.is(log, ['A', 'SPAN'])
})
t.todo('same target different aspects', async t => {
  let log = []

  let a = {}

  let afx, bfx
  await spect(a).use([afx = () => (log.push('a'), () => log.push('de a'))])
  t.is(log, ['a'])
  await spect(a).use([bfx = () => (log.push('b'), () => log.push('de b'))])
  t.is(log, ['a', 'b'])
})
t.todo('same aspect same target', async t => {
  let log = []
  let a = {}

  let fx = () => (log.push('a'), () => log.push('z'))
  await spect(a).use(fx)
  t.is(log, ['a'])
  await spect(a).use(fx)
  t.is(log, ['a'])
  await spect(a).use(fx)
  t.is(log, ['a'])
})
t('async aspects', async t => {
  let a = document.createElement('a')
  document.body.appendChild(a)

  let log = []
  let as = $('a', async el => {
    log.push(1)
    await tick()
    log.push(2)
    return () => log.push(3)
  })
  await frame(2)
  document.body.removeChild(a)
  await frame(2)
  t.is(log, [1, 2, 3])
  // as[Symbol.dispose]()
})
// FIXME: this breaks in travis
t.demo('rebinding to other document', async t => {
  let all = await import('./libs/nodom.js')
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
t('$: selecting by name', async t => {
  let $f = $(h`<form><input name="a"/><input name="b"/></form>`, 'input')

  t.is($f.length, 2)
  t.ok($f.a)
  t.ok($f.b)

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
t.todo('$: v($)', async t => {
  // TODO: do as strui/from
  let $l = $()
  let vl = v($l)
  let log = []
  vl(list => log.push([...list]))
  t.is(log, [[]])

  let x
  $l.add(x = document.createElement('div'))
  t.is(log, [[], [x]])
})
t('$: changed attribute name rewires reference', async t => {
  let el = document.body.appendChild(h`<div><a/><a/></div>`)
  let x = $(el, '#a, #b')
  el.childNodes[1].id = 'a'
  await frame(2)
  t.is([...x], [el.childNodes[1]])
  t.is(x.a, el.childNodes[1])

  console.log('set b')
  el.childNodes[1].id = 'b'
  x.forEach(el => (x.delete(el), x.add(el)))
  await tick(2)
  t.is([...x], [el.childNodes[1]])
  t.is(x.a, undefined)
  t.is(x.b, el.childNodes[1])

  el.innerHTML = ''
  await frame(2)
  t.is([...x], [])
  t.is(x.a, undefined)

  x[Symbol.dispose]()
  await frame(2)
})
t.todo('$: comma-separated simple selectors are still simple')
t('$: simple selector cases', async t => {
  let root = document.body.appendChild(h`<div.root/>`)

  let a = $(root, 'a#b c.d'), ab
  root.append(ab = h`<a#b><c/><c.d/></a><a><c.d/></a>`)
  await tick()
  t.is([...a], [root.childNodes[0].childNodes[1]])

  let b = $('a b#c.d[name=e] f')
  root.append(h`<a><b><f/></b><b#c.d><f/></b><b#c.d name=e><d/><f/></b></a>`)
  await tick(2)
  t.is([...b], [root.childNodes[2].childNodes[2].childNodes[1]])

  let c = $('a[name~="b"]')
  root.append(h`<a name="b c"></a>`)
  await tick()
  t.is([...c], [root.childNodes[3]])

  root.remove()
  a[Symbol.dispose]()
  b[Symbol.dispose]()
  c[Symbol.dispose]()
})
t('$: does not expose private props', t => {
  t.is(Object.keys($`privates`), [])
})
t.skip('$: complex selectors', async t => {
  $('a [x] b', el => {
  })

  $('a b > c')
})
t('$: conflicting names', t => {
  let el = document.createElement('div')
  el.innerHTML = '<a id="add"></a>'
  document.body.appendChild(el)
  let a = $`#add`
  console.log(a)

  a[Symbol.dispose]()
})
t('$: item, namedItem', async t => {
  let el = document.createElement('div')
  el.innerHTML = '<a id=add /><a id=b />'
  let a = $(el, 'a')

  await tick(4)

  t.is(a.add, el.firstChild)
  t.is(a.item(0), a.add)
  t.is(a.namedItem('add'), a.add)

  a[Symbol.dispose]()
})
t('$: debugger cases', async t => {
  let set
  console.log('*', set = $('*'))
  set.delete(document.body)
  console.log(set)
  t.is(set[_match], false)
  set[Symbol.dispose]()

  console.log('a', set = $('a'))
  t.is(set[_match], false)
  set[Symbol.dispose]()

  console.log('#a', set = $('#a'))
  t.is(set[_match], false)
  set[Symbol.dispose]()

  console.log('.a', set = $('.a'))
  t.is(set[_match], false)
  set[Symbol.dispose]()

  console.log('a#b', set = $('a#b'))
  t.is(set[_match], true)
  set[Symbol.dispose]()
  console.log('a b', set = $('a b'))
  t.is(set[_match], true)
  set[Symbol.dispose]()
  console.log('empty', $())
  console.log('list', $([h`<a#a/>`, h`<b#b/>`, h`<c name=c/>`]))
})


t.skip('$: FOUC on unmatch', async t => {
  let style = document.createElement('style')
  style.innerHTML = '.x { color: red; font-style: italic; }'
  document.body.appendChild(style)

  $('.x', el => {
    el.style.cssText = `font-size: 10rem;`
    return () => {
      el.style.cssText = ``
    }
  })

  let x = document.createElement('div')
  x.innerHTML = '123'
  document.body.appendChild(x)
  x.classList.add('x')

  setTimeout(() => x.classList.remove('x'), 1000)
})
