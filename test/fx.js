import t from 'tst'
import $ from '../index.js'

t('fx: global effect is triggered in frame', t => {
  let log = []
  $`<a/>`.fx(() => log.push('a'))
  t.is(log, ['a'])
})

t('fx: runs destructor', t => {
  let log = []
  let $a = $`<a/>`

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
  t.is(log, ['init 1', 'init 2', 'init 3'])

  log = []
  $a.use(fn)
  t.is(log, ['destroy 1', 'init 1'])

  log = [], id = 1
  $a.use(fn)
  t.is(log, ['destroy 1', 'init 1', 'destroy 3', 'init 3'])
})
