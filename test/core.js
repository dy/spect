import t from 'tst'
import $ from '../src/index'
import { async } from 'q';

// --------------------- Multiaspect multitarget interaction
t('Same aspect different targets', async t => {})
t('Same target different aspects', async t => {})
t('Same aspect same target', async t => {})

t('Aspects remove themselves if no more match selector', async t => {
  let log = []

  let a = document.createElement('a')
  document.body.appendChild(a)

  $('.a', el => {
    log.push('init')
    return () => log.push('destroy')
  })

  await (_ => _)
  t.deepEqual(log, [])

  a.classList.add('a')
  await (_ => _)
  t.deepEqual(log, ['init'])

  a.classList.remove('a')
  await (_ => _)
  t.deepEqual(log, ['init', 'destroy'])

  document.body.removeChild(a)
})

t.skip('Sublisteners binds/unbinds itself depending on parent', async t => {
  let log = []

  let a = document.createElement('a')
  a.classList.add('a')
  a.innerHTML = '<div class="b"></div>'

  $('.a', el => {
    log.push('init a')

    $('.b', el => {
      log.push('init b')

      return () => log.push('uninit b')
    })

    return () => log.push('uninit a')
  })

  document.body.appendChild(a)

  await (() => {})
  t.deepEqual(log, ['init a', 'init b'])

  document.body.removeChild(a)
  await (() => {})

  t.deepEqual(log, ['init a', 'init b', 'uninit b', 'uninit a'])
})


// --------------------- Building aspects
t.skip('Returned effect acts like destructor', t => {
  let target = document.createElement('div')

  $('#target', () => {
    log.push('create')
    return () => {
      log.push('destroy')
    }
  })
})
