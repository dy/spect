# plan

* [ ] make use of weakref (iterable weakmap)

* [ ] migrate tests to github

* [ ] publish to microjs

* [x] reogranize building

* [x] use sube as dependency?

* [x] Split h, v, and $ into separate components:
  + it's confusing now to have mix of 3 separate purpose funtions
    + often we need just value ref, or dom builder, not aspector
  + _spect_ better reflects aspecting purpose of library, not mix of 3 tools
  + allows <5kb entry for microjs
  + $ can act directly with templize, not necessary own h
  + less tests
  + reduces complexity/messiness of project, separates concerns of benchmarking etc.
  → hyperf, vref, spect

* [x] ~~swap spect(cnt, sel, fn) to spect(sel, fn, cnt?) ?~~
  - cnt at the end is too far
  + cnt is optional
  - cnt specifies sel naturally...
  → no: makes more sense as first arg, aslo api-compatible
