import t from 'tst'
import { $, fx, html } from '../src/index.js'
import { currentState } from '../src/spect.js';

t.skip('fx: readme case', t => {
  $(document.createElement('div'), el => {
    fx(async () => {
      html`Loading...`

      t.equal(el.innerHTML, 'Loading...')
      console.log(currentState)

      html`Loaded ${await (() => 123)}`
      console.log(currentState)

      t.equal(el.innerHTML, 'Loaded 123')
    }, [])
  })
})

t.only('fx: sync fx', t => {
  let log = []
  $(document.createElement('div'), el => {
    log.push('before')
    fx(() => {
      log.push('foo')
      html`<foo/>`
      t.equal(el.innerHTML, '<foo></foo>', 'html aftereffect')
    }, [])
    log.push('between')
    fx(() => {
      t.equal(el.innerHTML, '<foo></foo>')
      html`<bar/>`
      t.equal(el.innerHTML, '<bar></bar>')
      log.push('bar')
    }, [])
    log.push('after')
  })
  t.deepEqual(log, ['before', 'between', 'after', 'foo', 'bar'], 'correct sequence of calls')
})

t('fx: async fx')

t('fx: generator fx')

t('fx: promise')

t('fx: dep types')

t('fx: no-deps call')

t('fx: varying number of effects')
