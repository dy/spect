import $, { html, route } from 'spect'

$('#app', el => html`
  <header ${topbar} title="App title"><//>
  <aside ${sidebar}><//>
  <main>${page}</main>
`)

function page(main) {
  html`Loading...`

  // unredirect
  path = ({
    '/dashboard': '/',
    '/signIn': '/sign-in',
    '/user/:userId': '/user'
  })[path]

  import(path).then(html, html)
}

function sidebar (el) {
  html`menu...`
}

function header (el) {
  attr({id: 'app-header'})
  html`${title}`
}

