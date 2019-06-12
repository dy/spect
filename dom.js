// DOM-specific spect setup

import { registerTarget } from './src/target/index.js'
import { registerEffect } from './src/effect/index.js'

import mount from './src/effect/mount.js'
import selector from './src/target/selector.js'

registerTarget(selector)
registerEffect(mount)

export { default } from './index.js'
export * from './index.js'

export { mount }
