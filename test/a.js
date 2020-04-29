import t from 'tst'
import { h, a } from '../index.js'
import { tick, frame, time } from 'wait-please'


t('a: observe path', async t => {
  let o = {x: 1}
  let xs = a(o, 'x')
  let log = []
  xs(v => log.push(v))

  t.is(log, [1])

  o.x = 2
  t.is(o, {x: 2})

  t.is(log, [1, 2])

  xs[Symbol.dispose]()
  o.x = 3

  t.is(log, [1, 2])
  t.is(o, {x: 3})
})

t('a: observe attribute / getset', async t => {
  let el = document.createElement('div')
  el.setAttribute('x', 1)
  let ex = a(el, 'x')
  let log = []
  ex(v => log.push(v))

  t.is(log, ['1'])
  t.is(ex(), '1')

  ex(2)
  t.is(log, ['1', 2])
  t.is(el.getAttribute('x'), '2')

  el.setAttribute('x', 3)
  await tick(2)
  t.is(log, ['1', 2, '3'])

  ex[Symbol.dispose]()
  el.setAttribute('x', 4)
  await tick(2)
  t.is(log, ['1', 2, '3'])
  t.is(ex(), undefined)
  ex(4)
  await tick(2)
  t.is(log, ['1', 2, '3'])
})

t('a: h recursion', async t => {
  let x = document.createElement('x')
  x.setAttribute('title', 'x')
  h`<${x}>${ a(x, 'title') }</>`
  t.is(x.innerHTML, 'x')

  x.x = 1
  h`<${x}>${ a(x, 'x') }</>`
  t.is(x.innerHTML, '1')

  x.setAttribute('y', 2)
  h`<${x}>${ a(x, 'y') }</>`
  t.is(x.innerHTML, '2')
})


// object
t.skip('v: object init', t => {
  let b = v({})
  t.is(b, {})

  let c = v({x:true, y:1, z: 'foo', w: []})
  t.is(c, {x: true, y: 1, z: 'foo', w: []})

  let d = v([])
  t.is(d, [])

  let e = v([1, 2, 3])
  t.is(e, [1, 2, 3])

  let el = document.createElement('div')
  Object.assign(el, c)
  let f = v(el)
  t.is({...f}, c)
})
t.todo('v: readme', t => {
  // object
  const obj = v({ foo: null })

  // set
  obj.foo = 'bar'

  // subscribe to changes
  let log = []
  v(({ foo }) => log.push(foo))
  // > 'bar'
  t.is(log, ['bar'])


  // array
  let arr = v([1, 2, 3])

  // set
  arr[3] = 4

  // mutate
  arr.push(5, 6)
  arr.unshift(0)

  // subscribe
  log = []
  arr(arr => log.push(...arr))
  // > [0, 1, 2, 3, 4, 5, 6]
  t.is(log, [0,1,2,3,4,5,6])


  // element
  let el = document.createElement('x')
  let props = v(el)

  // set
  props.loading = true

  // get
  t.is(props.loading, true)

  // subscribe
  log = []
  props(({loading}) => log.push(loading))
  t.is(log, [true])
})
t.todo('v: hidden proptypes unhide props', t => {
  let x = {[Symbol.for('x')]: 1}
  let ox = o(x, {[Symbol.for('x')]: null})
  t.is(ox, {[Symbol.for('x')]: 1})
  let log = []
  v(ox, ox => log.push(ox[Symbol.for('x')]))
  x[Symbol.for('x')] = 2
  t.is(log, [1, 2])
})
t.todo('v: store core', async t => {
  let s = o({x: 1})
  let log = []
  v(s, s => {
    // console.log('sub', {...s})
    log.push({...s})
  })

  await tick(8)
  t.is(log, [{x: 1}], 'init state')
  // console.log('set 2')
  s.x = 2
  await tick(8)
  t.is(log, [{x: 1}, {x: 2}], 'change prop')

  // s.x = 2
  // await tick(8)
  // t.is(log, [{x: 1}, {x: 2}], 'unchanged prop')


  log = []
  s.y = 'foo'
  await tick(8)
  t.is(log, [{ x:2, y:'foo' }], 'add new prop')

  log = []
  delete s.x
  await tick(8)
  t.is(log, [{y: 'foo'}], 'delete props')
})

t.todo('v: store must not expose internal props', async t => {
  let s = o({x: 1})
  let log  =[]
  for (let p in s) {
    log.push(p)
  }
  t.is(log, ['x'])
})
t.todo('v: list core', async t => {
  let s = o([1])
  let l
  v(s)(s => (l = s))

  await tick(8)
  t.is(l, [1], 'init state')

  s[0] = 2
  await tick(8)
  t.is(l, [2], 'change item')

  s[1] = 3
  await tick(8)
  t.is(l, [2, 3], 'add item directly')

  s.y = 'foo'
  await tick(8)
  t.is(l, [2, 3], 'set prop')
  t.is(l.y, 'foo', 'set prop')

  delete s.y
  await tick(8)
  t.is(l, [2, 3], 'delete prop')

  s.push(4)
  await tick(8)
  t.is(l, [2,3,4], 'push')

  s.unshift(0)
  await tick(8)
  t.is(l, [0, 2,3,4], 'unshift')

  s.reverse()
  await tick(8)
  t.is(l, [4,3,2,0], 'reverse')

  s.sort()
  await tick(8)
  t.is(l, [0,2,3,4], 'sort')

  s.splice(1,0,1)
  await tick(8)
  t.is(l, [0,1,2,3,4], 'splice')

  s.pop()
  await tick(8)
  t.is(l, [0,1,2,3], 'pop')

  s.shift()
  await tick(8)
  t.is(l, [1,2,3], 'shift')
})
t.todo('v: list must not expose internal props', async t => {
  let s = o([])
  let log = []
  for (let p in []) {
    log.push(p)
  }
  t.is(log, [])
})
t.todo('v: list fx sync init', async t => {
  let l = o([])
  let log = []
  v(l, item => log.push(item.slice()))

  t.is(log, [[]])
  await tick(8)
  t.is(log, [[]])

  l.push(1)
  await tick(8)
  t.any(log, [[[], [1]], [[], [1], [1]]])
})
t.todo('v: prop subscription', async t => {
  let obj = { x: 0 }
  let oobj = o(obj)
  t.is(oobj.x, 0)

  // observer 1
  let log = []
  // for await (const item of oobj) {
  //   log.push(item)
  // }
  v(oobj)(item => log.push(item.x))

  await tick(2)
  t.is(log, [0], 'initial value notification')

  obj.x = 1
  await tick(1)
  obj.x = 2
  await tick(8)
  t.is(log, [0, 1, 2], 'updates to latest value')
  obj.x = 3
  obj.x = 4
  obj.x = 5
  await tick(8)
  t.is(log.slice(-1), [5], 'updates to latest value')

  obj.x = 6
  t.is(obj.x, 6, 'reading value')
  await tick(8)
  t.is(log.slice(-1), [6], 'reading has no side-effects')

  obj.x = 7
  obj.x = 6
  await tick(8)
  t.is(log.slice(-1), [6], 'changing and back does not trigger too many times')

  oobj[Symbol.observable]()[Symbol.dispose]()
  // xs(null)
  obj.x = 7
  obj.x = 8
  t.is(obj.x, 8, 'end destructs property')
  await tick(10)
  t.is(log.slice(-1), [6], 'end destructs property')
})
t.todo('v: prop get/set', async t => {
  let ob = { x: () => { t.fail('Should not be called') } }
  let ox = o(ob)
  ox.x = 0
  t.is(ob, {x:0}, 'set is ok')
  t.is(ox, {x:0}, 'get is ok')
})
t.todo('v: prop multiple instances', async t => {
  let x = { x: 1 }
  let xs1 = o(x)
  let xs2 = o(x)

  xs2.x = 2

  t.is(xs1.x, xs2.x, 'same value')
  t.is(x.x, xs1.x, 'same value')
})
t.todo('v: prop minimize get/set invocations', async t => {
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

  let xs = o(obj)
  log = [] // skip init calls
  ;(async () => {
    // for await (let value of xs) {
      xs[Symbol.observable]()(value => {
        log.push('changed', value.x)
      })
    // }
  })();

  await tick(8)
  t.is(log, ['get', 0, 'changed', 0])

  obj.x
  await tick(8)
  t.is(log, ['get', 0, 'changed', 0, 'get', 0])

  // console.log('setx')
  obj.x = 1
  await tick(12)
  t.is(log, ['get', 0, 'changed', 0, 'get', 0, 'set', 1, 'get', 1, 'changed', 1])

  log = []
  xs[Symbol.observable]()[Symbol.dispose](null)
  t.is(log, [])

  obj.x
  t.is(log, ['get', 1])

  obj.x = 0
  await tick(8)
  t.is(log, ['get', 1, 'set', 0])
})
t.todo('v: prop observe store property')
t.skip('v: attr core', async t => {
  let el = document.createElement('div')
  let attrs = o(el, {x: Number})
  let log = []
  ;(async () => {
    attrs[Symbol.observable]().subscribe(el => log.push(el.x, el.getAttribute('x')))
  })()
  await tick(8)
  t.is(log, [undefined, null], 'init')
  el.setAttribute('x', 0, '0')
  el.setAttribute('x', 1, '1')
  el.setAttribute('x', 2, '2')
  await tick(12)
  t.is(log, [undefined, null, 2, '2'], 'basic')
  el.setAttribute('x', '3')
  el.setAttribute('x', '4')
  el.setAttribute('x', '5')
  await tick(8)
  t.is(log, [undefined, null, 2, '2', 5, '5'], 'updates to latest value')
  el.setAttribute('x', '5')
  el.setAttribute('x', '5')
  el.setAttribute('x', '5')
  await tick(8)
  t.is(log, [undefined, null, 2, '2', 5, '5'], 'ignores unchanged value')
  el.setAttribute('x', '6')
  // t.is(el.x, 6, 'reading applies value')
  await tick(8)
  // t.is(log, [null, '2', '5', '5', '6'], 'reading applies value')
  attrs[Symbol.observable]()[Symbol.dispose]()
  el.setAttribute('x', '7')
  await tick(8)
  t.is(el.getAttribute('x'), '7', 'end destroys property')
  t.is(log, [undefined, null, 2, '2', 5, '5', 6, '6'], 'end destroys property')
})
t.skip('v: attr get/set', async t => {
  let el = document.createElement('x')

  let ox = o(el)

  await tick(8)
  t.is(el.x, undefined)

  ox.x = true
  await tick(8)
  t.is(el.x , true)

  ox.x = 'abc'
  await tick(8)
  t.is(el.x, 'abc')

  ox.x = null
  await tick(8)
  t.is(el.x, null)

  ox[Symbol.observable]()[Symbol.dispose]()
  ox.x = 123
  await tick(8)
  t.is(el.x, null)
})
t.skip('v: attr correct cleanup', async t => {
  // nope: user may clean up himself if needed. Not always resetting to orig value is required, mb temporary setter.
  let el = document.createElement('div')
  el.setAttribute('x', 1)
  let xs = attr(el, 'x')
  t.is(xs(), '1')
  xs(2)
  t.is(el.getAttribute('x'), '2')
  xs(null)
  t.is(el.getAttribute('x'), '1')
})
t.skip('v: attr stream to attribute', async t => {
  let x = store([]), el = document.createElement('div')
  const a = attr(el, 'hidden')
  from(x, x => !x.length)(a)
  t.is(el.getAttribute('hidden'), '')
  x.push(1)
  t.is(el.getAttribute('hidden'), null)
  x.length = 0
  t.is(el.getAttribute('hidden'), '')
})
t.skip('v: attr must set for new props', async t => {
  let el = document.createElement('div')
  let props = o(el)
  props.x = 1
  t.is(el.getAttribute('x'), '1')
})
