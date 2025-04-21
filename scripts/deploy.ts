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
        assetId: process.env.ASSET_ID || "", // ERC20 token address
        owner: process.env.OWNER_ADDRESS || deployerAddress,
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
    console.log("Deploying VanillaMarketMakerVault implementation...");
    const marketMakerVaultImpl = await hre.viem.deployContract("VanillaMarketMakerVaultV2");
    console.log("VanillaMarketMakerVault implementation deployed to:", marketMakerVaultImpl.address);

    // Create initialize data for VanillaMarketMakerVault
    console.log("Creating VanillaMarketMakerVault proxy...");
    const initFunctionSelector = '0x485cc955'; // function selector for initialize(address,address)
    const initData = initFunctionSelector + safeConfig.assetId.slice(2).padStart(64, '0') + safeConfig.owner.slice(2).padStart(64, '0');

    // Deploy EIP173Proxy for VanillaMarketMakerVault using ethers
    console.log("Deploying EIP173Proxy for VanillaMarketMakerVault...");

    // Get the EIP173Proxy contract factory using ethers
    const eip173ProxyFactory = await ethers.getContractFactory("contracts/EIP173Proxy/solc_0.8/proxy/EIP173Proxy.sol:EIP173Proxy");
    const marketMakerVaultProxy = await eip173ProxyFactory.deploy(
        marketMakerVaultImpl.address,
        safeConfig.owner,
        initData
    );
    await marketMakerVaultProxy.waitForDeployment();

    const marketMakerVaultAddress = await marketMakerVaultProxy.getAddress() as `0x${string}`;
    console.log("VanillaMarketMakerVault proxy deployed to:", marketMakerVaultAddress);

    // Use the proxy address for subsequent operations
    // Convert the ethers contract to a viem contract by reattaching
    console.log("Connecting to VanillaMarketMakerVault through proxy...");
    const marketMakerVaultContract = await ethers.getContractAt("VanillaMarketMakerVault", marketMakerVaultAddress);

    // Deploy VanillaMoneyVault implementation
    console.log("Deploying VanillaMoneyVault implementation...");
    const moneyVaultImpl = await hre.viem.deployContract("VanillaMoneyVaultV2");
    console.log("VanillaMoneyVault implementation deployed to:", moneyVaultImpl.address);

    // Create initialize data for VanillaMoneyVault
    console.log("Creating VanillaMoneyVault proxy...");

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

    // Deploy EIP173Proxy for VanillaMoneyVault
    console.log("Deploying EIP173Proxy for VanillaMoneyVault...");
    const moneyVaultProxy = await eip173ProxyFactory.deploy(
        moneyVaultImpl.address,
        safeConfig.owner,
        moneyVaultInitData
    );
    await moneyVaultProxy.waitForDeployment();

    const moneyVaultAddress = await moneyVaultProxy.getAddress() as `0x${string}`;
    console.log("VanillaMoneyVault proxy deployed to:", moneyVaultAddress);

    // Use the proxy address for subsequent operations
    console.log("Connecting to VanillaMoneyVault through proxy...");
    const moneyVaultContract = await ethers.getContractAt("VanillaMoneyVaultV2", moneyVaultAddress);

    // Grant MONEY_VAULT_ROLE to VanillaMoneyVault in VanillaMarketMakerVault
    console.log("Granting MONEY_VAULT_ROLE to VanillaMoneyVault...");
    // Get the MONEY_VAULT_ROLE bytes32 value using ethers
    const MONEY_VAULT_ROLE = await marketMakerVaultContract.MONEY_VAULT_ROLE();
    console.log("MONEY_VAULT_ROLE:", MONEY_VAULT_ROLE);

    // Grant the role using ethers
    const grantRoleTx = await marketMakerVaultContract.grantRole(MONEY_VAULT_ROLE, moneyVaultAddress);
    await grantRoleTx.wait();
    console.log("MONEY_VAULT_ROLE granted to:", moneyVaultAddress);

    // Grant the role using ethers


    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        marketMakerVaultImpl: marketMakerVaultImpl.address,
        marketMakerVaultProxy: marketMakerVaultAddress,
        moneyVaultImpl: moneyVaultImpl.address,
        moneyVaultProxy: moneyVaultAddress,
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