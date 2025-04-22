// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IVanillaMoneyVault} from "../interfaces/v2/IVanillaMoneyVault.sol";
import {IVanillaMarketMakerVault} from "../interfaces/v2/IVanillaMarketMakerVault.sol";
import {VanillaMoneyVault} from "./VanillaMoneyVault.sol";

contract VanillaMoneyVaultV2 is VanillaMoneyVault {
    using SafeERC20 for IERC20;

    // v2 add
    bool public hasAddDefaultAdmin;
    // v2.1 add
    mapping(address => uint256) public hasSignedIn;

    event DailySignIn(address indexed user, uint256 timestamp);

    // v2 add
    function initialize(
        address assetId,
        address owner,
        address marketMakerVault,
        address platformFeeAccount,
        address profitSharingAccount,
        address[] calldata bots
    ) public override initializer {
        super.initialize(
            assetId,
            owner,
            marketMakerVault,
            platformFeeAccount,
            profitSharingAccount,
            bots
        );
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

    function dailySignIn() external {
        emit DailySignIn(msg.sender, block.timestamp);
    }
}
