import './testfill.js'
import spect from '../src/index.js'
import t, {is, throws, same, ok} from 'tst'
import { tick, frame, idle, time } from 'wait-please'
import v from 'value-ref'
import h from 'hyperf'

t('spect: tag selector', async t => {
  let ellog = []
  let proplog = []
  let container = document.body.appendChild(document.createElement('div'))


  let x1 = spect('x', el => {
    ellog.push(el.tagName.toLowerCase())
  })

  let el = document.createElement('x')
  container.appendChild(el)
  await tick()
  is(ellog, ['x'], 'simple creation')

  container.appendChild(document.createElement('x'))
  container.appendChild(document.createElement('x'))
  await tick()
  is(ellog, ['x', 'x', 'x'], 'create multiple')

  let x2 = spect('x', el => {
    proplog.push(1)
  })
  is(proplog, [1,1,1])
  container.appendChild(document.createElement('x'))
  await tick()
  is(ellog, ['x', 'x', 'x', 'x'], 'additional aspect')
  is(proplog, [1, 1, 1, 1], 'additional aspect')

  document.body.removeChild(container)
  x1.dispose()
  x2.dispose()

})
t('spect: init existing elements', async t => {
  let log = []
  let container = document.body.appendChild(document.createElement('div'))
  container.appendChild(document.createElement('x'))
  container.appendChild(document.createElement('x'))

  let xs = spect('x', el => {
    log.push(el.tagName.toLowerCase())
  })

  await Promise.resolve()
  is(log, ['x', 'x'], 'simple creation')

  xs.dispose()
  document.body.removeChild(container)
})
t('spect: dynamically assigned selector', async t => {
  let log = []

  let xs = spect('.x', el => {
    log.push(el)
  })

  let el = document.createElement('div')
  document.body.appendChild(el)

  await frame(2)
  is(log, [])

  console.log('add class')
  el.classList.add('x')
  await frame(3)

  is(log, [el])

  el.remove()
  xs.dispose()

  await frame(2)
})
t.skip('spect: simple hooks', async t => {
  let el = document.createElement('div')

  const hx = spect(el, augmentor(el => {
    let [count, setCount] = useState(0)
    el.count = count
    useEffect(() => {
      setCount(1)
    }, [])
  }))

  is(el.count, 0)
  await frame(2)
  is(el.count, 1)

  hx.dispose()
})
t('spect: throwing error must not create recursion', async t => {
  let a = document.createElement('a')
  document.body.appendChild(a)
  // console.groupCollapsed('error here')
  throws(() => spect('a', el => {
    throw Error('That error is planned')
  }), 'That error is planned')
  // console.groupEnd()
  await tick()

  document.body.removeChild(a)
  // as.dispose()
})
t('spect: remove/add should not retrigger element', async t => {
  let a = document.createElement('a')
  let b = document.createElement('b')
  document.body.appendChild(b.appendChild(a))

  let log = []
  let as = spect('a', el => log.push('a'))
  setTimeout(() => document.body.appendChild(a))

  await time(10)
  is(log, ['a'])

  b.remove()
  a.remove()
  as.dispose()

  await frame(2)
})
t('spect: remove/add internal should not retrigger element', async t => {
  let a = document.createElement('a')
  let b = document.createElement('b')
  a.appendChild(b)

  let log = []
  let abs = spect('a b', el => log.push('b'))
  setTimeout(() => document.body.appendChild(a))
  await time(5)
  await frame(2)
  is(log, ['b'])

  a.remove()
  abs.dispose()
  await frame(2)
})
t('spect: scoped asterisk selector', async t => {
  let log = [], el = document.body.appendChild(document.createElement('div'))
  let list = spect(el, '*', el => log.push(el))
  let x, y, z
  el.appendChild(x = document.createElement('x'))
  el.appendChild(y = document.createElement('y'))
  await frame(2)
  is(log, [x, y])

  list.dispose()
  el.appendChild(z = document.createElement('y'))
  is(log, [x, y])

  document.body.removeChild(el)
})
t('spect: destructor is called on unmount', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  let log = []
  let all = spect(el, '*', el => {
    log.push(1)
    return () => {
      log.push(2)
    }
  })
  is(log, [])
  el.innerHTML = 'x<a></a><a></a>x'
  await frame(2)
  is(log, [1, 1])

  el.innerHTML = ''
  await frame(4)
  is(log, [1, 1, 2, 2], 'clear up')
  all.dispose()

  el.innerHTML = 'x<a></a><a></a>x'
  await frame(2)
  is(log, [1, 1, 2, 2])
  el.innerHTML = ''
})
t('spect: changed attribute matches new nodes', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  el.innerHTML = '<a><b><c></c></b></a>'

  let log = []
  const abb = spect(el, 'a b.b', e => {
    log.push('+2')
    return () => log.push('-2')
  })
  const abb2 = spect(el, 'a b.b', e => { log.push('+2a')})
  const abbc = spect(el, 'a b.b c', e => {
    log.push('+3')
    return () => log.push('-3')
  })
  await frame(3)

  is(log, [])
  await frame(3)
  is(log, [])

  console.log('add .b')
  el.querySelector('b').classList.add('b')
  await frame(3)
  is(log, ['+2', '+2a', '+3'])

  console.log('remove .b')
  el.querySelector('b').classList.remove('b')
  await frame(3)
  is(log, ['+2', '+2a', '+3', '-2', '-3'])


  console.log('add .b again')
  log = []
  el.querySelector('b').classList.add('b')
  await frame(3)
  is(log, ['+2', '+2a', '+3'])

  console.log('remove .b again')
  el.querySelector('b').classList.remove('b')
  await frame(3)
  is(log, ['+2', '+2a', '+3', '-2', '-3'])

  abb.dispose()
  abb2.dispose()
  abbc.dispose()

  console.log('destructed')
  log = []
  el.querySelector('b').classList.add('b')
  await frame(2)
  is(log, [])

  el.remove()
})
t('spect: contextual query', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  let log = []
  spect(el, '.x y', y => {
    log.push('.x y')
  })
  spect(el, '.x', el => {
    log.push('.x')
  })
  spect(el, () => {
    log.push('-')
  })
  spect(el, 'y', el => {
    log.push(' y')
  })
  el.innerHTML = '<x class="x"><y></y></x>'
  await frame(3)
  same(log, ['.x y', '.x', '-', ' y'])
})
t('spect: adding/removing attribute with attribute selector, mixed with direct selector', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  const log = []
  el.innerHTML = '<x></x>'
  const x = el.firstChild
  spect(el, 'x', e => {})
  spect(el, 'x[y]', e => {
    log.push(1)
    return () => log.push(2)
  })
  await frame(2)
  is(log, [])
  x.setAttribute('y', true)
  await frame(2)
  is(log, [1])
  x.removeAttribute('y')
  await frame(2)
  is(log, [1, 2])
  el.remove()
})
t('spect: matching nodes in added subtrees', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  let log = []
  spect(el, 'a b c d', el => {
    log.push('+')
    return () => {
      log.push('-')
    }
  })
  el.innerHTML = '<a><b><c><d></d></c></b></a>'
  await frame(2)
  is(log, ['+'])
  el.innerHTML = ''
  await frame(2)
  is(log, ['+', '-'])
})
t.todo('subaspects', async t => {
  let log = []

  let a = document.body.appendChild(document.createElement('a'))
  let b = a.appendChild(document.createElement('b'))
  let c = b.appendChild(document.createElement('c'))

  await spect('a').use(el => {
    log.push('a')
    spect('b').use(el => {
      log.push('b')
      spect('c').use(el => {
        log.push('c')
        return () => log.push('-c')
      })
      return () => log.push('-b')
    })
    return () => log.push('-a')
  })

  is(log, ['a', 'b', 'c'])

  spect(a).dispose()

  is(log, ['a', 'b', 'c', '-c', '-b', '-a'])

  document.body.removeChild(a)
})
t.todo('new custom element', t => {
  spect('custom-element', () => {

  })
})
t.todo('duplicates are ignored', async t => {
  let log = []

  await spect({}).use([fn, fn, fn])

  function fn() {
    log.push(1)
  }

  is(log, [1])

  await spect({}).use([fn, fn, fn])

  is(log, [1, 1])
})
t.skip('same aspect different targets', t => {
  let log = []
  function fx([el]) {
    log.push(el.tagName)
    // return () => log.push('destroy ' + el.tagName)
  }

  let $el = spect({ tagName: 'A' }).use(fx)

  is($el.target.tagName, log[0])
  is(log, ['A'])

  $el.target.innerHTML = '<span></span>'
  spect($el.target.firstChild).use(fx)

  is(log, ['A', 'SPAN'])
})
t.todo('same target different aspects', async t => {
  let log = []

  let a = {}

  let afx, bfx
  await spect(a).use([afx = () => (log.push('a'), () => log.push('de a'))])
  is(log, ['a'])
  await spect(a).use([bfx = () => (log.push('b'), () => log.push('de b'))])
  is(log, ['a', 'b'])
})
t.todo('same aspect same target', async t => {
  let log = []
  let a = {}

  let fx = () => (log.push('a'), () => log.push('z'))
  await spect(a).use(fx)
  is(log, ['a'])
  await spect(a).use(fx)
  is(log, ['a'])
  await spect(a).use(fx)
  is(log, ['a'])
})
t('async aspects', async t => {
  let a = document.createElement('a')
  document.body.appendChild(a)

  let log = []
  let as = spect('a', async el => {
    log.push(1)
    await tick()
    log.push(2)
    return () => log.push(3)
  })
  await frame(2)
  document.body.removeChild(a)
  await frame(2)
  is(log, [1, 2, 3])
  // as.dispose()
})
// FIXME: this breaks in travis
t.demo('rebinding to other document', async t => {
  let all = await import('./libs/nodom.js')
  let document = new Document()

  var div = document.createElement("div")
  div.className = "foo bar"

  spect(div, el => {
    is(el.nodeName.toUpperCase(), 'DIV')
  })
})
t.skip('empty selectors', t => {
  let $x = spect()
  is($x.length, 0)

  let $y = spect('xyz')
  is($y.length, 0)

  let $z = spect(null)
  is($z.length, 0)

  // NOTE: this one creates content
  // let $w = spect`div`
  // is($w.length, 0)

  t.notEqual($x, $y)
  t.notEqual($x, $z)
  // t.notEqual($x, $w)
})
t('spect: returned result is live collection', async t => {
  let scope = document.body.appendChild(document.createElement('div'))
  let els = spect(scope, '.x')
  is([...els], [])
  scope.innerHTML = '<a class="x"></a>'
  await frame(2)
  is(els.length, 1)
  scope.innerHTML = '<a class="x"><b class="x"/></a>'
  await frame(4)
  is(els.length, 2)
  scope.innerHTML = ''
  await frame(2)
  is(els.length, 0)
  scope.remove()
})
t.todo('spect: handles passed live collections like HTMLCollection')
t('spect: selecting by name', async t => {
  let $f = spect(h`<form><input name="a"/><input name="b"/></form>`, 'input')

  is($f.length, 2)
  ok($f.a)
  ok($f.b)

})
t('spect: init on list of elements', async t => {
  let log = []
  let el = document.body.appendChild(document.createElement('div'))
  el.innerHTML = '<a>1</a><a>2</a>'
  let chldrn = spect(el.childNodes, el => {
    log.push(el.textContent)
    return () => log.push('un' + el.textContent)
  })
  is(log, ['1', '2'])
  el.innerHTML = ''
  chldrn.dispose()

  await frame(2)
  is(log, ['1', '2', 'un1', 'un2'])

  el.remove()
})
t.todo('spect: init/destroy in body of web-component')
t('spect: template literal', async t => {
  let el = document.createElement('div')
  document.body.appendChild(el)
  el.innerHTML = '<div class="x"></div><div class="x"></div>'

  let els = spect`div.${'x'}`
  is([...els], [...el.childNodes])
})
t.todo('spect: v($)', async t => {
  // TODO: do as strui/from
  let $l = spect()
  let vl = v($l)
  let log = []
  vl(list => log.push([...list]))
  is(log, [[]])

  let x
  $l.add(x = document.createElement('div'))
  is(log, [[], [x]])
})
t('spect: changed attribute name rewires reference', async t => {
  let el = document.body.appendChild(h`<div><a/><a/></div>`)
  let x = spect(el, '#a, #b')
  el.childNodes[1].id = 'a'
  await frame(2)
  is([...x], [el.childNodes[1]])
  is(x.a, el.childNodes[1])

  console.log('set b')
  el.childNodes[1].id = 'b'
  x.forEach(el => (x.delete(el), x.add(el)))
  await tick(2)
  is([...x], [el.childNodes[1]])
  is(x.a, undefined)
  is(x.b, el.childNodes[1])

  el.innerHTML = ''
  await frame(2)
  is([...x], [])
  is(x.a, undefined)

  x.dispose()
  await frame(2)
})
t.todo('spect: comma-separated simple selectors are still simple')
t('spect: simple selector cases', async t => {
  let root = document.body.appendChild(h`<div.root/>`)

  let a = spect(root, 'a#b c.d'), ab
  root.append(ab = h`<a#b><c/><c.d/></a><a><c.d/></a>`)
  await tick()
  is([...a], [root.childNodes[0].childNodes[1]])

  let b = spect('a b#c.d[name=e] f')
  root.append(h`<a><b><f/></b><b#c.d><f/></b><b#c.d name=e><d/><f/></b></a>`)
  await tick(2)
  is([...b], [root.childNodes[2].childNodes[2].childNodes[1]])

  let c = spect('a[name~="b"]')
  root.append(h`<a name="b c"></a>`)
  await tick()
  is([...c], [root.childNodes[3]])

  root.remove()
  a.dispose()
  b.dispose()
  c.dispose()
})
t('spect: does not expose private props', t => {
  is(Object.keys(spect`privates`), [])
})
t.skip('spect: complex selectors', async t => {
  spect('a [x] b', el => {
  })

  spect('a b > c')
})
t('spect: conflicting names', t => {
  let el = document.createElement('div')
  el.innerHTML = '<a id="add"></a>'
  document.body.appendChild(el)
  let a = spect`#add`
  console.log(a)

  a.dispose()
})
t('spect: item, namedItem', async t => {
  let el = document.createElement('div')
  el.innerHTML = '<a id=add /><a id=b />'
  let a = spect(el, 'a')

  await tick(4)

  is(a.add, el.firstChild)
  is(a.item(0), a.add)
  is(a.namedItem('add'), a.add)

  a.dispose()
})
t('spect: debugger cases', async t => {
  let set
  console.log('*', set = spect('*'))
  set.delete(document.body, true)
  console.log(set)
  // is(set._match, false)
  set.dispose()

  console.log('a', set = spect('a'))
  // is(set._match, false)
  set.dispose()

  console.log('#a', set = spect('#a'))
  // is(set._match, false)
  set.dispose()

  console.log('.a', set = spect('.a'))
  // is(set._match, false)
  set.dispose()

  console.log('a#b', set = spect('a#b'))
  // is(set._match, true)
  set.dispose()
  console.log('a b', set = spect('a b'))
  // is(set._match, true)
  set.dispose()
  console.log('empty', spect())
  console.log('list', spect([h`<a#a/>`, h`<b#b/>`, h`<c name=c/>`]))
})


t.skip('spect: FOUC on unmatch', async t => {
  let style = document.createElement('style')
  style.innerHTML = '.x { color: red; font-style: italic; }'
  document.body.appendChild(style)

  spect('.x', el => {
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

