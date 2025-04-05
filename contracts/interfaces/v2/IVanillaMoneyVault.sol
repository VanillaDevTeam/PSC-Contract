// SPDX-License-Identifier:MIT
pragma solidity ^0.8.28;

interface IVanillaMoneyVault {
    struct CreateOrderParams {
        address account;
        bytes32 orderId;
        uint256 amount;
        uint256 fee;
        bytes32 quote_currency;
        uint256 delivery_type;
        uint256 position_type;
        uint256 quantity;
        uint256 delivery;
        uint256 strike_price;
        uint256 sheet;
        uint256 created_at;
    }
    event DepositFund(address indexed account, uint256 amount);

    event WithdrawFund(address indexed account, uint256 amount);

    event BuyTicket(address indexed account, uint256 amount);

    event CancelTicket(address indexed account, uint256 amount);

    event CreateOrder(
        address indexed account,
        bytes32 indexed orderId,
        CreateOrderParams params
    );

    event SettleOrder(
        address indexed account,
        bytes32 indexed orderId,
        uint256 revenue
    );

    event UpdateSlot0(
        address indexed platformFeeAccount,
        address indexed profitSharingAccount
    );

    event PlatformCollectFee(
        address indexed platformFeeAccount,
        uint256 indexed amount
    );

    event ProfitSharingCollectFee(
        address indexed profitSharingAccount,
        uint256 indexed amount
    );

    struct BatchSettleOrder {
        bytes32 orderId;
        uint256 revenue;
        uint256 fee;
    }

    function depositFund(uint256 amount) external;

    function withdrawFund(uint256 amount) external;

    function createOrder(CreateOrderParams calldata params) external;

    function settleOrder(
        bytes32 orderId,
        uint256 revenue,
        uint256 fee
    ) external;

    function batchSettleOrders(BatchSettleOrder[] calldata orders) external;
}
