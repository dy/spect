import {
	async, css, fx, dom, react, dialog, snack, state, head,
	form, on, store, a11y, schema, interval, history, lazy,
	transition, url
} from 'mods'

// hooks are run only when input args have changed
// ? how to detect deps?
// ? how to nest into conditionals or detect order ? (principle is similar to JSX - we store VDOM on real DOM)
// so we ought to store VIRTUALJS on real JS and detect which token has called what, react uses order
// so this framework is inseparable from statical analyser
function app(props) {
	let [selectedItem, select] = state()

	let [items, error, loading, fetch] = async(fetchData)

	// ! [success, error, loading, method] = request(url)

	// args are parsed and used as deps
	let result = fx((title) => {
		document.title=title
	})

	css(`
		.app {

		}
	`)

	// props are deps
	// props are passed to hooks, no per-hook props
	// rerender is partial, keeping the order of items and not touching external content
	// id === ref
	// https://reakit.io/guide/composition
	let {app, header} = dom(
	<main id="app" class="app" mod={provider}>
		<header id="header" mod={Header}/>

		<ul mod={[preloadable, sortable, draggable]}>
			{items.map(item => <li {...item}/>)}
		</ul>
	</main>,
	document.body)

	// react-render sideeffect
	react(<NavBar/>, header)

	// dialogs sideeffect
	if(selectedItem) {
		dialog(<>{selectedItem}</>, app)
	}

	raf(() => {

	}, canvas)

	destroy(() => {
		document.body.removeChild(app)
	})
}


function Header ({element, children, ...props}) {
	return <nav>...</nav>
}


function provider ({element, children, ...props}) {
	// element.innerHTML = ''
	// props.store=store
	return <Provider>{ element }</Provider>
}

app({ userId: 1})
