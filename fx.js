import { hook } from './src/core.js'


export default hook('fx', {
  set: (...fns) => {
    return { after: () => fns.forEach(fn => fn()) }
  }
})
