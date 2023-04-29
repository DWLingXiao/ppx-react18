import { Container } from 'hostConfig'
import { ReactElememtType } from 'shared/ReactTypes'
import { FiberNode, FiberRootNode } from './fiber'
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	Update,
	UpdateQueue
} from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'
import { HostRoot } from './workTags'

export function createContainer(container: Container) {
	const hostRootFiber = new FiberNode(HostRoot, {}, null)
	const root = new FiberRootNode(container, hostRootFiber)
	hostRootFiber.updateQueue = createUpdateQueue()

	return root
}

export function updateContainer(
	element: ReactElememtType | null,
	root: FiberRootNode
) {
	const hostRootFiber = root.current
	const update = createUpdate<ReactElememtType | null>(element)
	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElememtType | null>,
		update
	)
	scheduleUpdateOnFiber(hostRootFiber)
	return element
}
