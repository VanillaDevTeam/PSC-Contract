// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IVanillaMarketMakerVault} from "../interfaces/v2/IVanillaMarketMakerVault.sol";
import {VanillaMarketMakerVault} from "./VanillaMarketMakerVault.sol";

contract VanillaMarketMakerVaultV2 is VanillaMarketMakerVault {
    using SafeERC20 for IERC20;

    // v2 add
    bool public hasAddDefaultAdmin;

    function initialize(
        address assetId,
        address owner
    ) public override initializer {
        super.initialize(assetId, owner);
    }

    // v2 add
    function addDefaultAdmin(address owner) external onlyRole(ADMIN_ROLE) {
        // can be invoked at most once
        if (!hasAddDefaultAdmin) {
            _grantRole(DEFAULT_ADMIN_ROLE, owner);
            hasAddDefaultAdmin = true;
        } else {
            revert("only once");
        }
    }
}
