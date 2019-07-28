import { t, delay } from './index.js'
import $, { mount } from '../dom.js'
import { h } from '../src/util.js'


// Selector cases
t('selectors basics', async t => {
  let log = []
  $('#app', el => {
    log.push('render')

    mount(() => {
      log.push('on')
      return () => log.push('off')
    })
  })

  let app = h`div#app`
  t.deepEqual(log, [])

  // should detect mount
  document.body.appendChild(app)
  await delay()
  t.deepEqual(log, ['render', 'on'], 'mount')

  document.body.removeChild(app)
  await delay()
  t.deepEqual(log, ['render', 'on', 'off'], 'unmount')
})

t('already mounted selector', async t => {
  let log = []


  let a = document.createElement('div')
  a.id = 'app'
  document.body.appendChild(a)

  $('#app', el => {
    mount(() => (log.push('mount'), () => log.push('unmount')) )
    log.push('render')
  })

  // should be instant
  // await delay()

  t.deepEqual(log, ['render', 'mount'])

  document.body.appendChild(a)
  await delay()
  t.deepEqual(log, ['render', 'mount'])

  document.body.removeChild(a)
  t.deepEqual(log, ['render', 'mount'])
  await delay()
  t.deepEqual(log, ['render', 'mount', 'unmount'])
})

t('replaced nodes, instantly mounted/unmounted', async t => {
  let log = []
  $('.app', el => {
    log.push('render')
    mount(() => {
      log.push('mount')
      return () => log.push('unmount')
    })
  })

  let el = document.createElement('div')
  el.classList.add('app')
  document.body.appendChild(el)
  document.body.removeChild(el)

  await delay()
  t.deepEqual(log, ['render'])

  document.body.appendChild(el)
  await delay()
  t.deepEqual(log, ['render', 'mount'])

  let x = document.body.appendChild(document.createElement('div'))
  x.appendChild(el)
  await delay()
  t.deepEqual(log, ['render', 'mount'])
  // FIXME: this is also possible, but replace fast-on-load then
  // t.deepEqual(log, ['render', 'mount', 'unmount', 'mount'])
})

t('new aspect by appending attribute matching selector', async t => {
  let log = []
  $('.a', el => {
    log.push('render')
    mount(() => {
      log.push('mount')
      return () => log.push('unmount')
    })
  })

  let a = document.createElement('a')
  document.body.appendChild(a)
  await delay()
  t.deepEqual(log, [])

  a.classList.add('a')
  await delay()
  t.deepEqual(log, ['render', 'mount'])
})


// TODO: container case

