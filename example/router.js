import $, { h, route } from 'spect'

// it's sad though that the only thing that separates $ from h is this inconsistency of first selector.
$('#app', el => h`
  <${el}>
    <header ${topbar} title="App title"><//>
    <aside ${sidebar}><//>
    <main path=${el => history.location}>
      ${({path}) => page({path})}
    </main>
  </>
`)

function page({path}) {
  // html as side-effect allows single-flow rendering
  h`Loading...`

  // unredirect
  path = ({
    '/dashboard': '/',
    '/signIn': '/sign-in',
    '/user/:userId': '/user'
  })[path]

  import(path.slice(1)).then(h, err)
}


function sidebar (el) {
  h`<aside></aside>`
}

function header ({title}) {
  h`<header id="app-header">${title}</header>`
}

