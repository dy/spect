import t from 'tst'
import { value } from '../index.js'

t('value: value to value', t => {
  const a = value(0), b = value()
  a(b)
  t.is(a(), 0)
  t.is(b(), 0)
})
