import { Props, Key, Ref, ReactElememt } from 'shared/ReactTypes'
import { FunctionComponent, HostComponent, WorkTag } from './workTags'
import { Flags, NoFlags } from './fiberFlags'
import { Container } from 'hostConfig'

export class FiberNode {
	public type: any
	public tag: WorkTag
	public pendingProps: Props
	public key: Key
	public stateNode: any
	public ref: Ref

	public memoizedProps: Props | null
	public memoizedState: any
	public alternate: FiberNode | null
	public flags: Flags
	public updateQueue: unknown
	public subtreeFlag: Flags

	return: FiberNode | null
	sibling: FiberNode | null
	child: FiberNode | null
	index: number

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.tag = tag
		this.key = key
		this.stateNode = null
		this.type = null

		// 构成树状结构
		this.return = null
		this.sibling = null
		this.child = null
		this.index = 0

		this.ref = null

		// 作为工作单元
		this.pendingProps = pendingProps
		this.memoizedProps = null
		this.alternate = null
		this.updateQueue = null
		this.memoizedState = null

		// 副作用
		this.flags = NoFlags
		this.subtreeFlag = NoFlags
	}
}

export class FiberRootNode {
	public container: Container
	public current: FiberNode
	public finishedWork: FiberNode | null
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container
		this.current = hostRootFiber
		hostRootFiber.stateNode = this
		this.finishedWork = null
	}
}

export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let wip = current.alternate

	if (wip === null) {
		// mount
		wip = new FiberNode(current.tag, pendingProps, current.key)
		wip.stateNode = current.stateNode
		wip.alternate = current
		current.alternate = wip
	} else {
		// update
		wip.pendingProps = pendingProps
		wip.flags = NoFlags
		wip.subtreeFlag = NoFlags
	}
	wip.type = current.type
	wip.updateQueue = current.updateQueue
	wip.child = current.child
	wip.memoizedProps = current.memoizedProps
	wip.memoizedState = current.memoizedState

	return wip
}

export function createFiberFromElement(element: ReactElememt): FiberNode {
	const { type, key, props } = element
	let fiberTag: WorkTag = FunctionComponent

	if (typeof type === 'string') {
		fiberTag = HostComponent
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('未定义的type类型', element)
	}
	const fiber = new FiberNode(fiberTag, props, key)
	fiber.type = type
	return fiber
}