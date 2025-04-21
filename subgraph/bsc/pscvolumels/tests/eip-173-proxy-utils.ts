import { newMockEvent } from "matchstick-as"
import { ethereum, Address } from "@graphprotocol/graph-ts"
import {
  OwnershipTransferred,
  ProxyImplementationUpdated
} from "../generated/EIP173Proxy/EIP173Proxy"

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createProxyImplementationUpdatedEvent(
  previousImplementation: Address,
  newImplementation: Address
): ProxyImplementationUpdated {
  let proxyImplementationUpdatedEvent =
    changetype<ProxyImplementationUpdated>(newMockEvent())

  proxyImplementationUpdatedEvent.parameters = new Array()

  proxyImplementationUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "previousImplementation",
      ethereum.Value.fromAddress(previousImplementation)
    )
  )
  proxyImplementationUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newImplementation",
      ethereum.Value.fromAddress(newImplementation)
    )
  )

  return proxyImplementationUpdatedEvent
}
