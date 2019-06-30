import spect, { registerEffect, effects } from './spect.js'

// import html from './src/fx/html'
// import create from './src/fx/create'
import mount from './fx/mount.js'

registerEffect('mount', mount)


export default spect
