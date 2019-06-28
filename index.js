import spect, { registerEffect, effects } from './src/spect.js'

// import html from './src/fx/html'
// import create from './src/fx/create'
import mount from './src/fx/mount.js'

registerEffect('mount', mount)

export const mount = effects.mount


export default spect
