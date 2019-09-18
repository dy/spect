import t from 'tst'
import $ from '..'
import mount from '../src/mount'

$.fn(mount)


t('mount: multiple mount callbacks', async t => {
  let log = []

  let x = document.createElement('div')

  let $x = $(x).use(({mount}) => {
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

  await $x

  t.deepEqual(log, ['mount A', 'mount B'], 'multiple mounts')

  document.documentElement.removeChild(x)
  await $x

  t.deepEqual(log, ['mount A', 'mount B', 'unmount A', 'unmount B'], 'multiple unmounts')
})

t('mount: unsynced aspects should not affect mount of each other', async t => {
  let log = []

  let el = document.createElement('div')

  let $el = $(el).use(({mount}) => {
    mount(() => {
      log.push('+a')
      return () => log.push('-a')
    })
  })

  $(el).use(({mount}) => {
    mount(() => {
      log.push('+b')
      return () => log.push('-b')
    })
  })

  await $el
  t.deepEqual(log, [])

  document.body.appendChild(el)
  await $el
  t.deepEqual(log, ['+a', '+b'])
})

t.skip('mount: instant remove/insert shouldn\'t trigger callback', async t => {
  // TODO
})

t.todo('mount: async callback')

t.todo('mount: generator callback')
