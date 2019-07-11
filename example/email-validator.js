import $, {html, state} from 'spect'

const isValidEmail = (s) => /.+@.+\..+/i.test(s);

$('#mount', main)

function main(el) {
  let {value} = state()

  html`<${el}>
    Please enter an email address:
    <input ${value} name="email" onchange=${e => state({value: e.target.value})}/>

    The address is ${isValidEmail(value)}
  </>`
}
