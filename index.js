import $ from './$.js'
import use from "./use"
import fx from "./fx"
import html from "./html"
import attr from "./attr"
import state from "./state"
import on from "./on"

Object.assign($.fn, {
  use, fx, html, attr, state, on
})

export default $
