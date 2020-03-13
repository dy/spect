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

t.todo('o: reinit new own props define new observers, agnostic of prev os')

t('o: defined types create observers (with reflection to attributes if possible)')

t('o: reflect own props to attributes')

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
