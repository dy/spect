import t from 'tst'
import { tick, time } from 'wait-please'
import { o, v } from '../index.js'


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
  t.is(x, {x: 2, y: 2})
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

})

t.todo('o: init', t => {
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
  t.is(f, c)
})

t('o: readme', t => {

})
