import t from 'tst'
import $, { mount } from '../src/index.js'

t('mount: multiple mount callbacks', async t => {
  let log = []

  let x = document.createElement('div')

  $(x, el => {
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

  document.documentElement.appendChild(x)

  await (() => {})

  t.deepEqual(log, ['mount A', 'mount B'], 'multiple mounts')

  document.documentElement.removeChild(x)

  await (() => {})

  t.deepEqual(log, ['mount A', 'mount B', 'unmount A', 'unmount B'], 'multiple unmounts')
})

t('mount: unsynced aspects should not affect mount of each other', async t => {
  let log = []

  let el = document.createElement('div')

  $(el, () => {
    mount(() => {
      log.push('+a')
      return () => log.push('-a')
    })
  })

  $(el, () => {
    mount(() => {
      log.push('+b')
      return () => log.push('-b')
    })
  })

  await (_=>_)
  t.deepEqual(log, [])

  document.body.appendChild(el)
  await (_=>_)
  t.deepEqual(log, ['+a', '+b'])
})


t.skip('mount: instant remove/insert shouldn\'t trigger callback', async t => {
  // TODO
})
