import { fx as _fx } from './src/core.js'


export default registerEffect('fx', {
  set: (...fns) => {
    return { after: () => fns.forEach(fn => fn()) }
  }
})
