// html effect
import htm from 'htm'
import snabbdom from 'snabbdom'
import snabH from 'snabbdom/h'
import snabClass from 'snabbdom/modules/class'
import snabProps from 'snabbdom/modules/props'
import snabStyle from 'snabbdom/modules/style'
import snabAttrs from 'snabbdom/modules/attributes'
import snabStyle from 'snabbdom/modules/style'
import snabEvent from 'snabbdom/modules/eventlisteners'
import snabDataset from 'snabbdom/modules/dataset'

import { currentTarget, callFx } from './spect.js'


// patcher includes all possible decorators for now
// TODO: mb remove data-, attr-, class- and props- stuff
const patch = snabbdom.init([
  snabClass, snabProps, snabAttrs, snabStyle, snabEvent, snabDataset
]);



function vhtml () {
  htm.call(h)
}



export default function html(statics) {
  // takes current target
  let target = currentTarget

  // builds target virtual DOM
  let vdom = vhtml(...arguments)

  // patches target to correspond to virtual dom
  patch(target, vdom)
}
