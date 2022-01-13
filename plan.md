# plan

* [ ] publish to microjs

* [ ] Split h, v, and $ into separate components:
  + it's confusing now to have mix of 3 separate purpose funtions
    + often we need just value ref, or dom builder, not aspector
  + _spect_ better reflects aspecting purpose of library, not mix of 3 tools
  + allows <5kb entry for microjs
  + $ can act directly with templize, not necessary own h
  + less tests

* [x] ~~swap spect(cnt, sel, fn) to spect(sel, fn, cnt?) ?~~
  - cnt at the end is too far
  + cnt is optional
  - cnt specifies sel naturally...
  → no: makes more sense as first arg, aslo api-compatible
