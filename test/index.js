import t from 'tst'
import { $, state, fx, prop, store, ref } from '../index.js'
import { tick, frame, idle, time } from 'wait-please'
import { augmentor, useState, useEffect, useMemo } from 'augmentor'
import Observable from 'zen-observable/esm'
import observable from './observable.js'

t('$: tag selector', async t => {
  let ellog = []
  let proplog = []
  let container = document.body.appendChild(document.createElement('div'))

  let off1 = $('x', el => {
    ellog.push(el.tagName.toLowerCase())
  })

  container.appendChild(document.createElement('x'))
  await Promise.resolve()
  t.deepEqual(ellog, ['x'], 'simple creation')

  container.appendChild(document.createElement('x'))
  container.appendChild(document.createElement('x'))
  await Promise.resolve()
  t.deepEqual(ellog, ['x', 'x', 'x'], 'create multiple')

  let off2 = $('x', el => {
    proplog.push(1)
  })
  container.appendChild(document.createElement('x'))
  await Promise.resolve()
  t.deepEqual(ellog, ['x', 'x', 'x', 'x'], 'additional aspect')
  t.deepEqual(proplog, [1, 1, 1, 1], 'additional aspect')

  document.body.removeChild(container)
  off1()
  off2()

  t.end()
})
t('$: init existing elements', async t => {
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
t('$: dynamically assigned selector', async t => {
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
t('$: simple hooks', async t => {
  let el = document.createElement('div')

  $(el, augmentor(el => {
    let [count, setCount] = useState(0)
    el.count = count
    useEffect(() => {
      setCount(1)
    }, [])
  }))

  t.is(el.count, 0)
  await frame()
  t.is(el.count, 1)
})
t('$: aspects must be called in order', async t => {
  let log = []
  let a = document.createElement('a')

  let unspect = $(a, [() => (log.push(1)), () => log.push(2), () => log.push(3)])

  document.body.appendChild(a)

  await tick()

  t.deepEqual(log, [1, 2, 3])

  document.body.removeChild(a)
  unspect()
})
t('$: throwing error must not create recursion', async t => {
  let a = document.createElement('a')
  document.body.appendChild(a)
  console.groupCollapsed('error here')
  let unspect = $('a', el => {
    throw Error('That error is planned')
  })
  console.groupEnd()
  await tick()

  document.body.removeChild(a)
  unspect()
  t.end()
})
t('$: remove/add should not retrigger element', async t => {
  let a = document.createElement('a')
  let b = document.createElement('b')
  document.body.appendChild(b.appendChild(a))

  let log = []
  let unspect = $('a', el => {
    log.push('a')
  })
  setTimeout(() => {
    document.body.appendChild(a)
  })

  await time(10)
  t.deepEqual(log, ['a'])

  document.body.removeChild(a)
  unspect()
  await frame()
  t.end()
})
t('$: destructor is called on unmount', async t => {
  let el = document.createElement('div')
  let log = []
  let off = $('*', el => {
    log.push(1)
    return () => log.push(2)
  }, el)
  t.deepEqual(log, [])
  el.innerHTML = 'x<a></a><a></a>x'
  await tick()
  t.deepEqual(log, [1, 1])
  el.innerHTML = ''
  await tick()
  await frame()
  t.deepEqual(log, [1, 1, 2, 2])
  off()
  el.innerHTML = 'x<a></a><a></a>x'
  await tick()
  t.deepEqual(log, [1, 1, 2, 2])
  t.end()
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
t.todo('generators aspects')
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
  let unset = $(el.childNodes, el => {
    log.push(el.textContent)
    return () => log.push('un' + el.textContent)
  })
  t.deepEqual(log, ['1', '2'])
  // el.innerHTML = ''
  unset()
  await frame(2)
  t.deepEqual(log, ['1', '2', 'un1', 'un2'])
})

t('state: core', async t => {
  let s = state(0)

  // observer 1
  let log = []
  ;(async () => { for await (let value of s) log.push(value) })()

  t.equal(+s, 0, 'toPrimitive')
  t.equal(s.current, 0, 'current')
  t.equal(s.valueOf(), 0, 'valueOf')
  t.equal(s.toString(), 0, 'toString')
  t.equal(s(), 0, 's()')

  await tick()
  t.deepEqual(log, [0], 'should publish the initial state')

  s.current = 1
  t.equal(+s, 1, 'state.current = value')

  s(2)
  t.equal(+s, 2, 'state(value)')

  s(c => (t.equal(c, 2, 'state(old => )'), 3))
  t.equal(+s, 3, 'state(() => value)')

  // observer 2
  let log2 = []
  ;(async () => { for await (let value of s) log2.push(value) })()

  await tick(4)
  t.deepEqual(log, [0, 3], 'should track and notify first tick changes')
  await frame(10)
  s(4)
  await tick(4) // why 4 ticks delay?
  t.deepEqual(log, [0, 3, 4], 'arbitrary change 1')
  s(5)
  await tick(4)
  t.deepEqual(log, [0, 3, 4, 5], 'arbitrary change 2')

  t.deepEqual(log2, [3, 4, 5], 'secondary observer is fine')

  t.end()
})

t('prop: subscription', async t => {
  let o = { x: 0 }
  let xs = prop(o, 'x')
  t.is(xs(), 0)

  // observer 1
  let log = []
  ;(async () => { for await (const item of xs) {
    log.push(item)
  }})();

  await tick(2)
  t.is(log, [0], 'initial value notification')

  o.x = 1
  await tick()
  o.x = 2
  await tick()
  o.x = 3
  o.x = 4
  o.x = 5
  await tick(4)
  t.is(log, [0, 2, 5], 'updates to latest value')

  o.x = 6
  t.is(o.x, 6, 'reading value')
  await tick(4)
  t.is(log, [0, 2, 5, 6], 'reading has no side-effects')

  // o.x = 7
  // o.x = 6
  // await tick(4)
  // t.is(log, [0, 2, 5, 6], 'changing and back does not cause trigger')

  xs.close()
  o.x = 7
  t.is(o.x, 7, 'end destructs property')
  await tick(10)
  t.is(log, [0, 2, 5, 6], 'end destructs property')
})
t('prop: get/set', async t => {
  let o = { x: () => { t.fail('Should not be called') } }
  let xs = prop(o, 'x')
  xs(0)
  t.is(o.x, 0, 'set is ok')
  t.is(xs(), 0, 'get is ok')
})
t('prop: keep initial property value if applied/unapplied', async t => {
  let o = { foo: 'bar' }
  let foos = prop(o, 'foo')
  foos.close()
  t.is(o, {foo: 'bar'}, 'initial object is unchanged')
})
t('prop: multiple instances', async t => {
  let x = { x: 1}
  let xs1 = prop(x, 'x')
  let xs2 = prop(x, 'x')

  t.is(xs1, xs2, 'same ref')
})
t('prop: minimize get/set invocations', async t => {
  let log = []
  let obj = {
    _x: 0,
    get x() {
      log.push('get', this._x); return this._x
    },
    set x(x) {
      log.push('set', x);
      this._x = x
    }
  }

  let xs = prop(obj, 'x')
  ;(async () => {
    for await (let value of xs) {
      log.push('changed', value)
    }
  })();

  await tick(6)
  t.is(log, ['get', 0, 'changed', 0])

  obj.x
  await tick(6)
  t.is(log, ['get', 0, 'changed', 0, 'get', 0])

  obj.x = 1
  await tick(12)
  t.is(log, ['get', 0, 'changed', 0, 'get', 0, 'set', 1, 'get', 1, 'changed', 1])

  log = []
  xs.close()
  t.is(log, [])

  obj.x
  t.is(log, ['get', 1])

  obj.x = 0
  await tick(6)
  t.is(log, ['get', 1, 'set', 0])
})

t('fx: core', async t => {
  let a = state(0)
  let o = { b: 1 }
  let b = prop(o, 'b')

  let log = []
  fx((a, b) => {
    log.push(a, b)
  }, [a, b])

  await tick(4)
  t.is(log, [0, 1], 'initial state')
  a(1)
  a(2)
  await tick(5)
  t.is(log, [0, 1, 2, 1], 'changed state')
  o.b = 2
  await tick(5)
  t.is(log, [0, 1, 2, 1, 2, 2], 'changed prop')
  o.b = 2
  a(2)
  await tick(5)
  t.is(log, [0, 1, 2, 1, 2, 2], 'unchanged prop')
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

  await tick(4)
  t.is(log, ['in', 0, 0])

  log = []
  a(1)
  b(1)
  await tick(6)
  t.is(log, ['out', 0, 0, 'in', 1, 1], 'destructor is ok')
})
t('fx: disposed by unmounted element automatically')
t('fx: doesn\'t run unchanged', async t => {
  let a = ref(0)
  let log = []
  fx(a => {
    log.push(a)
  }, [a])

  await tick(4)
  t.is(log, [0])
  a(1)
  a(0)
  await tick(6)
  t.is(log, [0], 'does not run unchanged')
})
t('fx: no-deps/empty deps runs once', async t => {
  let log = []
  fx(() => {
    log.push(0)
  }, [])
  fx(() => {
    log.push(1)
  })

  await tick(6)
  t.is(log, [0, 1])
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

  await tick(50)
  t.is(log, [0, 1, 2, 3, 4])
})
t('fx: promise / observable / direct dep', async t => {
  let p = new Promise(r => setTimeout(() => r(2), 10))
  let O = new Observable(obs => setTimeout(setTimeout(() => obs.next(3), 20)))
  let o = observable(); setTimeout(() => o(4), 30)
  let v = 1

  let log = []
  fx((p, O, v, o) => {
    log.push(v, p, O, o)
  }, [p, O, v, o])

  await tick(4)
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

t.skip('store: core', async t => {
  let s = store({x: 1})
  let log = []
  fx(s => {
    console.log(s)
    log.push(s)
  }, [s])

  await tick(4)
  t.is(log, [{x: 1}])

  s.x = 2
  await tick(6)
  t.is(log, [{x: 1}, {x: 2}])
})
