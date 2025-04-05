// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IVanillaMoneyVault} from "../interfaces/v2/IVanillaMoneyVault.sol";
import {IVanillaMarketMakerVault} from "../interfaces/v2/IVanillaMarketMakerVault.sol";

error VanillaMoneyVault__InsufficientBalance();
error VanillaMoneyVault__PledgeFundInsufficient();
error VanillaMoneyVault__AlreadyExistOrder(bytes32 orderId);
error VanillaMoneyVault__AlreadySettleOrder(bytes32 orderId);

contract VanillaMoneyVault is
    IVanillaMoneyVault,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE =
        keccak256("VANILLA_MONEY_VAULT_ADMIN_ROLE");
    bytes32 public constant BOT_ROLE =
        keccak256("VANILLA_MONEY_VAULT_BOT_ROLE");

    struct Slot0 {
        address assetId;
        address marketMakerVault;
        address platformFeeAccount;
        address profitSharingAccount;
    }

    struct OrderInfo {
        address owner;
        bool isSettlement;
        bool isExistence;
        uint256 amount;
    }

    Slot0 public slot0;
    mapping(address => uint256) public balances;
    mapping(bytes32 => OrderInfo) public orderInfo;

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address assetId,
        address owner,
        address marketMakerVault,
        address platformFeeAccount,
        address profitSharingAccount,
        address[] calldata bots
    ) public virtual initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        require(_grantRole(ADMIN_ROLE, owner));
        _setRoleAdmin(BOT_ROLE, ADMIN_ROLE);
        slot0 = Slot0({
            assetId: assetId,
            marketMakerVault: marketMakerVault,
            platformFeeAccount: platformFeeAccount,
            profitSharingAccount: profitSharingAccount
        });
        for (uint256 idx = 0; idx < bots.length; idx++) {
            _grantRole(BOT_ROLE, bots[idx]);
        }
        (, address marketMakerVaultAssetId, , ) = IVanillaMarketMakerVault(
            marketMakerVault
        ).slot1();
        assert(assetId == marketMakerVaultAssetId);
    }

    function updateSlot0(
        address platformFeeAccount,
        address profitSharingAccount
    ) external onlyRole(ADMIN_ROLE) {
        slot0.platformFeeAccount = platformFeeAccount;
        slot0.profitSharingAccount = profitSharingAccount;

        emit UpdateSlot0(platformFeeAccount, profitSharingAccount);
    }

    function depositFund(uint256 amount) external override nonReentrant {
        IERC20(slot0.assetId).safeTransferFrom(
            _msgSender(),
            address(this),
            amount
        );
        balances[_msgSender()] += amount;

        emit DepositFund(_msgSender(), amount);
    }

    function withdrawFund(uint256 amount) external override nonReentrant {
        if (balances[_msgSender()] < amount)
            revert VanillaMoneyVault__PledgeFundInsufficient();
        balances[_msgSender()] -= amount;
        IERC20(slot0.assetId).safeTransfer(_msgSender(), amount);

        emit WithdrawFund(_msgSender(), amount);
    }

    function createOrder(
        CreateOrderParams calldata params
    ) external override onlyRole(BOT_ROLE) {
        if (balances[params.account] < params.amount)
            revert VanillaMoneyVault__PledgeFundInsufficient();
        if (orderInfo[params.orderId].isExistence)
            revert VanillaMoneyVault__AlreadyExistOrder(params.orderId);
        orderInfo[params.orderId] = OrderInfo({
            owner: params.account,
            isSettlement: false,
            isExistence: true,
            amount: params.amount
        });
        balances[params.account] -= params.amount;
        if (slot0.platformFeeAccount != address(0)) {
            if (params.fee > 0) {
                balances[params.account] -= params.fee;
                IERC20(slot0.assetId).safeTransfer(
                    slot0.platformFeeAccount,
                    params.fee
                );
                emit PlatformCollectFee(slot0.platformFeeAccount, params.fee);
            }
        }

        emit CreateOrder(params.account, params.orderId, params);
    }

    function settleOrder(
        bytes32 orderId,
        uint256 revenue,
        uint256 fee
    ) public override onlyRole(BOT_ROLE) {
        if (orderInfo[orderId].isSettlement)
            revert VanillaMoneyVault__AlreadySettleOrder(orderId);
        orderInfo[orderId].isSettlement = true;
        address account = orderInfo[orderId].owner;
        // transfer
        IERC20(slot0.assetId).safeTransfer(
            slot0.marketMakerVault,
            orderInfo[orderId].amount
        );

        IVanillaMarketMakerVault(slot0.marketMakerVault).settlement(
            account,
            revenue + fee
        );
        balances[account] += revenue;
        if (fee > 0) {
            IERC20(slot0.assetId).safeTransfer(slot0.profitSharingAccount, fee);
            emit ProfitSharingCollectFee(slot0.profitSharingAccount, fee);
        }

        emit SettleOrder(account, orderId, revenue);
    }

    function batchSettleOrders(
        BatchSettleOrder[] calldata orders
    ) external override {
        for (uint idx = 0; idx < orders.length; idx++) {
            settleOrder(
                orders[idx].orderId,
                orders[idx].revenue,
                orders[idx].fee
            );
        }
    }
}
