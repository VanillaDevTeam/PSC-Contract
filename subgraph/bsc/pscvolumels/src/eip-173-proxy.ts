import {
  OwnershipTransferred as OwnershipTransferredEvent,
  ProxyImplementationUpdated as ProxyImplementationUpdatedEvent
} from "../generated/EIP173Proxy/EIP173Proxy"
import {
  OwnershipTransferred,
  ProxyImplementationUpdated
} from "../generated/schema"

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleProxyImplementationUpdated(
  event: ProxyImplementationUpdatedEvent
): void {
  let entity = new ProxyImplementationUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousImplementation = event.params.previousImplementation
  entity.newImplementation = event.params.newImplementation

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
