import { Dispatcher, resolveDispatcher } from './src/currentDispatcher'
import currentDispatcher from './src/currentDispatcher'
import { jsx, isValidElement as isValidElementFn } from './src/jsx'

export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resolveDispatcher()

	return dispatcher.useState(initialState)
}

// 内部共享数据
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
}

// React
export const version = '0.0.0'

// TODO 根据环境区分jsx/jsxDev
export const createElement = jsx

export const isValidElement = isValidElementFn
