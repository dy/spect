import { t, tick } from './index.js'
import $, { mount } from '../index.js'

t('multiple mount callbacks', async t => {
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
  document.body.appendChild(x)

  await tick

  t.deepEqual(log, ['mount A', 'mount B'])

  document.body.removeChild(x)

  t.deepEqual(log, ['mount A', 'mount B', 'unmount A', 'unmount B'])
})


t.skip('instant remove/insert shouldn\'t trigger callback', async t => {
  // TODO
})
