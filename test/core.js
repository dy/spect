import {t} from './index.js'

// --------------------- Multiaspect multitarget interaction
t('Same aspect different targets', async t => {})
t('Same target different aspects', async t => {})
t('Same aspect same target', async t => {})



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
