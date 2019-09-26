export default function $(selector, within=document) {
  return within.querySelector(selector)
}
export function $$(selector, within = document) {
  return within.querySelectorAll(selector)
}
