import { render } from 'react-dom'


function app((props) => {
	let [items, fetch] = async(fetchData, [])

	fx((title) => {
		document.title=title
	}, [props.title])

	let {app} = css(`
		.app {

		}
	`, [])

	let [header] = fx(header)

	let [element] = render(
	<main class={app} mod={provider}>
		<header x={1}/>
		<ul>
			{items.map(item => <li {...item}/>)}
		</ul>
	</main>,
	document.body, [items])

	raf(() => {

	}, [])

	destroy(() => {

	})

	gsm(, [])
}, [props])


function header ({element, children, ...props}) {

}


function provider ({element, children, ...props}) {
	// element.innerHTML = ''
	// props.store=store
	return <Provider><Lang>{ element }</Lang></Provider>
}

app({ userId: 1})
