// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVanillaMarketMakerVaultSlot {
    function slot1()
        external
        view
        returns (
            bool initialized,
            address assetId,
            uint256 pledgeFunds,
            uint256 cumulativeShares
        );
}

interface IVanillaMarketMakerVault is IVanillaMarketMakerVaultSlot {
    event Stake(address indexed account, uint256 indexed amount);

    event UnStake(
        address indexed account,
        uint256 indexed amount,
        uint256 shares,
        uint256 balances
    );

    event Settlement(address indexed account, uint256 revenue);

    function settlement(address account, uint256 amount) external;

    function stake(uint256 amount) external;

    function unstake() external;
}
