import { Dispatcher, Dispatch } from 'react/src/currentDispatcher'
import internal from 'shared/internal'
import { Action } from 'shared/ReactTypes'
import { FiberNode } from './fiber'
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
	UpdateQueue
} from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'

let currentlyRenderingFiber: FiberNode | null = null
let workInProgressHook: Hook | null = null
let currentHook: Hook | null = null

const { currentDispatcher } = internal

interface Hook {
	memoizedState: any
	updateQueue: unknown
	next: Hook | null
}

export function renderWithHooks(wip: FiberNode) {
	currentlyRenderingFiber = wip
	wip.memoizedState = null

	const current = wip.alternate
	if (current !== null) {
		currentDispatcher.current = HooksDispatcherOnUpdate
	} else {
		currentDispatcher.current = HooksDispatcherOnMount
	}

	const Component = wip.type
	const props = wip.pendingProps
	const children = Component(props)

	currentlyRenderingFiber = null
	workInProgressHook = null
	currentHook = null
	return children
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
}

const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState
}

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	// 找到当前useState对应的hook数据
	const hook = mountWorkInProgressHook()
	let memoizedState
	if (initialState instanceof Function) {
		memoizedState = initialState()
	} else {
		memoizedState = initialState
	}
	const queue = createUpdateQueue<State>()
	hook.updateQueue = queue
	hook.memoizedState = memoizedState
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const dispatch = (queue.dispatch = dispatchSetState.bind(
		null,
		currentlyRenderingFiber,
		queue
	))
	queue.dispatch = dispatch

	return [memoizedState, dispatch]
}

function updateState<State>(): [State, Dispatch<State>] {
	// 找到当前useState对应的hook数据
	const hook = updateWorkInProgressHook()

	// 计算state的逻辑
	const queue = hook.updateQueue as UpdateQueue<State>
	const pending = queue.shared.pending

	if (pending !== null) {
		const { memoizedState } = processUpdateQueue(hook.memoizedState, pending)
		hook.memoizedState = memoizedState
	}

	return [hook.memoizedState, queue.dispatch as Dispatch<State>]
}

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	const update = createUpdate(action)
	enqueueUpdate(updateQueue, update)
	scheduleUpdateOnFiber(fiber)
}

function updateWorkInProgressHook(): Hook {
	// TODO render阶段触发的更新

	// 正常调用更新方法更新
	let nextCurrentHook: Hook | null = null
	if (currentHook === null) {
		const current = currentlyRenderingFiber?.alternate
		if (current !== null) {
			nextCurrentHook = current?.memoizedState
		} else {
			nextCurrentHook = null
		}
	} else {
		nextCurrentHook = currentHook.next
	}

	if (nextCurrentHook === null) {
		throw new Error(
			`组件${currentlyRenderingFiber?.type}本次执行时hook多于上一次`
		)
	}

	currentHook = nextCurrentHook as Hook
	const newHook = {
		memoizedState: currentHook.memoizedState,
		updateQueue: currentHook.updateQueue,
		next: null
	}
	if (workInProgressHook === null) {
		// mount第一个hook
		if (currentlyRenderingFiber === null) {
			throw new Error('hooks只能在函数组件中执行')
		} else {
			workInProgressHook = newHook
			currentlyRenderingFiber.memoizedState = workInProgressHook
		}
	}
	return workInProgressHook
}

function mountWorkInProgressHook(): Hook {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	}
	if (workInProgressHook === null) {
		// mount第一个hook
		if (currentlyRenderingFiber === null) {
			throw new Error('hooks只能在函数组件中执行')
		} else {
			workInProgressHook = hook
			currentlyRenderingFiber.memoizedState = workInProgressHook
		}
	} else {
		// mount后续的hook
		workInProgressHook = workInProgressHook.next = hook
	}
	return workInProgressHook as Hook
}
