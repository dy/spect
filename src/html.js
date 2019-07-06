// html effect
import htm from 'htm'
import { init as snabInit } from 'snabbdom'
import snabH from 'snabbdom/h'
import snabClass from 'snabbdom/modules/class'
import snabProps from 'snabbdom/modules/props'
import snabStyle from 'snabbdom/modules/style'
import snabAttrs from 'snabbdom/modules/attributes'
import snabEvent from 'snabbdom/modules/eventlisteners'
import snabDataset from 'snabbdom/modules/dataset'
import toVNode from 'snabbdom/tovnode'

import { currentTarget, callFx } from './spect.js'
import { isObject } from './util.js'

// patcher includes all possible decorators for now
// TODO: mb remove data-, attr-, class- and props- stuff
const patch = snabInit([
  snabClass, snabProps, snabAttrs, snabStyle, snabEvent, snabDataset
]);

// wrap snabH to connect to htm
function h(target, props, ...children) {
  if (!props) props = {}

  if (target === '...') {
    // return snabH('x', {}, [])
    return tracking.get(currentTarget).origVnode.children
  }

  // fragment targets return array
  if (target === '') return children

  // nested fragments create nested arrays
  children = children.flat()

  return snabH(target, props, children)
}


// vnodes per targets
const tracking = new WeakMap()

export default function html(statics) {
  // FIXME: dirty little hack to make <...> possible, consider that fast
  // forking htm for that is too much
  arguments[0] = statics.map(str => str.replace('<...>', '<.../>').replace('<br>', '<br/>').replace('<hr>', '<hr/>'))

  // takes current target
  let target = currentTarget
  let aspect = currentAspect

  if (!tracking.has(target)) {
    tracking.set(target, {vnode: toVNode(target), origVnode: toVNode(target)})
  }
  let state = tracking.get(target)

  // builds target virtual DOM
  let newVnode = snabH(state.vnode.sel, state.vnode.data, htm.apply(h, arguments))

  console.log(state.vnode, newVnode)
  state.vnode = patch(state.vnode, newVnode)
}
