import hre from "hardhat";
import fs from "fs";
import path from "path";
import { encodeFunctionData } from "viem";
async function main() {
    const networkName = hre.network.name;
    console.log(`Verifying contracts on ${networkName}...`);
    console.log(`Using API Key: ${process.env.BSCSCAN_API_KEY ? '✅ API key is set' : '❌ API key is missing'}`);

    // Find deployment file for the current network
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        console.error("Deployments directory not found");
        return;
    }

    // Get all deployment files for the current network
    const deploymentFiles = fs.readdirSync(deploymentsDir)
        .filter(file => file.startsWith(networkName) && file.endsWith(".json"));

    if (deploymentFiles.length === 0) {
        console.error(`No deployment files found for network ${networkName}`);
        return;
    }

    // Use the most recent deployment file
    const mostRecentFile = deploymentFiles
        .sort((a, b) => {
            const timeA = a.split("-").slice(1).join("-").replace(".json", "");
            const timeB = b.split("-").slice(1).join("-").replace(".json", "");
            return new Date(timeA).getTime() - new Date(timeB).getTime();
        })[deploymentFiles.length - 1];

    const deploymentPath = path.join(deploymentsDir, mostRecentFile);
    console.log(`Using deployment file: ${deploymentPath}`);

    // Load deployment data
    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const {
        marketMakerVaultImpl,
        marketMakerVaultProxy,
        moneyVaultImpl,
        moneyVaultProxy,
        assetId,
        owner,
        platformFeeAccount,
        profitSharingAccount,
        bots
    } = deploymentData;

    console.log("Creating VanillaMarketMakerVault proxy...");
    const initFunctionSelector = '0x485cc955'; // function selector for initialize(address,address)
    const initData = initFunctionSelector + assetId.slice(2).padStart(64, '0') + owner.slice(2).padStart(64, '0');

    // Verify implementation contracts
    console.log("\nVerifying implementation contracts:");

    // Verify VanillaMarketMakerVault implementation
    console.log(`\nVerifying VanillaMarketMakerVault implementation at ${marketMakerVaultImpl}...`);
    try {
        await hre.run("verify:verify", {
            address: marketMakerVaultImpl,
            constructorArguments: [],
        });
        console.log("✅ VanillaMarketMakerVault implementation verified successfully");
    } catch (error) {
        console.error("❌ Error verifying VanillaMarketMakerVault implementation:", error);

        // Try to check if the contract is already verified
        console.log("Checking if contract is already verified...");
        console.log(`Explorer URL: https://opbnb.bscscan.com/address/${marketMakerVaultImpl}#code`);
    }

    // Verify VanillaMoneyVault implementation
    console.log(`\nVerifying VanillaMoneyVault implementation at ${moneyVaultImpl}...`);
    try {
        await hre.run("verify:verify", {
            address: moneyVaultImpl,
            constructorArguments: [],
        });
        console.log("✅ VanillaMoneyVault implementation verified successfully");
    } catch (error) {
        console.error("❌ Error verifying VanillaMoneyVault implementation:", error);
        console.log(`Explorer URL: https://opbnb.bscscan.com/address/${moneyVaultImpl}#code`);
    }

    // Verify EIP173Proxy implementation
    console.log(`\nVerifying EIP173Proxy implementation at ${marketMakerVaultProxy}...`);
    try {
        await hre.run("verify:verify", {
            address: marketMakerVaultProxy,
            constructorArguments: ["0xfdeec30b1829b28417c274ff86e9cf28e8451c63", owner, initData],
        });
        console.log("✅ EIP173Proxy implementation verified successfully");
    } catch (error) {
        console.error("❌ Error verifying EIP173Proxy implementation:", error);
        console.log(`Explorer URL: https://opbnb.bscscan.com/address/${marketMakerVaultProxy}#code`);
    }

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
            assetId,
            owner,
            marketMakerVaultProxy,
            platformFeeAccount,
            profitSharingAccount,
            bots
        ]
    });

    // Verify EIP173Proxy implementation
    console.log(`\nVerifying EIP173Proxy implementation at ${moneyVaultProxy}...`);
    try {
        await hre.run("verify:verify", {
            address: moneyVaultProxy,
            constructorArguments: ["0x65f5c034374c9f0b8dcb7b073b04940b95ee60f9", owner, moneyVaultInitData],
        });
        console.log("✅ EIP173Proxy implementation verified successfully");
    } catch (error) {
        console.error("❌ Error verifying EIP173Proxy implementation:", error);
        console.log(`Explorer URL: https://opbnb.bscscan.com/address/${moneyVaultProxy}#code`);
    }




    console.log("\nVerification process for implementation contracts completed");
    console.log("\nNOTE: You may need to verify the proxy contracts manually through the explorer if auto-verification fails");
    console.log(`VanillaMarketMakerVault Proxy: https://opbnb.bscscan.com/address/${marketMakerVaultProxy}#code`);
    console.log(`VanillaMoneyVault Proxy: https://opbnb.bscscan.com/address/${moneyVaultProxy}#code`);

    console.log("\nTo verify a proxy contract manually using BscScan's UI:");
    console.log("1. Go to the contract address on BscScan");
    console.log("2. Click on the 'Contract' tab");
    console.log("3. Click 'Verify and Publish'");
    console.log("4. Select 'Solidity (Single file)' as compiler type");
    console.log("5. Enter compiler version 0.8.28");
    console.log("6. Select optimization: Yes with 200 runs");
    console.log("7. Enter contract name: EIP173Proxy");
    console.log("8. Paste the source code from contracts/EIP173Proxy/solc_0.8/proxy/EIP173Proxy.sol");
    console.log("9. Click 'Verify and Publish'");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 