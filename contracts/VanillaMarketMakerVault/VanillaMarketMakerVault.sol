// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IVanillaMarketMakerVault} from "../interfaces/v2/IVanillaMarketMakerVault.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

error VanillaMarketMakerVault__InsufficientVaultBalance();
error VanillaMarketMakerVault__PledgeFundInsufficient();
error VanillaMarketMakerVault__cumulativeSharesInsufficient();
error VanillaMarketMakerVault__NotWhitelisted();
error VanillaMarketMakerVault__InvalidAmount();

contract VanillaMarketMakerVault is
    IVanillaMarketMakerVault,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 public constant ADMIN_ROLE =
        keccak256("VANILLA_MARKET_MAKER_ADMIN_ROLE");
    bytes32 public constant MONEY_VAULT_ROLE =
        keccak256("VANILLA_MONEY_VAULT_ROLE");

    struct Slot1 {
        bool initialized;
        address assetId;
        uint256 pledgedFunds;
        uint256 cumulativeShares;
    }

    struct UserInfo {
        uint256 shares;
        uint256 amounts;
    }

    Slot1 public override slot1;
    mapping(address => UserInfo) public userInfo;
    uint256 public userNumber;

    // v2.1 add
    EnumerableSet.AddressSet private stakeWhiteList;

    event WhitelistStake(address indexed account);
    event RemoveWhitelistStake(address indexed account);

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address assetId,
        address owner
    ) public virtual initializer {
        __Pausable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();
        slot1 = Slot1({
            initialized: false,
            assetId: assetId,
            pledgedFunds: 0,
            cumulativeShares: 0
        });
        require(_grantRole(ADMIN_ROLE, owner));
        _setRoleAdmin(MONEY_VAULT_ROLE, ADMIN_ROLE);
    }

    function assetsManagement() public view returns (uint256) {
        return IERC20(slot1.assetId).balanceOf(address(this));
    }

    function calculateShares(uint256 amounts) public view returns (uint256) {
        if (slot1.cumulativeShares == 0) {
            return amounts;
        } else {
            if (assetsManagement() == 0)
                revert VanillaMarketMakerVault__InsufficientVaultBalance();
            return (amounts * slot1.cumulativeShares) / assetsManagement();
        }
    }

    function calculateAmounts(uint256 shares) public view returns (uint256) {
        if (slot1.cumulativeShares == 0)
            revert VanillaMarketMakerVault__PledgeFundInsufficient();
        return (shares * assetsManagement()) / slot1.cumulativeShares;
    }

    function settlement(
        address account,
        uint256 amount
    ) external override onlyRole(MONEY_VAULT_ROLE) {
        IERC20(slot1.assetId).safeTransfer(_msgSender(), amount);

        emit Settlement(account, amount);
    }

    /// @param amount is account's deposit asset number
    function stake(
        uint256 amount
    ) external override nonReentrant whenNotPaused {
        if (!stakeWhiteList.contains(_msgSender()))
            revert VanillaMarketMakerVault__NotWhitelisted();
        uint256 shares = calculateShares(amount);
        if (userInfo[_msgSender()].amounts == 0) {
            userNumber += 1;
        }
        IERC20(slot1.assetId).safeTransferFrom(
            _msgSender(),
            address(this),
            amount
        );
        userInfo[_msgSender()].amounts += amount;
        userInfo[_msgSender()].shares += shares;
        slot1.cumulativeShares += shares;
        slot1.pledgedFunds += amount;
        if (!slot1.initialized) slot1.initialized = true;
        emit Stake(_msgSender(), amount);
    }

    function unstake() external override nonReentrant whenNotPaused {
        uint256 shares = userInfo[_msgSender()].shares;
        uint256 balances = userInfo[_msgSender()].amounts;
        uint256 amount = calculateAmounts(shares);
        if (slot1.cumulativeShares < shares)
            revert VanillaMarketMakerVault__cumulativeSharesInsufficient();
        if (assetsManagement() < amount)
            revert VanillaMarketMakerVault__InsufficientVaultBalance();
        slot1.pledgedFunds -= balances;
        slot1.cumulativeShares -= shares;
        userInfo[_msgSender()].shares = 0;
        userInfo[_msgSender()].amounts = 0;
        userNumber -= 1;
        IERC20(slot1.assetId).safeTransfer(_msgSender(), amount);
        emit UnStake(_msgSender(), amount, shares, balances);
    }

    function enablePause(bool enableOrNot) external onlyRole(ADMIN_ROLE) {
        if (enableOrNot) {
            _pause();
        } else {
            _unpause();
        }
    }

    // v2.1 add
    function whitelistStake(address account) external onlyRole(ADMIN_ROLE) {
        if (stakeWhiteList.add(account)) {
            emit WhitelistStake(account);
        }
    }

    function removeWhitelistStake(
        address account
    ) external onlyRole(ADMIN_ROLE) {
        if (stakeWhiteList.remove(account)) {
            emit RemoveWhitelistStake(account);
        }
    }

    function isWhitelisted(address account) external view returns (bool) {
        return stakeWhiteList.contains(account);
    }

    // v2.1 add
    function partialUnstake(
        uint256 amount
    ) external nonReentrant whenNotPaused {
        uint256 balances = userInfo[_msgSender()].amounts;
        if (amount == 0 || amount > balances) {
            revert VanillaMarketMakerVault__InvalidAmount();
        }
        uint256 shares = (amount * userInfo[_msgSender()].shares) / balances;
        uint256 amountToTransfer = calculateAmounts(shares);
        if (slot1.cumulativeShares < shares)
            revert VanillaMarketMakerVault__cumulativeSharesInsufficient();
        if (assetsManagement() < amountToTransfer)
            revert VanillaMarketMakerVault__InsufficientVaultBalance();
        slot1.pledgedFunds -= amount;
        slot1.cumulativeShares -= shares;
        userInfo[_msgSender()].shares -= shares;
        userInfo[_msgSender()].amounts -= amount;

        if (userInfo[_msgSender()].amounts == 0) {
            userNumber -= 1;
        }

        IERC20(slot1.assetId).safeTransfer(_msgSender(), amountToTransfer);
        emit UnStake(_msgSender(), amountToTransfer, shares, amount);
    }
}
