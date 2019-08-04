import t from 'tst'
import $ from '../index'

t('readme: intro', t => {
  let el = document.createElement('div')
  el.id = 'app'
  document.body.appendChild(el)


  // main aspect
  function app($app) {
    let id = 1
    // let [match, { id }] = $app.route('user/:id')
    // if (!match) return

    $app.fx(async () => {
      $app.state.loading = true
      // $app.user = await ky.get(`./api/user/${id}`)
      $app.state.user = new Promise(ok => setTimeout(() => ok({name: 'Yaddy'}), 1000))
      $app.state.loading = false
    }, id)

    $app.html`<div fx=${i18n}>${ !$app.state.loading ? `Hello, ${$app.state.user}!` : `Thanks for patience...` }</div>`
  }

  // preloader aspect
  function preloader($el) {
    console.log('preloader', $el.state.loading)
    if ($el.state.loading) $el.html`${$el.children} <canvas class="spinner" />`
  }

  // i18n aspect
  function i18n($el) {
    console.log('i18n')
    // $el.html=`${$el[0].textContent}`
    // useLocale($el.attr.lang || $(document.documentElement).attr.lang)
    // $el.html`${t`${$el.text}`}`
  }

  // run app
  $('#app').fx([app, preloader])


  // t.deepEqual(log, [])

  setTimeout(() => {
    console.log(el.outerHTML)
  })
})
