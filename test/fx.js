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

t('fx: sync fx', t => {
  let log = []
  let target = document.createElement('div')
  let count = 0

  const aspect = el => {
    log.push('before')

    // unchanged dep
    fx(() => {
      log.push('foo')
      html`<foo/>`
      t.equal(el.innerHTML, '<foo></foo>', 'html aftereffect')

      return () => log.push('un-foo')
    }, [])

    // direct dep
    fx(() => {
      html`<bar/>`
      t.equal(el.innerHTML, '<bar></bar>')
      log.push('bar')

      return () => log.push('un-bar')
    }, count)

    // no deps
    fx(() => {
      html`<baz/>`
      t.equal(el.innerHTML, '<baz></baz>')
      log.push('baz')

      return () => log.push('un-baz')
    })

    log.push('after')
  }

  $(target, aspect)
  t.deepEqual(log, ['before', 'after', 'foo', 'bar', 'baz'], 'correct sequence of calls')

  // console.log('---update')
  count++
  log = []
  $.update(target, aspect)
  t.deepEqual(log, ['before', 'after', 'un-bar', 'un-baz', 'bar', 'baz'], 'correct repeated call')

  // console.log('---destroy')
  log = []
  $.destroy(target, aspect)
  t.deepEqual(log, ['un-foo', 'un-bar', 'un-baz'], 'correct destroyal')

})

t.skip('fx: async fx', t => {
  let log = []

  $(document.createElement('div'), el => {
    fx(async () => {
      html`<foo/>`
      t.equal(el.innerHTML, '<foo></foo>', 'html aftereffect')
    }, [])

    // fx(async () => {
    //   t.equal(el.innerHTML, '<foo></foo>')
    //   html`<bar/>`
    //   t.equal(el.innerHTML, '<bar></bar>')
    // }, [])
  })

  // t.deepEqual(log, ['before', 'between', 'after', 'foo', 'bar'], 'correct sequence of calls')
})

t('fx: generator fx')

t('fx: promise')

t('fx: dep cases')

t('fx: no-deps call')

t('fx: varying number of effects')

t('fx: removes all effects on aspect removal')
