import t from 'tst'
import $, { mount } from '../index.js'


// TODO: parcel: export default from; regenerator runtime here
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

  document.documentElement.appendChild(x)

  await (() => {})

  t.deepEqual(log, ['mount A', 'mount B'])

  document.documentElement.removeChild(x)

  await (() => {})

  t.deepEqual(log, ['mount A', 'mount B', 'unmount A', 'unmount B'])
})


t.skip('instant remove/insert shouldn\'t trigger callback', async t => {
  // TODO
})
