import t from 'tst'
import $, { mount, html, state } from '../index.js'

t('mount: multiple mount callbacks', async t => {
  let log = []

  $('#x', el => {
    mount(() => {
      log.push('mount A')
      return () => {
        log.push('unmount A')
      }
    })

    mount(() => {
      log.push('mount B')
      return () => log.push('unmount B')
    })
  })

  let x = document.createElement('div')
  x.id = 'x'

  document.documentElement.appendChild(x)

  await (() => {})

  t.deepEqual(log, ['mount A', 'mount B'])

  document.documentElement.removeChild(x)

  await (() => {})

  t.deepEqual(log, ['mount A', 'mount B', 'unmount A', 'unmount B'])
})


t.skip('mount: instant remove/insert shouldn\'t trigger callback', async t => {
  // TODO
})
