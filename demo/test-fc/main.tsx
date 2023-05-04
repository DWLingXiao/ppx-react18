import { useState } from 'react'
import ReactDom from 'react-dom/client'

function App() {
	const [num, setNum] = useState(100)
	window.setNum = setNum
	return num === 3 ? <div>123</div> : <div>{num}</div>
}

ReactDom.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
)
