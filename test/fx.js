import t from 'tst'
import { $, fx } from '../src/index.js'

t.only('fx: readme case', t => {
  $(document.createElement('div'), el => {
    fx(async () => {
      html`Loading...`

      t.equal(el.innerHTML, 'Loading...')

      html`Loaded ${await (() => 123)}`

      t.equal(el.innerHTML, 'Loaded 123')
    }, [])
  })
})

t('fx: sync fx')

t('fx: async fx')

t('fx: generator fx')

t('fx: dep types')

t('fx: no-deps call')
