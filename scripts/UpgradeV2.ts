import { parseEther, encodeFunctionData, getAbiItem, keccak256, toHex } from "viem";
import hre from "hardhat";
import fs from "fs";
import { ethers } from "hardhat";

async function main() {
    const [deployer] = await hre.viem.getWalletClients();
    const deployerAddress = deployer.account.address;
    console.log("Deploying contracts with the account:", deployerAddress);

    // Configuration
    // Replace these values with your actual configuration
    const config = {
        assetId: "0x55d398326f99059fF775485246999027B3197955", // ERC20 token address
        owner: process.env.OWNER_ADDRESS || deployerAddress,
        eip173ProxyMoneyVaultAddress: "0x994B9a6c85E89c42Ea7cC14D42afdf2eA68b72F1",
        eip173ProxyMarketMakerVaultAddress: "0xaAd5005D2EF036d0a8b0Ab5322c852e55d9236cF",
        platformFeeAccount: process.env.PLATFORM_FEE_ACCOUNT || deployerAddress,
        profitSharingAccount: process.env.PROFIT_SHARING_ACCOUNT || deployerAddress,
        bots: (process.env.BOT_ADDRESSES || "").split(",").filter(address => address.trim() !== ""),
    };

    if (!config.assetId) {
        throw new Error("ASSET_ID environment variable is required");
    }

    // Ensure all addresses are properly formatted with 0x prefix
    const ensureAddress = (address: string): `0x${string}` => {
        if (!address.startsWith('0x')) {
            return `0x${address}` as `0x${string}`;
        }
        return address as `0x${string}`;
    };

    const safeConfig = {
        assetId: ensureAddress(config.assetId),
        owner: ensureAddress(config.owner),
        platformFeeAccount: ensureAddress(config.platformFeeAccount),
        profitSharingAccount: ensureAddress(config.profitSharingAccount),
        bots: config.bots.map(ensureAddress),
    };

    console.log("Deployment configuration:");
    console.log("Asset ID:", safeConfig.assetId);
    console.log("Owner:", safeConfig.owner);
    console.log("Platform Fee Account:", safeConfig.platformFeeAccount);
    console.log("Profit Sharing Account:", safeConfig.profitSharingAccount);
    console.log("Bots:", safeConfig.bots);

    // Deploy VanillaMarketMakerVault implementation
    console.log("Deploying VanillaMarketMakerVaultV2 implementation...");
    const marketMakerVaultImpl = await hre.viem.deployContract("VanillaMarketMakerVaultV2");
    console.log("VanillaMarketMakerVaultV2 implementation deployed to:", marketMakerVaultImpl.address);

    // get EIP173Proxy for VanillaMarketMakerVault
    console.log("get EIP173Proxy for VanillaMarketMakerVaultV2...");
    const eip173ProxyMarketMakerVault = await hre.viem.getContractAt("EIP173Proxy", config.eip173ProxyMarketMakerVaultAddress as `0x${string}`);
    await eip173ProxyMarketMakerVault.write.upgradeTo([marketMakerVaultImpl.address as `0x${string}`]);

    const marketMakerVaultAddress = eip173ProxyMarketMakerVault.address;

    // Deploy VanillaMoneyVault implementation
    console.log("Deploying VanillaMoneyVaultV2 implementation...");
    const moneyVaultImpl = await hre.viem.deployContract("VanillaMoneyVaultV2");
    console.log("VanillaMoneyVaultV2 implementation deployed to:", moneyVaultImpl.address);

    // Create initialize data for VanillaMoneyVault
    console.log("Creating VanillaMoneyVaultV2 proxy...");

    // Use viem's encodeFunctionData instead of manual encoding
    const moneyVaultInitData = encodeFunctionData({
        abi: [
            {
                type: 'function',
                name: 'initialize',
                inputs: [
                    { type: 'address', name: 'assetId' },
                    { type: 'address', name: 'owner' },
                    { type: 'address', name: 'marketMakerVault' },
                    { type: 'address', name: 'platformFeeAccount' },
                    { type: 'address', name: 'profitSharingAccount' },
                    { type: 'address[]', name: 'bots' }
                ],
                outputs: [],
                stateMutability: 'nonpayable'
            }
        ],
        functionName: 'initialize',
        args: [
            safeConfig.assetId,
            safeConfig.owner,
            marketMakerVaultAddress,
            safeConfig.platformFeeAccount,
            safeConfig.profitSharingAccount,
            safeConfig.bots
        ]
    });

    // get EIP173Proxy for VanillaMoneyVault
    console.log("get EIP173Proxy for VanillaMoneyVaultV2...");
    const eip173ProxyMoneyVault = await hre.viem.getContractAt("EIP173Proxy", config.eip173ProxyMoneyVaultAddress as `0x${string}`);
    await eip173ProxyMoneyVault.write.upgradeTo([moneyVaultImpl.address as `0x${string}`]);


    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        marketMakerVaultImpl: marketMakerVaultImpl.address,
        marketMakerVaultProxy: marketMakerVaultAddress,
        moneyVaultImpl: moneyVaultImpl.address,
        moneyVaultProxy: eip173ProxyMoneyVault.address,
        assetId: safeConfig.assetId,
        owner: safeConfig.owner,
        platformFeeAccount: safeConfig.platformFeeAccount,
        profitSharingAccount: safeConfig.profitSharingAccount,
        bots: safeConfig.bots,
        deploymentTime: new Date().toISOString(),
    };

    // Create deployments directory if it doesn't exist
    if (!fs.existsSync("./deployments")) {
        fs.mkdirSync("./deployments");
    }

    fs.writeFileSync(
        `./deployments/${hre.network.name}-${new Date().toISOString().replace(/:/g, "-")}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("Deployment completed successfully!");
    console.log("Deployment info saved to deployments directory");
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 