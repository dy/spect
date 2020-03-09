import t from 'tst'
import { $, state, fx, prop, store, calc, attr, on } from '../index.js'
import { tick, frame, idle, time } from 'wait-please'

const list = store

t('store: core', async t => {
  let s = store({x: 1})
  let log = []
  fx(s => {
    log.push({...s})
  }, [s])

  await tick(8)
  t.is(log, [{x: 1}], 'init state')
  s.x = 2
  await tick(8)
  t.is(log, [{x: 1}, {x: 2}], 'change prop')

  s.x = 2
  await tick(8)
  t.is(log, [{x: 1}, {x: 2}], 'unchanged prop')


  log = []
  s.y = 'foo'
  await tick(8)
  t.is(log, [{ x:2, y:'foo' }], 'add new prop')

  log = []
  delete s.x
  await tick(8)
  t.is(log, [{y: 'foo'}], 'delete props')
})

t('store: must not expose internal props', async t => {
  let s = store({x: 1})
  let log  =[]
  for (let p in s) {
    log.push(p)
  }
  t.is(log, ['x'])
})


t('list: core', async t => {
  let s = list([1])
  let l
  fx(s => l = s, [s])

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

t('list: must not expose internal props', async t => {
  let s = list([])
  let log = []
  for (let p in []) {
    log.push(p)
  }
  t.is(log, [])
})

t.skip('list: bubbles up internal item updates', async t => {
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

t('list: fx sync init', async t => {
  let l = list([])
  let log = []
  fx(item => log.push(item.slice()), [l])

  t.is(log, [[]])
  await tick(8)
  t.is(log, [[]])

  l.push(1)
  await tick(8)
  t.is(log, [[], [1]])
})
