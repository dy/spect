import t from 'tst'
import { tick, time } from 'wait-please'
import { o, v } from '../index.js'


// o
t('o: own props become observable on init only', t => {
  let x = Object.create({y: 1})
  x.x = 1

  let ox = o(x), log = []
  v(ox)(o => log.push({...o}))
  t.is({...ox}, {x: 1})
  t.is(log, [{x: 1}])
  x.x = 2
  t.is({...ox}, {x: 2})
  t.is(log, [{x:1}, {x:2}])

  x.z = 3
  t.is({...ox}, {x: 2, z: 3})
  t.is(log, [{x:1}, {x:2}])
})
t('o: reinit new own props defines new observers, agnostic of prev o-s', t => {
  let x = {x: 1}
  let ox = o(x)
  x.y = 2
  let oy = o(x)

  let logx = [], logy = []
  v(ox, x => logx.push({...x}))
  v(oy, y => logy.push({...y}))

  t.is(logx, [{x: 1, y: 2}])
  t.is(logy, [{x: 1, y: 2}])

  x.x = 2
  t.is(logx, [{x: 1, y: 2}, {x: 2, y: 2}])
  t.is(logy, [{x: 1, y: 2}, {x: 2, y: 2}])

  x.y = 3
  t.is(logx, [{x: 1, y: 2}, {x: 2, y: 2}])
  t.is(logy, [{x: 1, y: 2}, {x: 2, y: 2}, {x: 2, y: 3}])
})
t('o: defined types create observers (with reflection to attributes if possible)', t => {
  let x = {}
  let ox = o(x, {n: Number, b: Boolean, s: String, a: Array, o: Object, f: Function})

  t.is(ox, {n: undefined, b: undefined, s: undefined, a: undefined, o: undefined, f: undefined})
  x.n = '1'
  x.b = 1
  x.s = 123
  x.a = 'a'
  x.o = {x:1}
  let f = x.f = () => 1
  t.is(ox, {n: 1, b: true, s: '123', a: ['a'], o: {x:1}, f})
})
t('o: undefined types set value as passed', t => {
  let x = {x: 1, y: null}
  let ox = o(x)
  x.x = '2'
  x.y = 2
  t.is(x, {x: '2', y: 2})
})
t('o: ignored props', t => {
  let f = () => {}
  let x, ox = o(x = {
    x: 1,
    _x: 1,
    '@x': 1,
    [0]: 1,
    [Symbol.for('x')]: 1,
    y: f
    // #x: 1
  })
  let log = []
  v(ox, o => log.push({...o}))
  x._x = 2
  x.y = () => {}
  t.is(log, [{x: 1, _x: 1, '@x': 1, [0]: 1, [Symbol.for('x')]: 1, y:f}])
  t.is(log.length, 1)
})
t('o: reflect own props to attributes', t => {
  let div = document.createElement('div')
  div.x = 1
  let odiv = o(div)

  t.is(div.getAttribute('x'), '1')

  div.x = 2
  t.is(div.getAttribute('x'), '2')
})
t('o: read initial attribute values', t => {
  let el = document.createElement('div')
  el.setAttribute('x', 1)
  el.setAttribute('id', 2)
  el.classList.add('x')
  el.setAttribute('data-x', 1)
  el.setAttribute('aria-role', 'none')
  el.setAttribute('hidden', '')
  let props = o(el, {x: Number})
  t.is({...props}, {x: 1})
})
t('o: init', t => {
  let a = o()
  t.is(a, {})

  let b = o({})
  t.is(b, {})

  let c = o({x:true, y:1, z: 'foo', w: []})
  t.is(c, {x: true, y: 1, z: 'foo', w: []})

  let d = o([])
  t.is(d, [])

  let e = o([1, 2, 3])
  t.is(e, [1, 2, 3])

  let el = document.createElement('div')
  Object.assign(el, c)
  let f = o(el)
  t.is({...f}, c)
})
t('o: readme', t => {
  // object
  const obj = o({ foo: null })

  // set
  obj.foo = 'bar'

  // subscribe to changes
  let log = []
  v(obj, ({ foo }) => log.push(foo))
  // > 'bar'
  t.is(log, ['bar'])


  // array
  let arr = o([1, 2, 3])

  // set
  arr[3] = 4

  // mutate
  arr.push(5, 6)
  arr.unshift(0)

  // subscribe
  log = []
  v(arr, arr => log.push(...arr))
  // > [0, 1, 2, 3, 4, 5, 6]
  t.is(log, [0,1,2,3,4,5,6])


  // element
  let el = document.createElement('x')
  let props = o(el, { loading: Boolean })

  // set
  props.loading = true

  // get
  t.is(props.loading, true)
  // > true

  // attr
  t.is(el.getAttribute('loading'), '')
  // > ''

  // subscribe
  log = []
  v(props, ({loading}) => log.push(loading))
  t.is(log, [true])
})

// store
t('o: store core', async t => {
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
t('o: store must not expose internal props', async t => {
  let s = o({x: 1})
  let log  =[]
  for (let p in s) {
    log.push(p)
  }
  t.is(log, ['x'])
})

// list
t('o: list core', async t => {
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
t('o: list must not expose internal props', async t => {
  let s = o([])
  let log = []
  for (let p in []) {
    log.push(p)
  }
  t.is(log, [])
})
t.skip('o: list bubbles up internal item updates', async t => {
  let l = list(), s = state(0)
  l.push(s)

  let log = []
  fx(l => {
    log.push(l)
  }, [l])

  await tick(8)
  t.is(log, [[s]])

  s(1)
  await tick(8)
  t.is(log, [[s], [s]])
})
t('o: list fx sync init', async t => {
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

// prop
t('o: prop subscription', async t => {
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

  oobj[Symbol.observable]().cancel()
  // xs(null)
  obj.x = 7
  obj.x = 8
  t.is(obj.x, 8, 'end destructs property')
  await tick(10)
  t.is(log.slice(-1), [6], 'end destructs property')
})
t('o: prop get/set', async t => {
  let ob = { x: () => { t.fail('Should not be called') } }
  let ox = o(ob)
  ox.x = 0
  t.is(ob, {x:0}, 'set is ok')
  t.is(ox, {x:0}, 'get is ok')
})
t('o: prop multiple instances', async t => {
  let x = { x: 1 }
  let xs1 = o(x)
  let xs2 = o(x)

  xs2.x = 2

  t.is(xs1.x, xs2.x, 'same value')
  t.is(x.x, xs1.x, 'same value')
})
t('o: prop minimize get/set invocations', async t => {
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
  xs[Symbol.observable]().cancel(null)
  t.is(log, [])

  obj.x
  t.is(log, ['get', 1])

  obj.x = 0
  await tick(8)
  t.is(log, ['get', 1, 'set', 0])
})
t.todo('o: prop observe store property')

// attr
t('o: attr core', async t => {
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
  attrs[Symbol.observable]().cancel()
  el.setAttribute('x', '7')
  await tick(8)
  t.is(el.getAttribute('x'), '7', 'end destroys property')
  t.is(log, [undefined, null, 2, '2', 5, '5', 6, '6'], 'end destroys property')
})
t('o: attr get/set', async t => {
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

  ox[Symbol.observable]().cancel()
  ox.x = 123
  await tick(8)
  t.is(el.x, null)
})
t.skip('o: attr correct cleanup', async t => {
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
t.skip('o: attr stream to attribute', async t => {
  let x = store([]), el = document.createElement('div')
  const a = attr(el, 'hidden')
  from(x, x => !x.length)(a)
  t.is(el.getAttribute('hidden'), '')
  x.push(1)
  t.is(el.getAttribute('hidden'), null)
  x.length = 0
  t.is(el.getAttribute('hidden'), '')
})
