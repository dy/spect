import $, {html, on, state, fx} from 'spect'


$('#mount', main)

function main (target) {
  // model
  let {celsius, fahren} = state()

  // events
  on('change', '#c', e => state({fahren: e.target.value}))
  on('change', '#f', e => state({celsius: e.target.value}))

  // reactions
  fx(() => state({ celsius:  (fahren - 32) / 1.8) }), [fahren])
  fx(() => state({ fahren:  (celsius * 9) / 5 + 32) }), [celsius])

  // html effect
  html`<${target}>
    <div>
      <label>Fahrenheit</>
      <input value=${fahren}).output({ fahrenInput: "input" })
    </>,
    <div>
      <label>Celsius</>
      <input value=${celsius}).output({ celsiusInput: "input" })
    </>
  </>`
}
