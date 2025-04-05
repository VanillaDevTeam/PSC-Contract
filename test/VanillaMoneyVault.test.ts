import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("VanillaMoneyVault", function () {
    // Set up test wallets with specific roles
    const TEST_ADDRESSES = {
        owner: "0x36cd0275746cdee559c73208c093fd32638e1640" as `0x${string}`, // Example address - replace with your own
        bot: "0x36cd0275746cdee559c73208c093fd32638e1640" as `0x${string}`, // Example address - replace with your own
        user: "0x36cd0275746cdee559c73208c093fd32638e1640" as `0x${string}`, // Example address - replace with your own
        platformFee: "0x36cd0275746cdee559c73208c093fd32638e1640" as `0x${string}`, // Example address
        profitSharing: "0x36cd0275746cdee559c73208c093fd32638e1640" as `0x${string}` // Example address
    };

    // Setup for the test environment
    async function setupVanillaMoneyVaultTest() {
        // Get the deployed VanillaMoneyVault contract
        const vanillaMoneyVaultAddress = "0xdEDD33CF842571358F717C0033BF7cC3CB6abff1";

        // Get the VanillaMoneyVault contract with correct ABI
        const vanillaMoneyVault = await hre.viem.getContractAt(
            "VanillaMoneyVaultV2",
            vanillaMoneyVaultAddress
        );

        const publicClient = await hre.viem.getPublicClient();

        return {
            vanillaMoneyVault,
            publicClient,
            TEST_ADDRESSES
        };
    }

    describe("CreateOrder", function () {
        // it("Should create an order successfully", async function () {
        //     const {
        //         vanillaMoneyVault,
        //         publicClient,
        //         TEST_ADDRESSES
        //     } = await setupVanillaMoneyVaultTest();

        //     // Define orderId as a proper 0x-prefixed hex string
        //     const orderId = "0x1234567890123456789012345678901234567890123456789012345678901234" as `0x${string}`;
        //     const orderAmount = parseEther("50");
        //     const fee = parseEther("1");
        //     //grant bot role to user
        //     const botRole = await vanillaMoneyVault.read.BOT_ROLE();
        //     const grantBotRoleTx = await vanillaMoneyVault.write.grantRole([botRole, TEST_ADDRESSES.user]);
        //     await publicClient.waitForTransactionReceipt({ hash: grantBotRoleTx });

        //     const createOrderParams = {
        //         account: TEST_ADDRESSES.user,
        //         orderId: orderId,
        //         amount: orderAmount,
        //         fee: fee,
        //         quote_currency: "0x6574680000000000000000000000000000000000000000000000000000000000" as `0x${string}`, // "eth" in bytes32
        //         delivery_type: 1n,
        //         position_type: 1n,
        //         quantity: parseEther("1"),
        //         delivery: BigInt(Math.floor(Date.now() / 1000) + 86400), // 1 day from now
        //         strike_price: parseEther("2000"),
        //         sheet: 1n,
        //         created_at: BigInt(Math.floor(Date.now() / 1000)),
        //     };

        //     // Fund the user's account first (prerequisite for creating an order)
        //     // This assumes the user has already deposited funds
        //     const userBalance = await vanillaMoneyVault.read.balances([TEST_ADDRESSES.user]);
        //     console.log(`User balance before creating order: ${userBalance}`);

        //     try {
        //         // Execute createOrder - using default wallet account
        //         // Note: Make sure the account used has BOT_ROLE in the contract
        //         const hash = await vanillaMoneyVault.write.createOrder([createOrderParams]);
        //         await publicClient.waitForTransactionReceipt({ hash });

        //         // Verify order was created
        //         const order = await vanillaMoneyVault.read.orderInfo([orderId]);

        //         // Log order details
        //         console.log("Order created:", {
        //             owner: order[0],
        //             isSettlement: order[1],
        //             isExistence: order[2],
        //             amount: order[3]
        //         });

        //         // Verify the order exists and belongs to the user
        //         expect(order[2]).to.be.true; // isExistence
        //         expect(order[0]).to.equal(TEST_ADDRESSES.user); // owner
        //     } catch (error) {
        //         console.error("Error creating order:", error);
        //         throw error;
        //     }
        // });

        it("should settle order successfully", async function () {
            const {
                vanillaMoneyVault,
                publicClient,
                TEST_ADDRESSES
            } = await setupVanillaMoneyVaultTest();

            const settleOrderParams = {
                orderId: "0x1234567890123456789012345678901234567890123456789012345678901234" as `0x${string}`
            };

            const settleOrderTx = await vanillaMoneyVault.write.settleOrder([settleOrderParams.orderId, BigInt(0), BigInt(0)]);
            await publicClient.waitForTransactionReceipt({ hash: settleOrderTx });

            const order = await vanillaMoneyVault.read.orderInfo([settleOrderParams.orderId]);
            expect(order[2]).to.be.false; // isExistence


        });
    });
}); 