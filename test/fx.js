import t from 'tst'
import $ from '../index.js'
import 'setimmediate'

t.only('fx: global effect is triggered after current callstack', async t => {
  let log = []
  $(document.createElement('a')).fx(() => log.push('a'))

  t.is(log, [])

  await Promise.resolve()

  t.is(log, ['a'])
})

t.only('fx: runs destructor', async t => {
  let log = []
  let $a = $(document.createElement('a'))

  let id = 0
  let fn = () => {
    // called each time
    $a.fx(() => {
      log.push('init 1')
      return () => log.push('destroy 1')
    })

    // called once
    $a.fx(() => {
      log.push('init 2')
      return () => log.push('destroy 2')
    }, [])

    // called any time deps change
    $a.fx(() => {
      log.push('init 3')
      return () => log.push('destroy 3')
    }, [id])
  }

  $a.use(fn)
  await Promise.resolve()
  t.is(log, ['init 1', 'init 2', 'init 3'])

  log = []
  $a.use(fn)
  await Promise.resolve()
  t.is(log, ['destroy 1', 'init 1'])

  log = [], id = 1
  $a.use(fn)
  await Promise.resolve()
  t.is(log, ['destroy 1', 'destroy 3', 'init 1', 'init 3'])
})
